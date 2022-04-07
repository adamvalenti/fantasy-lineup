import express from "express";
import { MongoExpiredSessionError } from "mongodb";
import Player from "../models/Player.js";

const router = express.Router();

// getting all players names
router.get("/names", async (req, res) => {
  try {
    const players = await Player.find();
    const playerNames = players
      .filter((player) => {
        return player.name !== "";
      })
      .map((player) => {
        return { [player._id]: player.name };
      });
    res.json(playerNames);
  } catch (error) {
    res.json({ message: error.message });
  }
});

//get single player
router.get("/:playerId", async (req, res) => {
  try {
    const player = await Player.findById(req.params.playerId);
    res.json(player);
  } catch (error) {
    res.json({ message: error.message });
  }
});

export default router;
