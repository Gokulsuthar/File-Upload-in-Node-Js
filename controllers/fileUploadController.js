import catchAsync from "../utils/catchAsync.js"
import AppError from "../utils/appError.js";
import { gfs } from "../server.js";
import Image from "../models/imageModel.js";
import Video from "../models/videoModel.js";
import crypto from "crypto"
import _ from "lodash"
import sharp from "sharp"
import multer from "multer";

import { GridFsStorage } from "multer-gridfs-storage";
import path from "path";

const storage = new GridFsStorage({
  url: process.env.MONGODB_LOCAL,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if(err) return reject(err)
        const filename =  buf.toString("hex") + path.extname(file.originalname)
        const fileInfo = {
          filename,
          bucketName: "uploads"
        }
        resolve(fileInfo)
      })
    })
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype == "video/mp4" || file.mimetype == "video/x-msvideo" || file.mimetype == "video/quicktime" || file.mimetype == "video/x-matroska") {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new AppError('Only .mov, .mp4, .avi and .mkv format allowed!', 400));
  }
}

const uploadVidMul = multer({ storage, fileFilter }).single("video");

const uploadVideo = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please provide a video!", 404));
  }

  const video = await Video.create({
    name: req.file.filename,
    userId: req.user.id,
  });

  res.status(200).json({
    status: "success",
    videoId: video.id,
  });
});

const watchVideo = catchAsync(async (req, res, next) => {
  const { videoId } = req.params;

  if (!videoId) {
    return next(new AppError("Please provide videoId!", 400));
  }

  const vid = await Video.findById(videoId);

  if(!vid) {
    return next(new AppError("Video not found!", 404))
  }

  const vidName = vid.name

  const chuck = await gfs.find({ filename: vidName }).toArray()
  
  if(chuck[0].contentType == "video/mp4" || chuck[0].contentType == "video/x-msvideo" || chuck[0].contentType == "video/quicktime" || chuck[0].contentType == "video/x-matroska") {
    gfs.openDownloadStreamByName(vidName).pipe(res)
  } else {
    return next(new AppError("Not a video or unsupported video format!", 400))
  }
});

const deleteVideo = catchAsync(async (req, res, next) => {
  const { videoId } = req.params;

  if (!videoId) {
    return next(new AppError("Please provide videoId!", 400));
  }
  
  const vid = await Video.findByIdAndDelete(videoId);

  if(!vid) {
    return next(new AppError("Video not found!", 404))
  }

  const vidName = vid.name

  const chuck = await gfs.find({ filename: vidName }).toArray()
  
  if(_.isEmpty(chuck)) {
    return next(new AppError("Video not found!", 404))
  }

  await gfs.delete(chuck[0]._id)

  res.status(204).json({
    status: "success",
    data: null
  })
});

//image

const uploadImgMul = multer({
    limits: {
        fieldSize: 100000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
            return cb(new AppError("Please upload an image.", 400))
        }

        cb(undefined, true)
    }
})

const uploadImage = catchAsync (async (req, res, next) => {
    if(_.isEmpty(req.file)) {
        return next(new AppError("Please provide an Image!", 400))
    }

    const buffer = await sharp(req.file.buffer).png().toBuffer()

    const image = await Image.create({
        image: buffer
    })

    res.status(200).json({
        status: "success",
        image: image._id
    });
})

const getImage = catchAsync ( async (req, res, next) => {
    if(_.isEmpty(req.params.id)) {
        return next(new AppError("Please provide /:id"))
    }

    let image = await Image.findById(req.params.id)
    
    if(!image || !image.image) {
        return next(new AppError("Image not found!", 404))
    }

    const imgMetaData = await sharp(image.image).metadata()
    
    image = await sharp(image.image).resize({ width: parseInt(req.body.width ) || imgMetaData.width, height: parseInt(req.body.height) || imgMetaData.height }).toBuffer()

    res.set('Content-Type', 'image/png')
    res.status(200).send(image)
})

const deleteImage = catchAsync ( async (req, res, next) => {
    if(_.isEmpty(req.params.id)) {
        return next(new AppError("Please provide /:id"))
    }

    let image = await Image.findByIdAndDelete(req.params.id)
    
    if(!image || !image.image) {
        return next(new AppError("Image not found!", 404))
    }

    res.status(204).json({
        status: "success",
        data: null
    })
})

export default {
    uploadImage,
    getImage,
    deleteImage,
    uploadImgMul,
    uploadVidMul,
    uploadVideo,
    watchVideo,
    deleteVideo
};