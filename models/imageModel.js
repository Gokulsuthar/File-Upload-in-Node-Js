import mongoose from "mongoose";

const imageSchema = mongoose.Schema({
    image: {
        type: Buffer,
        required: [true, "Please provide an Image."]
    }
})

const Image = mongoose.model("Image", imageSchema);

export default Image