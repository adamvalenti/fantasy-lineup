async function getData(playerId = "203952") {
  const axios = require("axios");
  const playerStatsUrl =
    "http://data.nba.net/10s/prod/v1/2021/players/" +
    playerId +
    "_profile.json";
  const playerInfoUrl = "http://data.nba.net/10s/prod/v1/2021/players.json";

  var statsIsLoaded = false;
  var infoIsLoaded = false;
  var playerStats = {};
  var playerInfo = {};

  await axios
    .get(playerStatsUrl)
    .then((res) => {
      playerStats = res.data.league.standard.stats;
      statsIsLoaded = true;
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  await axios
    .get(playerInfoUrl)
    .then((res) => {
      var players = res.data.league.standard;
      var keys = Object.keys(players);
      for (let i = 0; i < keys.length; i++) {
        if (players[i].personId === playerId) {
          playerInfo = players[i];
          playerInfo.listId = i;
          infoIsLoaded = true;
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

  if (statsIsLoaded && infoIsLoaded) {
    var results = {};
    var statKeys = Object.keys(playerStats);
    var infoKeys = Object.keys(playerInfo);

    for (let i = 0; i < infoKeys.length; i++) {
      // let isnum = /[+-]?([0-9]*[.])?[0-9]+/.test(playerInfo[infoKeys[i]]);
      // if (isnum) {
      //   playerInfo[infoKeys[i]] = parseFloat(playerInfo[infoKeys[i]], 10);
      // }
      results[infoKeys[i]] = playerInfo[infoKeys[i]];
    }
    for (let i = 0; i < statKeys.length; i++) {
      // let isnum = /[+-]?([0-9]*[.])?[0-9]+/.test(playerStats[statKeys[i]]);
      // if (isnum) {
      //   playerStats[statKeys[i]] = parseFloat(playerStats[statKeys[i]], 10);
      // }
      results[statKeys[i]] = playerStats[statKeys[i]];
    }
    console.log(results);
    return results;
  }
}
module.exports = { getData };
