import express from "express";
import Team from "../models/Team.js";

const router = express.Router();

// getting all players names
router.get("/names", async (req, res) => {
  try {
    const teams = await Team.find();
    const teamNames = {};
    teams.forEach((team) => {
      teamNames[team.fullName] = team._id;
    });
    res.json(teamNames);
  } catch (error) {
    res.json({ message: error.message });
  }
});

export default router;
