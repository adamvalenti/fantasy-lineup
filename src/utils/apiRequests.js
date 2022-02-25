const axios = require("axios");
const calculations = require("./calculations.js");
const misc = require("./misc.js");

const updateStatus = {
  COMPLETE: "complete",
  NOTREADY: "not ready",
  PENDING: "pending",
};

async function newApi() {
  const url =
    "https://stats.nba.com/stats/leaguedashplayerstats?College=&Conference=&Country=&DateFrom=&DateTo=&Division=&DraftPick=&DraftYear=&GameScope=&GameSegment=&Height=&LastNGames=0&LeagueID=00&Location=&MeasureType=Base&Month=0&OpponentTeamID=0&Outcome=&PORound=0&PaceAdjust=N&PerMode=PerGame&Period=0&PlayerExperience=&PlayerPosition=&PlusMinus=N&Rank=N&Season=2019-20&SeasonSegment=&SeasonType=Regular+Season&ShotClockRange=&StarterBench=&TeamID=0&TwoWay=0&VsConference=&VsDivision=&Weight=";
  const headers = {
    Host: "stats.nba.com",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
    Referer: "https://stats.nba.com/",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token": "true",
  };
  console.log("running");
  var result;
  await axios
    .get(url, headers)
    .then((res) => {
      result = res.data;
      console.log(result);
    })
    .catch((err) => {
      console.error(err);
      return err;
    });

  return;
}

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

async function getGameStats(url, players) {
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

      calculations.positions(results.activePlayers, players, hId);

      for (let i = 0; i < results.activePlayers.length; i++) {
        var minsPlayed = calculations.minutesPlayed(
          results.activePlayers[i].min
        );
        var playerStats = {};

        if (results.activePlayers[i].teamId == hId) {
          playerStats = misc.assignPlayerStats(
            results.activePlayers[i],
            minsPlayed
          );
          gameStats.hTeam.player.push(playerStats);
        } else {
          playerStats = misc.assignPlayerStats(
            results.activePlayers[i],
            minsPlayed
          );
          gameStats.vTeam.player.push(playerStats);
        }
      }

      for (let i = 0; i < gameStats.hTeam.player.length; i++) {
        var hTeamPlayer = gameStats.hTeam.player[i];

        if (hTeamPlayer.pos == "" || hTeamPlayer.stats.mp == 0) {
          hTeamPlayer.matchup = {};
        } else {
          hTeamPlayer.matchup = calculations.estimatedMatchupStats(
            gameStats.vTeam.player,
            hTeamPlayer.pos
          );
        }
      }

      for (let i = 0; i < gameStats.vTeam.player.length; i++) {
        var vTeamPlayer = gameStats.vTeam.player[i];

        if (vTeamPlayer.pos == "" || vTeamPlayer.stats.mp == 0) {
          vTeamPlayer.matchup = {};
        } else {
          vTeamPlayer.matchup = calculations.estimatedMatchupStats(
            gameStats.hTeam.player,
            hTeamPlayer.pos
          );
        }
      }
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return gameStats;
}

async function getSchedule(seasonYear) {
  var url = getScheduleUrl(seasonYear);
  var games = [];

  await axios
    .get(url)
    .then((res) => {
      games = res.data.league.standard;
      for (let i = 0; i < games.length; i++) {
        games[i].updateStatus = updateStatus.NOTREADY;
      }
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return games;
}

async function getUpdatedSchedule(newGames, players, seasonYear) {
  var cleanedGames = [];
  var games = await getSchedule(seasonYear);
  // var league = calculations.leagueConstants();

  for (let i = 0; i < games.length; i++) {
    if (games[i].gameId == newGames[0].gameId) {
      cleanedGames = games.splice(i, newGames.length);
      i = games.length;
    }
  }
  for (let i = 0; i < cleanedGames.length; i++) {
    console.log(cleanedGames.length - i);
    var gameStats = await getGameStats(
      getGameUrl(cleanedGames[i].startDateEastern, cleanedGames[i].gameId),
      players
    );
    if (gameStats != null) {
      cleanedGames[i].updateStatus = updateStatus.PENDING;
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

async function getTeams(leaguePlayers, seasonYear, model) {
  var url = getTeamsUrl(seasonYear);
  var teams = [];
  var oldRosters = {};
  var remainingPlayers = [];

  await axios
    .get(url)
    .then(async function (res) {
      teams = res.data.league.standard;
      var team;
      for (let i = 0; i < teams.length; i++) {
        team = teams[i];
        if (team.isNBAFranchise) {
          team.roster = await getTeamRoster(
            getTeamRosterUrl(seasonYear, team.urlName)
          );
          for (let j = 0; j < team.roster.length; j++) {
            var player = team.roster[j];
            var leaguePlayer = leaguePlayers.filter((leaguePlayer) => {
              return leaguePlayer._id == player.playerId;
            });

            leaguePlayers = leaguePlayers.filter((leaguePlayer) => {
              return leaguePlayer._id != player.playerId;
            });

            if (leaguePlayer.length == 1) {
              player.pos = leaguePlayer[0].pos;
              player.name = leaguePlayer[0].name;
              player.seasonalStats = leaguePlayer[0].stats.season;
            }

            player.data = {
              usage: {
                scoringUsage: 0,
                playmakingUsage: 0,
                reboundingUsage: 0,
              },
              games: [],
              averages: {},
              teamAverages: {},
              matchupGames: [],
              matchupAverages: {},
              gp: 0,
              gm: 0,
            };

            if (
              player.seasonalStats != undefined &&
              player.seasonalStats.length != 0
            ) {
              for (let k = 0; k < player.seasonalStats[0].teams.length; k++) {
                var currTeam = player.seasonalStats[0].teams[k];
                if (currTeam.teamId != team.teamId && currTeam.teamId != "0") {
                  var playerStats = {
                    playerId: player.playerId,
                    isActive: false,
                    pos: player.pos,
                    name: player.name,
                    playerStats: currTeam,
                    data: {
                      usage: {
                        scoringUsage: 0,
                        playmakingUsage: 0,
                        reboundingUsage: 0,
                      },
                      games: [],
                      averages: {},
                      teamAverages: {},
                      matchupGames: [],
                      matchupAverages: {},
                      gp: 0,
                      gm: 0,
                    },
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

      for (let i = 0; i < leaguePlayers.length; i++) {
        var player = leaguePlayers[i];
        if (player.stats.season.length == 0) {
          leaguePlayers.splice(i, 1);
          i--;
        } else if (player.stats.season[0].seasonYear == seasonYear) {
          for (let j = 0; j < player.stats.season[0].teams.length; j++) {
            var currTeam = player.stats.season[0].teams[j];
            var playerStats = {
              playerId: player._id,
              isActive: false,
              pos: player.pos,
              name: player.name,
              playerStats: currTeam,
              data: {
                usage: {
                  scoringUsage: 0,
                  playmakingUsage: 0,
                  reboundingUsage: 0,
                },
                games: [],
                averages: {},
                teamAverages: {},
                matchupGames: [],
                matchupAverages: {},
                gp: 0,
                gm: 0,
              },
            };
            if (oldRosters.hasOwnProperty(currTeam.teamId)) {
              oldRosters[currTeam.teamId].push(playerStats);
            } else {
              oldRosters[currTeam.teamId] = [playerStats];
            }
            remainingPlayers.push(playerStats);
          }
        }
      }

      for (let i = 0; i < teams.length; i++) {
        team = teams[i];
        if (team.isNBAFranchise) {
          team.roster = team.roster.concat(
            oldRosters[team.teamId] === undefined ? [] : oldRosters[team.teamId]
          );
        }
      }

      teams.push({
        teamId: "0000000001",
        city: "",
        fullName: "Gleague / Free Agent",
        confName: "",
        tricode: "GFA",
        divName: "",
        nickname: "G/FA",
        urlName: "gfa",
        gp: 0,
        gamelog: [],
        roster: remainingPlayers,
      });
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
      roster = res.data.league.standard.players.map((player) => {
        return {
          playerId: player.personId,
          isActive: true,
        };
      });
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return roster;
}

async function getPlayers(seasonYear, model) {
  var url = getPlayersUrl(seasonYear);
  var players = [];
  await axios
    .get(url)
    .then(async function (res) {
      players = res.data.league.standard;
      if (model) {
        await addAllSeasonStats(players, seasonYear);
        await addPrevSeasonStats(players, seasonYear);
      } else {
        await addAllSeasonStats(players, seasonYear);
      }
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
  return players;
}

async function addAllSeasonStats(players, seasonYear) {
  for (let i = 0; i < players.length; i++) {
    console.log(players.length - i);
    players[i].stats = {
      season: await getSeasonalStats(
        getPlayerStatsUrl(seasonYear, players[i].personId)
      ),
    };
    players[i].pos = misc.convertPos(players[i].pos);
  }
  return players;
}

async function addPrevSeasonStats(players, seasonYear) {
  for (let i = 0; i < players.length; i++) {
    console.log(players.length - i);
    var seasonalStats = await getSeasonalStats(
      getPlayerStatsUrl(seasonYear - 1, players[i].personId)
    );

    if (
      seasonalStats.length == 0 ||
      seasonalStats[0].seasonYear != seasonYear - 1
    ) {
      players[i].prevSeason = {};
      // players.splice(i, 1);
      // i--;
    } else {
      players[i].prevSeason = seasonalStats[0];
      // players[i].pos = misc.convertPos(players[i].pos);
    }
  }

  return players;
}

// getSeasonalStats(getPlayerStatsUrl("2021", "202699")).catch(console.error);

async function getSeasonalStats(url) {
  var seasonalStats = [];
  await axios
    .get(url)
    .then((res) => {
      seasonalStats = res.data.league.standard.stats.regularSeason.season;
    })
    .catch((err) => {
      // console.error(err);
      return [];
    });
  return seasonalStats;
}

module.exports.getTeams = getTeams;
module.exports.getUpdatedSchedule = getUpdatedSchedule;
module.exports.getSchedule = getSchedule;
module.exports.getPlayers = getPlayers;
module.exports.getSeasonYear = getSeasonYear;
module.exports.getSeasonalStats = getSeasonalStats;
module.exports.getPlayerStatsUrl = getPlayerStatsUrl;
module.exports.updateStatus = updateStatus;
