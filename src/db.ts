import dotenv from "dotenv";
import mongoose, {model, Schema} from "mongoose";

dotenv.config();
const MONGO_URL = process.env.MONGODB_URI || "mongodb://localhost:27017/brainly";
mongoose.connect(MONGO_URL);

const UserSchema = new Schema({
    username: {type: String, unique: true},
    password: String
})

export const UserModel = model("User",UserSchema);

const ContentSchema = new Schema({
    title: String,
    link: String,
    tags:[{type: mongoose.Types.ObjectId, ref: 'Tag'}],
    type:String,
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true}
})

const LinkSchema = new Schema({
    hash: String,
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true}
})

export const LinkModel = model("Links", LinkSchema)
export const ContentModel = model("Content",ContentSchema);