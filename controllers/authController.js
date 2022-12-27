import User from "../models/userModel.js"
import { promisify } from "util"
import jwt from "jsonwebtoken"
import AppError from "../utils/appError.js"
import _ from "lodash"
import catchAsync from "../utils/catchAsync.js"
import Email from "../utils/email.js"
import dotenv from "dotenv"
import crypto from "crypto"

dotenv.config({ path: "./config.env"})

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)

    const cookieOptions = {
        expiresIn: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if(process.env.NODE_ENV === "production") cookieOptions.secure = true

    res.cookie("jwt", token, cookieOptions)

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    })
}

const logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    res.status(200).json({ status: 'success' });
  };

const signToken = (id) => {
    return jwt.sign({_id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const signup = catchAsync(async(req, res, next) => {
    const user = await User.create(req.body)

    createSendToken(user, 201, res)
})

const login = catchAsync(async(req, res, next) => {
    const { email, password } = req.body

    if(_.isEmpty(email) || _.isEmpty(password)) {
        return next(new AppError("Please provide email and password!", 400))
    }

    const user = await User.findOne({ email }).select("+password")

    if(_.isEmpty(user) || !await user.correctPassword(password, user.password) ) {
        return next(new AppError("Incorrect email or password!", 401))
    }

    const token = signToken(user._id)

    res.status(200).json({
        status: "success",
        token,
    })

})

const protect = catchAsync(async(req, res , next) => {
    let token
    if(
        !_.isEmpty(req.headers.authorization) &&
         req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1]
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }
    
    if(_.isEmpty(token)) {
        return next(new AppError("You are not logged in! Please login to get acesss.", 401))
    }

    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    const user = await User.findById(decode._id)

    if(_.isEmpty(user)) {
        return next(new AppError("The user belonging to this token does no longer exist!", 401))
    }

    if (await user.changedPasswordAfter(decode.iat)) {
        return next(new AppError("User recently changed password! Please login again.", 401))
    }

    req.user = user
    res.locals.user = user;

    next()
})

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {  
            next(new AppError("You do not have permission to perform this action!", 403))
        }
        next()
    }
}

const forgotPassword = catchAsync(async(req, res, next) => {
    const email = req.body.email
    if(_.isEmpty(email)) {
        return next(new AppError("Please provide email!", 404))
    }

    const user = await User.findOne({ email})
    if(_.isEmpty(user)) {
        return next(new AppError("There is no user with this email address!", 404))
    }

    const resetToken = await user.createPasswordResetToken()
    await user.save({validateBeforeSave: false})

    try {
        await new Email(user.email, resetToken).sendPasswordReset();
  
        res.status(201).json({
          status: "success",
          message: "Password reset token has been send to your email address which is valid for 10min from now!"
        });
      } catch (err) {
        console.log(err);
  
        return next(new AppError("There was an error sending the email. Try again later!"), 500);
    }
})


const resetPassword = catchAsync( async(req, res, next) => {
    const resetToken = req.params.resetToken

    const { password, passwordConfirm } = req.body

    if(_.isEmpty(resetToken)) {
        return next(new AppError("Please provide passsword reset token!", 404))
    }

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } } )

    if(_.isEmpty(user)) {
        return next(new AppError("Token is invalid or has expired!", 400))
    }

    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.password = password
    user.passwordConfirm = passwordConfirm

    await user.save()

    const token = signToken(user._id)

    res.status(200).json({
        status: "success",
        token,
    })
})

const updatePassword = catchAsync(async (req, res, next) => {

    if(_.isEmpty(req.body.currentPassword)) {
        return next(new AppError("Please provide your current password!", 404))
    }

    const user = await User.findById(req.user.id).select("+password")

    if(!await req.user.correctPassword(req.body.currentPassword, user.password)) {
        return next(new AppError("Your current password is wrong!", 401))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()
    
    createSendToken(user, 200, res)
})

export default {
    signup,
    login,
    protect,
    restrictTo,
    forgotPassword,
    resetPassword,
    updatePassword,
    logout
}