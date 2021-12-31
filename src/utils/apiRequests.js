const axios = require("axios");
const calculations = require("./calculations.js");

const playerStatsParam = {
  SEASONAL: "seasonal",
  RECENT: "recent",
  INFO: "info",
};

function getGameUrl(gameDate, gameId) {
  return (
    "https://data.nba.net/prod/v1/" + gameDate + "/" + gameId + "_boxscore.json"
  );
}

async function getPlayerUrl(playerId, item) {
  // find bdlPlayerId from data base
  var bdlPlayerId = 475;
  var perPage = 100;
  switch (item) {
    case playerStatsParam.SEASONAL:
      return (
        "http://data.nba.net/10s/prod/v1/" +
        getYear() +
        "/players/" +
        playerId +
        "_profile.json"
      );
    case playerStatsParam.RECENT:
      //determine date the includes last 10 games from schedule
      return (
        "https://www.balldontlie.io/api/v1/stats?start_date=" +
        "'2021-11-20'" +
        "&player_ids[]=" +
        bdlPlayerId +
        "&per_page=" +
        perPage
      );
    case playerStatsParam.INFO:
      return "http://data.nba.net/10s/prod/v1/" + getYear() + "/players.json";
    default:
      console.log("No URL");
  }
}

function getYear() {
  return new Date().getFullYear();
}

function gameBeenPlayed(dateString) {
  var year = dateString.substring(0, 4);
  var month = dateString.substring(4, 6);
  var day = dateString.substring(6, 8);

  var date = new Date(year, month - 1, day);
  var currDate = new Date();

  return date < currDate;
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
      var minsPlayed = calculations.minPlayedConversion(
        results.hTeam.totals.min
      );

      gameStats.vTeam.team.pts = parseInt(results.vTeam.totals.points);
      gameStats.vTeam.team.ast = parseInt(results.vTeam.totals.assists);
      gameStats.vTeam.team.drb = parseInt(results.vTeam.totals.defReb);
      gameStats.vTeam.team.orb = parseInt(results.vTeam.totals.offReb);
      gameStats.vTeam.team.stl = parseInt(results.vTeam.totals.steals);
      gameStats.vTeam.team.blk = parseInt(results.vTeam.totals.blocks);
      gameStats.vTeam.team.tov = parseInt(results.vTeam.totals.turnovers);
      gameStats.vTeam.team.fgm = parseInt(results.vTeam.totals.fgm);
      gameStats.vTeam.team.fga = parseInt(results.vTeam.totals.fga);
      gameStats.vTeam.team.tpm = parseInt(results.vTeam.totals.tpm);
      gameStats.vTeam.team.tpa = parseInt(results.vTeam.totals.tpa);
      gameStats.vTeam.team.ftm = parseInt(results.vTeam.totals.ftm);
      gameStats.vTeam.team.fta = parseInt(results.vTeam.totals.fta);
      gameStats.vTeam.team.mp = minsPlayed;
      gameStats.vTeam.team.pf = parseInt(results.vTeam.totals.pFouls);
      gameStats.vTeam.team.tf = parseInt(results.vTeam.totals.team_fouls);

      gameStats.hTeam.team.pts = parseInt(results.hTeam.totals.points);
      gameStats.hTeam.team.ast = parseInt(results.hTeam.totals.assists);
      gameStats.hTeam.team.drb = parseInt(results.hTeam.totals.defReb);
      gameStats.hTeam.team.orb = parseInt(results.hTeam.totals.offReb);
      gameStats.hTeam.team.stl = parseInt(results.hTeam.totals.steals);
      gameStats.hTeam.team.blk = parseInt(results.hTeam.totals.blocks);
      gameStats.hTeam.team.tov = parseInt(results.hTeam.totals.turnovers);
      gameStats.hTeam.team.fgm = parseInt(results.hTeam.totals.fgm);
      gameStats.hTeam.team.fga = parseInt(results.hTeam.totals.fga);
      gameStats.hTeam.team.tpm = parseInt(results.hTeam.totals.tpm);
      gameStats.hTeam.team.tpa = parseInt(results.hTeam.totals.tpa);
      gameStats.hTeam.team.ftm = parseInt(results.hTeam.totals.ftm);
      gameStats.hTeam.team.fta = parseInt(results.hTeam.totals.fta);
      gameStats.hTeam.team.mp = minsPlayed;
      gameStats.hTeam.team.pf = parseInt(results.hTeam.totals.pFouls);
      gameStats.hTeam.team.tf = parseInt(results.hTeam.totals.team_fouls);

      var hId = res.data.basicGameData.hTeam.teamId;

      for (let i = 0; i < results.activePlayers.length; i++) {
        var minsPlayed = calculations.minPlayedConversion(
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
  var mostRecentGame = 0;
  await axios
    .get(url)
    .then(async function (res) {
      games = res.data.league.standard;
      for (let i = mostRecentGame; i < games.length; i++) {
        if (gameBeenPlayed(games[i].startDateEastern)) {
          var gameStats = await getGameStats(
            getGameUrl(games[i].startDateEastern, games[i].gameId)
          );

          games[i].hTeam.stats = gameStats.hTeam;
          games[i].vTeam.stats = gameStats.vTeam;
        } else {
          break;
        }
      }
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return games;
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

async function getPlayerData(playerId) {
  if (typeof playerId != "string") {
    console.log("Reformat player ID");
    return;
  }

  var seasonalStats = await getSeasonalStats(
    getPlayerUrl(playerId, playerStatsParam.SEASONAL)
  );

  var recentStats = await getRecentStats(
    getPlayerUrl(playerId, playerStatsParam.RECENT)
  );

  var playerInfo = await getPlayerInfo(
    getPlayerUrl(playerId, playerStatsParam.INFO),
    playerId
  );

  var results = {};
  var seasonalKeys = Object.keys(seasonalStats);
  var infoKeys = Object.keys(playerInfo);

  for (let i = 0; i < infoKeys.length; i++) {
    results[infoKeys[i]] = playerInfo[infoKeys[i]];
  }
  for (let i = 0; i < seasonalKeys.length; i++) {
    results[seasonalKeys[i]] = seasonalStats[seasonalKeys[i]];
  }

  results.recent = recentStats;

  return results;
}

async function getRecentStats(url) {
  var recentStats = [];
  await axios
    .get(url)
    .then((res) => {
      recentStats = res.data.data;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });

  sortStats(recentStats);
  return recentStats;
}

async function getSeasonalStats(url) {
  var seasonalStats = {};
  await axios
    .get(url)
    .then((res) => {
      seasonalStats = res.data.league.standard.stats;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return seasonalStats;
}

async function getPlayerInfo(url, playerId) {
  var playerInfo = {};
  await axios
    .get(url, { params: { firstName: "Andrew", personId: playerId } })
    .then((res) => {
      var players = res.data.league.standard;
      var keys = Object.keys(players);
      console.log(players);
      for (let i = 0; i < keys.length; i++) {
        if (players[i].personId === playerId) {
          playerInfo = players[i];
          playerInfo.listId = i;
          break;
        } else if (i === keys.length) {
          console.log("No player found with Id " + playerId);
        }
      }
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return playerInfo;
}

function sortStats(stats) {
  stats.sort(function (a, b) {
    var dateA = new Date(a.game.date);
    var dateB = new Date(b.game.date);
    return dateA - dateB;
  });
  return stats;
}

module.exports.getPlayerData = getPlayerData;
module.exports.getTeams = getTeams;
module.exports.getSchedule = getSchedule;
