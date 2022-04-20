import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: false,
  },
  fullName: {
    type: String,
    required: false,
  },
});

export default mongoose.model("team", teamSchema);
