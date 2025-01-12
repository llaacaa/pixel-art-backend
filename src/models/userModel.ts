import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IUser extends Document {
  user_id: string; 
  username: string;
  password: string;
  pictures: mongoose.Types.ObjectId[];
}

const userSchema: Schema = new Schema({
  user_id: {
    type: String,
    required: true,
    default: uuidv4, 
  },
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  pictures: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Picture",
      default: []
    },
  ],
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
