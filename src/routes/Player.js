import express from "express";
import Player from "../models/Player.js";
import { getPlayers, getSeasonYear } from "../utils/apiRequests.js";

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

//get all players current season stats
router.get("/", async (req, res) => {
  try {
    const currSeasonYear = await getSeasonYear();
    const players = await Player.find({
      "stats.season[0].perGame": { $exists: true },
    }).limit(100);
    // players.forEach((player) => {
    //   console.log(player.stats.season);
    //   if (player.stats !== undefined) {
    //     player.stats.season = player.stats.season.filter((season) => {
    //       return season.seasonYear === currSeasonYear;
    //     });
    //   }
    // });
    res.json(players);
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
