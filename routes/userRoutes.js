import express from "express"
import authController from "../controllers/authController.js"
import fileUploadController from "../controllers/fileUploadController.js"

const router = express.Router()

router.post("/signup", authController.signup)
router.post("/login", authController.login)
router.get('/logout', authController.logout)

router.post("/forgotPassword", authController.forgotPassword)
router.post("/resetPassword/:resetToken", authController.resetPassword)

router.use(authController.protect, authController.restrictTo("user"))

router.post("/updateMyPassword", authController.updatePassword)

//image
router.post("/uploadImage",  fileUploadController.uploadImgMul.single("image"), fileUploadController.uploadImage)
router.route("/image/:id").get(fileUploadController.getImage).delete(fileUploadController.deleteImage)

//video
router.post("/uploadVideo",  fileUploadController.uploadVidMul, fileUploadController.uploadVideo)
router.route("/video/:videoId").get(fileUploadController.watchVideo).delete(fileUploadController.deleteVideo)

export default router