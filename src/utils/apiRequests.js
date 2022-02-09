const axios = require("axios");
const calculations = require("./calculations.js");
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

function getScheduleUrl(seasonYear) {
  return "http://data.nba.net/10s/prod/v1/" + seasonYear + "/schedule.json";
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

function getTeamsUrl(seasonYear) {
  return "http://data.nba.net/10s/prod/v2/" + seasonYear + "/teams.json";
}

function getTeamRosterUrl(seasonYear, teamUrlName) {
  return (
    "http://data.nba.net/10s/prod/v1/" +
    seasonYear +
    "/teams/" +
    teamUrlName +
    "/roster.json"
  );
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
  var seasonYear = await getSeasonYear();
  var url = getScheduleUrl(seasonYear);
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
    }
  }
  return cleanedGames;
}

async function getTeams() {
  var seasonYear = await getSeasonYear();
  var url = getTeamsUrl(seasonYear);
  var teams = [];
  var oldRosters = {};

  await axios
    .get(url)
    .then(async function (res) {
      teams = res.data.league.standard;
      var team;
      for (let i = 0; i < teams.length; i++) {
        team = teams[i];
        if (team.isNBAFranchise) {
          team.activeRoster = await getTeamRoster(
            getTeamRosterUrl(seasonYear, team.urlName)
          );
          for (let j = 0; j < team.activeRoster.length; j++) {
            var player = team.activeRoster[j];
            var seasonalStats = await getSeasonalStats(
              getPlayerStatsUrl(seasonYear, player.personId)
            );

            player.seasonalStats = misc.parseSeasonalStats(seasonalStats);

            if (
              player.seasonalStats.length != 0 &&
              player.seasonalStats[0].teams.length > 1
            ) {
              for (let k = 0; k < player.seasonalStats[0].teams.length; k++) {
                var currTeam = player.seasonalStats[0].teams[k];
                if (
                  currTeam.teamId != seasonalStats.teamId &&
                  currTeam.teamId != "0"
                ) {
                  var playerStats = {
                    personId: player.personId,
                    playerStats: currTeam,
                  };

                  if (oldRosters.hasOwnProperty(currTeam.teamId)) {
                    oldRosters[currTeam.teamId].push(playerStats);
                  } else {
                    oldRosters[currTeam.teamId] = [playerStats];
                  }
                }
              }
            }
          }
        } else {
          teams.splice(i, 1);
          i--;
        }
      }
      for (let i = 0; i < teams.length; i++) {
        team = teams[i];
        if (team.isNBAFranchise) {
          team.oldRoster =
            oldRosters[team.teamId] === undefined
              ? []
              : oldRosters[team.teamId];
        }
      }
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return teams;
}

async function getTeamRoster(url) {
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
module.exports.getSeasonYear = getSeasonYear;
module.exports.gameStatus = gameStatus;
