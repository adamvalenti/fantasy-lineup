const requests = require("./apiRequests.js");
const calculations = require("./calculations.js");
const helpers = require("./helpers.js");
const endpoints = require("./apiEndpoints.js");
const constants = require("./constants.js");

async function players(seasonYear) {
  var players = await requests.getPlayers(seasonYear);
  var cleanedPlayers = [];

  for (let i = 0; i < players.length; i++) {
    console.log(players.length - i);
    players[i].stats = {
      season: await requests.getSeasonalStats(
        endpoints.playerProfile(seasonYear, players[i].personId)
      ),
    };
    players[i].pos = convertPos(players[i].pos);
    cleanedPlayers.push(helpers.formatPlayer(players[i]));
  }
  return cleanedPlayers;
}

async function schedule(seasonYear, existingGames) {
  var games = await requests.getSchedule(seasonYear);
  var cleanedGames = [];
  for (let i = 0; i < games.length; i++) {
    games[i].updateStatus = constants.updateStatus.NOTREADY;
    if (
      existingGames.filter((game) => {
        return game._id == games[i].gameId;
      }).length > 0
    ) {
      games.splice(i, 1);
      i--;
    } else {
      cleanedGames.push(helpers.formatGame(games[i]));
    }
  }
  return cleanedGames;
}

async function scheduleUpdates(newGames, players, seasonYear) {
  var games = await requests.getSchedule(seasonYear);
  var cleanedGames = [];
  var gameUpdate;
  var updates = [];
  var gameDate;

  for (let i = 0; i < games.length; i++) {
    if (games[i].gameId == newGames[0].gameId) {
      cleanedGames = games.splice(i, newGames.length);
      i = games.length;
    }
  }

  for (let i = 0; i < cleanedGames.length; i++) {
    console.log(cleanedGames.length - i);
    if (cleanedGames[i].startDateEastern == undefined) {
      gameDate = cleanedGames[i].gameUrlCode.substring(0, 8);
    } else {
      gameDate = cleanedGames[i].startDateEastern;
    }

    var gameStats = await game(
      endpoints.game(gameDate, cleanedGames[i].gameId),
      players
    );
    if (gameStats != null) {
      cleanedGames[i].updateStatus = constants.updateStatus.PENDING;
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

    gameUpdate = helpers.formatGameUpdate(helpers.formatGame(cleanedGames[i]));
    updates.push(gameUpdate);
  }
  return updates;
}

async function game(url, players) {
  var game = await requests.getGame(url);
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

  if (game.stats != undefined) {
    var teamMinsPlayed = calculations.minutesPlayed(
      game.stats.hTeam.totals.min
    );
    var hId = game.basicGameData.hTeam.teamId;

    helpers.assignTeamStats(
      gameStats.vTeam.team,
      game.stats.vTeam.totals,
      teamMinsPlayed
    );
    helpers.assignTeamStats(
      gameStats.hTeam.team,
      game.stats.hTeam.totals,
      teamMinsPlayed
    );

    positions(game.stats.activePlayers, players, hId);

    for (let i = 0; i < game.stats.activePlayers.length; i++) {
      var minsPlayed = calculations.minutesPlayed(
        game.stats.activePlayers[i].min
      );
      var playerStats = {};

      if (game.stats.activePlayers[i].teamId == hId) {
        playerStats = helpers.assignPlayerStats(
          game.stats.activePlayers[i],
          minsPlayed
        );
        gameStats.hTeam.player.push(playerStats);
      } else {
        playerStats = helpers.assignPlayerStats(
          game.stats.activePlayers[i],
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
  }
  return gameStats;
}

async function teams(leaguePlayers, seasonYear) {
  var teams = await requests.getTeams(seasonYear);
  var cleanedTeams = [];
  var oldRosters = {};
  var remainingPlayers = [];
  var team;
  var roster;

  for (let i = 0; i < teams.length; i++) {
    team = teams[i];
    if (team.isNBAFranchise) {
      roster = await requests.getRoster(
        endpoints.roster(seasonYear, team.urlName)
      );
      team.roster = roster.map((player) => {
        return {
          playerId: player.personId,
          isActive: true,
        };
      });
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

  for (let i = 0; i < teams.length; i++) {
    cleanedTeams.push(helpers.formatTeam(teams[i]));
  }

  return cleanedTeams;
}

function positions(gamePlayers, leaguePlayers) {
  var leaguePlayer;
  var playerPos;

  for (let i = 0; i < gamePlayers.length; i++) {
    leaguePlayer = leaguePlayers.filter((leaguePlayer) => {
      return leaguePlayer._id == gamePlayers[i].personId;
    });

    if (leaguePlayer.length == 1) {
      playerPos = leaguePlayer[0].pos;
      gamePlayers[i].pos = playerPos;
    } else {
      gamePlayers[i].pos = "";
    }
  }
}

function convertPos(oldPos) {
  var oldCharArr = oldPos.split("");
  var newCharArr = oldCharArr.filter((char) => {
    return char != "-";
  });
  var newPos = newCharArr.join("");

  return newPos;
}

module.exports.players = players;
module.exports.scheduleUpdates = scheduleUpdates;
module.exports.schedule = schedule;
module.exports.teams = teams;
