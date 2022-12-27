import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide name of the video."]
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "Business"
    } 
});

const Video = mongoose.model("Video", videoSchema);

export default Video;