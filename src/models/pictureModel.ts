import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

type User = {
  user_id: string,
  username: string
}

export interface IPicture extends Document {
  picture_id: string;
  author: User;
  created_at: string;
  updated_at: string;
  name: string;
  picture_data: string[][];
}

const pictureSchema: Schema = new Schema({
  picture_id: {
    type: String,
    required: true,
    default: uuidv4,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  created_at: {
    type: String,
    required: true,
  },
  updated_at: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  picture_data: {
    type: [[String]],
    required: true,
  },
});

const Picture = mongoose.model<IPicture>("Picture", pictureSchema);

export default Picture;
