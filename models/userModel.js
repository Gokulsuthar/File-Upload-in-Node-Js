import mongoose from "mongoose"
import validator from "validator"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provoide a name"],
        minlength: [1, "name must have more or equal to 1 characters"]
    },
    email: {
        type: String,
        required: [true, "Please provoide a email"],
        unique: true,
        validate: [validator.isEmail, "Please provide a valid email address"],
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        default: "user"
    },
    password: {
        type: String,
        required: [true, "Please provoide a password"],
        minlength: 8,
        select: false,
        trim: true
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please confirm your password"],
        select: false,
        validate: {
            validator: function(passwordConfirm) {
                return passwordConfirm === this.password 
            },
            message: "Passwords are not the same"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 12)
    this.passwordConfirm = undefined
    next()
})

userSchema.pre("save", function(next) {
    if(!this.isModified("password") || this.isNew ) return next()
    this.passwordChangedAt = Date.now() - 1000
    next()
})

userSchema.methods.correctPassword = async function(candidatePass, userPass) {
    return await bcrypt.compare(candidatePass, userPass)
}

userSchema.methods.changedPasswordAfter = async function(JWTTimeStamp) {
    if (this.passwordChangedAt) {
        return JWTTimeStamp <  this.passwordChangedAt.getTime() / 1000
    }
    return false
}

userSchema.pre(/^find/, function(next) {
    this.find({active: {$ne: false}})
    next()
})

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex")
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000
    return resetToken
}

const User = mongoose.model("User", userSchema)

export default User