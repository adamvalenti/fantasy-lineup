import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  pos: {
    type: String,
    required: false,
  },
});

export default mongoose.model("2016-player", playerSchema);
