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
  var positions = {
    hTeam: {
      PG: [],
      SG: [],
      SF: [],
      PF: [],
      C: [],
    },
    vTeam: {
      PG: [],
      SG: [],
      SF: [],
      PF: [],
      C: [],
    },
  };

  await axios
    .get(url)
    .then((res) => {
      var results = res.data.stats;
      if (results == undefined) {
        return null;
      }
      var teamMinsPlayed = calculations.minutesPlayed(results.hTeam.totals.min);
      var hId = res.data.basicGameData.hTeam.teamId;

      misc.assignTeamStats(
        gameStats.vTeam.team,
        results.vTeam.totals,
        teamMinsPlayed
      );
      misc.assignTeamStats(
        gameStats.hTeam.team,
        results.hTeam.totals,
        teamMinsPlayed
      );

      positions = calculations.positions(results.activePlayers, hId);
      //add matchup season stats to determine if they had a better or worse game than normal maybe add later

      for (let i = 0; i < results.activePlayers.length; i++) {
        var minsPlayed = calculations.minutesPlayed(
          results.activePlayers[i].min
        );
        var playerStats = {};

        if (results.activePlayers[i].teamId == hId) {
          if (positions.vTeam[results.activePlayers[i].pos] != undefined) {
            playerStats = misc.assignPlayerStats(
              results.activePlayers[i],
              minsPlayed,
              results.activePlayers[
                positions.vTeam[results.activePlayers[i].pos].idx
              ],
              positions.vTeam[results.activePlayers[i].pos].mins
            );
          } else {
            playerStats = misc.assignPlayerStats(
              results.activePlayers[i],
              minsPlayed,
              null,
              null
            );
          }
          gameStats.hTeam.player.push(playerStats);
        } else {
          if (positions.hTeam[results.activePlayers[i].pos] != undefined) {
            playerStats = misc.assignPlayerStats(
              results.activePlayers[i],
              minsPlayed,
              results.activePlayers[
                positions.hTeam[results.activePlayers[i].pos].idx
              ],
              positions.hTeam[results.activePlayers[i].pos].mins
            );
          } else {
            playerStats = misc.assignPlayerStats(
              results.activePlayers[i],
              minsPlayed,
              null,
              null
            );
          }
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

async function getUpdatedSchedule(newGames) {
  var cleanedGames = [];
  var games = await getSchedule();
  // var league = calculations.leagueConstants();

  for (let i = 0; i < games.length; i++) {
    if (games[i].gameId == newGames[0].gameId) {
      cleanedGames = games.splice(i, newGames.length);
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

      cleanedGames[i].hTeam.stats.team.pos = calculations.numOfTeamPos(
        cleanedGames[i].hTeam.stats.team,
        cleanedGames[i].vTeam.stats.team
      );

      cleanedGames[i].vTeam.stats.team.pos = calculations.numOfTeamPos(
        cleanedGames[i].vTeam.stats.team,
        cleanedGames[i].hTeam.stats.team
      );

      cleanedGames[i].hTeam.stats.team.pace = calculations.teamPace(
        cleanedGames[i].hTeam.stats.team,
        cleanedGames[i].vTeam.stats.team
      );

      cleanedGames[i].vTeam.stats.team.pace = calculations.teamPace(
        cleanedGames[i].vTeam.stats.team,
        cleanedGames[i].hTeam.stats.team
      );

      // for (let j = 0; j < cleanedGames[i].hTeam.stats.player.length; j++) {
      //   if (cleanedGames[i].hTeam.stats.player[j].mp != 0) {
      //     cleanedGames[i].hTeam.stats.player[j].advanced =
      //       calculations.advancedPlayerStats(
      //         cleanedGames[i].hTeam.stats.player[j],
      //         cleanedGames[i].hTeam.stats.team,
      //         cleanedGames[i].vTeam.stats.team,
      //         league
      //       );
      //   }
      // }
      // for (let j = 0; j < cleanedGames[i].vTeam.stats.player.length; j++) {
      //   if (cleanedGames[i].vTeam.stats.player[j].mp != 0) {
      //     cleanedGames[i].vTeam.stats.player[j].advanced =
      //       calculations.advancedPlayerStats(
      //         cleanedGames[i].vTeam.stats.player[j],
      //         cleanedGames[i].vTeam.stats.team,
      //         cleanedGames[i].hTeam.stats.team,
      //         league
      //       );
      //   }
      // }
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
          season: await getSeasonalStats(
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

// getSeasonalStats(getPlayerStatsUrl("2021", "202699")).catch(console.error);

async function getSeasonalStats(url) {
  var seasonalStats = {};
  await axios
    .get(url)
    .then((res) => {
      seasonalStats = res.data.league.standard.stats.regularSeason.season;
      for (let i = 0; i < seasonalStats.length; i++) {
        seasonalStats[i].total.fppg = calculations.playerFantasyPoints(
          seasonalStats[i].total.ppg,
          seasonalStats[i].total.apg,
          seasonalStats[i].total.rpg,
          seasonalStats[i].total.spg,
          seasonalStats[i].total.bpg,
          seasonalStats[i].total.topg
        );
      }
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
