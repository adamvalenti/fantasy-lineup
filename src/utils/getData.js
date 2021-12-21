const axios = require("axios");

const urlParam = {
  SEASONAL: "seasonal",
  RECENT: "recent",
  INFO: "info",
};

function getUrl(playerId, currYear, item) {
  // find bdlPlayerId from data base
  var bdlPlayerId = 475;
  var perPage = 100;
  switch (item) {
    case urlParam.SEASONAL:
      return (
        "http://data.nba.net/10s/prod/v1/" +
        currYear +
        "/players/" +
        playerId +
        "_profile.json"
      );
    case urlParam.RECENT:
      //determine date the includes last 10 games from schedule
      return (
        "https://www.balldontlie.io/api/v1/stats?start_date=" +
        "'2021-11-20'" +
        "&player_ids[]=" +
        bdlPlayerId +
        "&per_page=" +
        perPage
      );
    case urlParam.INFO:
      return "http://data.nba.net/10s/prod/v1/" + currYear + "/players.json";
    default:
      console.log("No URL");
  }
}

function getYear() {
  return new Date().getFullYear();
}

async function getData(playerId) {
  if (typeof playerId != "string") {
    console.log("Reformat player ID");
    return;
  }
  var currYear = getYear();

  var seasonalStats = await getSeasonalStats(
    getUrl(playerId, currYear, urlParam.SEASONAL)
  );

  var recentStats = await getRecentStats(
    getUrl(playerId, currYear, urlParam.RECENT)
  );

  var playerInfo = await getPlayerInfo(
    getUrl(playerId, currYear, urlParam.INFO),
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
    .get(url)
    .then((res) => {
      var players = res.data.league.standard;
      var keys = Object.keys(players);
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

module.exports = { getData };
