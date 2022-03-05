const axios = require("axios");
const endpoints = require("./apiEndpoints.js");

async function getSeasonYear() {
  const url = endpoints.root();
  var seasonYear;
  await axios
    .get(url)
    .then((res) => {
      seasonYear = res.data.seasonScheduleYear;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });

  return seasonYear;
}

async function getPlayers(seasonYear) {
  const url = endpoints.players(seasonYear);
  var players = [];
  await axios
    .get(url)
    .then((res) => {
      players = res.data.league.standard;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return players;
}

async function getSchedule(seasonYear) {
  const url = endpoints.schedule(seasonYear);
  var games = [];

  await axios
    .get(url)
    .then((res) => {
      games = res.data.league.standard;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return games;
}

async function getTeams(seasonYear) {
  const url = endpoints.teams(seasonYear);
  var teams = [];

  await axios
    .get(url)
    .then((res) => {
      teams = res.data.league.standard;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return teams;
}

async function getGame(url) {
  var game;
  await axios
    .get(url)
    .then((res) => {
      game = res.data;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return game;
}

async function getRoster(url) {
  var roster = [];

  await axios
    .get(url)
    .then((res) => {
      roster = res.data.league.standard.players;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return roster;
}

async function getSeasonalStats(url) {
  var seasonalStats = [];
  await axios
    .get(url)
    .then((res) => {
      seasonalStats = res.data.league.standard.stats.regularSeason.season;
    })
    .catch((err) => {
      console.error(err);
      return [];
    });
  return seasonalStats;
}

module.exports.getTeams = getTeams;
module.exports.getSchedule = getSchedule;
module.exports.getPlayers = getPlayers;
module.exports.getSeasonYear = getSeasonYear;
module.exports.getSeasonalStats = getSeasonalStats;
module.exports.getGame = getGame;
module.exports.getRoster = getRoster;
