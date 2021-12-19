const axios = require("axios");

const urlParam = Object.freeze({
  STATS: "stats",
  INFO: "info",
});

function getUrl(playerId, year, urlParam) {
  switch (urlParam) {
    case urlParam.STATS:
      return (playerStatsUrl =
        "http://data.nba.net/10s/prod/v1/" +
        year +
        "/players/" +
        playerId +
        "_profile.json");
    case urlParam.INFO:
      return (playerInfoUrl =
        "http://data.nba.net/10s/prod/v1/" + year + "/players.json");
    default:
      console.log("No URL");
  }
}

async function getData(playerId) {
  if (typeof playerId != "string") {
    console.log("Reformat player ID");
    return;
  }

  var currYear = new Date().getFullYear();
  var playerStats = await getPlayerStats(
    getUrl(playerId, currYear, urlParam.STATS)
  );
  var playerInfo = await getPlayerInfo(
    getUrl(playerId, currYear, urlParam.INFO),
    playerId
  );

  console.log(playerStats);
  console.log(playerInfo);

  var results = {};
  var statKeys = Object.keys(playerStats);
  var infoKeys = Object.keys(playerInfo);

  for (let i = 0; i < infoKeys.length; i++) {
    results[infoKeys[i]] = playerInfo[infoKeys[i]];
  }
  for (let i = 0; i < statKeys.length; i++) {
    results[statKeys[i]] = playerStats[statKeys[i]];
  }
  return results;
}

async function getPlayerStats(url) {
  // var IsLoaded = false;
  var playerStats = {};
  await axios
    .get(url)
    .then((res) => {
      playerStats = res.data.league.standard.stats;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return playerStats;
}

async function getPlayerInfo(url, playerId) {
  // var IsLoaded = false;
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

module.exports = { getData };
