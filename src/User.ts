import mongoose from "mongoose";

const user = new mongoose.Schema({
  userId: {
    required: true,
    type: String,
  },
  username: {
    required: true,
    type: String,
  },
  emails: [
    {
      value: String,
    },
  ],
  accessToken: {
    required: true,
    type: String,
  },
  refreshToken: {
    required: true,
    type: String,
  },
});

// onshapeId?: string,
// username: string,
// emails: Array<string>,
// accessToken: string,
// refreshToken: string,
// __v: number,
// _id: string

export default mongoose.model("User", user);
