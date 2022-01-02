const axios = require("axios");
const calculations = require("./calculations.js");
const mongo = require("./mongo.js");
const misc = require("./misc.js");

const gameStatus = {
  COMPLETE: "complete",
  MISSING: "missing",
  PENDING: "pending",
};

async function getSeasonYear() {
  const url = "https://data.nba.net/10s/prod/v1/today.json";
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

function getGameUrl(gameDate, gameId) {
  return (
    "https://data.nba.net/prod/v1/" + gameDate + "/" + gameId + "_boxscore.json"
  );
}

function getPlayerStatsUrl(seasonYear, playerId) {
  return (
    "https://data.nba.net/10s/prod/v1/" +
    seasonYear +
    "/players/" +
    playerId +
    "_profile.json"
  );
}

function getPlayersUrl(seasonYear) {
  return "https://data.nba.net/10s/prod/v1/" + seasonYear + "/players.json";
}

async function getGameStats(url) {
  var gameStats = {
    hTeam: {
      team: {},
      player: [],
    },
    vTeam: {
      team: {},
      player: [],
    },
  };

  await axios
    .get(url)
    .then((res) => {
      var results = res.data.stats;
      if (results == undefined) {
        return null;
      }
      var minsPlayed = calculations.minutesPlayed(results.hTeam.totals.min);
      var hId = res.data.basicGameData.hTeam.teamId;

      misc.assignTeamStats(
        gameStats.vTeam.team,
        results.vTeam.totals,
        minsPlayed
      );
      misc.assignTeamStats(
        gameStats.hTeam.team,
        results.hTeam.totals,
        minsPlayed
      );

      for (let i = 0; i < results.activePlayers.length; i++) {
        var minsPlayed = calculations.minutesPlayed(
          results.activePlayers[i].min
        );

        var playerStats = {
          playerId: parseInt(results.activePlayers[i].personId),
          name:
            results.activePlayers[i].firstName +
            " " +
            results.activePlayers[i].lastName,
          pts: parseInt(results.activePlayers[i].points),
          ast: parseInt(results.activePlayers[i].assists),
          drb: parseInt(results.activePlayers[i].defReb),
          orb: parseInt(results.activePlayers[i].offReb),
          stl: parseInt(results.activePlayers[i].steals),
          blk: parseInt(results.activePlayers[i].blocks),
          tov: parseInt(results.activePlayers[i].turnovers),
          fgm: parseInt(results.activePlayers[i].fgm),
          fga: parseInt(results.activePlayers[i].fga),
          tpm: parseInt(results.activePlayers[i].tpm),
          tpa: parseInt(results.activePlayers[i].tpa),
          ftm: parseInt(results.activePlayers[i].ftm),
          fta: parseInt(results.activePlayers[i].fta),
          mp: minsPlayed,
          pf: parseInt(results.activePlayers[i].pFouls),
        };

        if (results.activePlayers[i].teamId == hId) {
          gameStats.hTeam.player.push(playerStats);
        } else {
          gameStats.vTeam.player.push(playerStats);
        }
      }
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return gameStats;
}

async function getSchedule() {
  const url = "http://data.nba.net/10s/prod/v1/2021/schedule.json";

  var games = [];

  await axios
    .get(url)
    .then((res) => {
      games = res.data.league.standard;
      for (let i = 0; i < games.length; i++) {
        games[i].gameStatus = gameStatus.PENDING;
      }
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return games;
}

async function getUpdatedSchedule(gameIds) {
  var cleanedGames = [];
  var games = await getSchedule();

  for (let i = 0; i < games.length; i++) {
    if (games[i].gameId == gameIds[0]) {
      cleanedGames = games.splice(i, gameIds.length);
      break;
    }
  }
  for (let i = 0; i < cleanedGames.length; i++) {
    var gameStats = await getGameStats(
      getGameUrl(cleanedGames[i].startDateEastern, cleanedGames[i].gameId)
    );
    if (gameStats == null) {
      cleanedGames[i].gameStatus = gameStatus.MISSING;
    } else {
      cleanedGames[i].gameStatus = gameStatus.COMPLETE;
      cleanedGames[i].hTeam.stats = gameStats.hTeam;
      cleanedGames[i].vTeam.stats = gameStats.vTeam;

      for (let j = 0; j < cleanedGames[i].hTeam.stats.player.length; j++) {
        if (cleanedGames[i].hTeam.stats.player[j].mp != 0) {
          cleanedGames[i].hTeam.stats.player[j].advanced =
            calculations.advancedPlayerStats(
              cleanedGames[i].hTeam.stats.player[j],
              cleanedGames[i].hTeam.stats.team,
              cleanedGames[i].vTeam.stats.team
            );
        }
      }
      for (let j = 0; j < cleanedGames[i].vTeam.stats.player.length; j++) {
        if (cleanedGames[i].vTeam.stats.player[j].mp != 0) {
          cleanedGames[i].vTeam.stats.player[j].advanced =
            calculations.advancedPlayerStats(
              cleanedGames[i].vTeam.stats.player[j],
              cleanedGames[i].vTeam.stats.team,
              cleanedGames[i].hTeam.stats.team
            );
        }
      }
    }
  }
  return cleanedGames;
}

async function getTeams() {
  const url = "http://data.nba.net/10s/prod/v2/2021/teams.json";

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

async function getPlayers() {
  var seasonYear = await getSeasonYear();
  var url = getPlayersUrl(seasonYear);
  var players = [];
  await axios
    .get(url)
    .then(async function (res) {
      players = res.data.league.standard;
      for (let i = 0; i < players.length; i++) {
        players[i].stats = {
          regularSeason: await getSeasonalStats(
            getPlayerStatsUrl(seasonYear, players[i].personId)
          ),
        };
      }
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return players;
}

async function getSeasonalStats(url) {
  var seasonalStats = {};
  await axios
    .get(url)
    .then((res) => {
      seasonalStats = res.data.league.standard.stats.regularSeason;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return seasonalStats;
}

module.exports.getTeams = getTeams;
module.exports.getUpdatedSchedule = getUpdatedSchedule;
module.exports.getSchedule = getSchedule;
module.exports.getPlayers = getPlayers;
