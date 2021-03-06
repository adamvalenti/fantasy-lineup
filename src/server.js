import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import playersRoute from "./routes/Player.js";
import userRoute from "./routes/Users.js";
import teamsRoute from "./routes/Team.js";
import bodyParser from "body-parser";

dotenv.config();

const app = express();

app.use(bodyParser.json());

const uri = process.env.CURRENT_DATABASE_URL;

mongoose.connect(uri, { useNewUrlParser: true });

const db = mongoose.connection;

db.on("error", (error) => {
  console.error(error);
});

db.once("open", () => {
  console.log("connected to database");
});

app.use("/players", playersRoute);
app.use("/users", userRoute);
app.use("/teams", teamsRoute);

app.listen(4000, () => {
  console.log("server started");
});
