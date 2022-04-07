import {
  formatPlayer,
  formatGame,
  formatTeam,
  formatGameUpdate,
  assignPlayerStats,
  assignTeamStats,
} from "./helpers.js";

import { updateStatus } from "./constants.js";

import {
  gameEndpoint,
  playerProfileEndpoint,
  rosterEndpoint,
} from "./apiEndpoints.js";

import {
  getTeams,
  getSchedule,
  getPlayers,
  getSeasonalStats,
  getGame,
  getRoster,
} from "./apiRequests.js";

import {
  calcMinutesPlayed,
  calcNumOfTeamPos,
  calcTeamPace,
  calcEstimatedMatchupStats,
} from "./calculations.js";

async function cleanPlayers(seasonYear) {
  var players = await getPlayers(seasonYear);
  var cleanedPlayers = [];

  for (let i = 0; i < players.length; i++) {
    console.log(players.length - i);
    players[i].stats = {
      season: await getSeasonalStats(
        playerProfileEndpoint(seasonYear, players[i].personId)
      ),
    };
    players[i].pos = convertPos(players[i].pos);
    cleanedPlayers.push(formatPlayer(players[i]));
  }
  return cleanedPlayers;
}

async function cleanSchedule(seasonYear, existingGames) {
  var games = await getSchedule(seasonYear);
  var cleanedGames = [];
  for (let i = 0; i < games.length; i++) {
    games[i].updateStatus = updateStatus.NOTREADY;
    if (
      existingGames.filter((game) => {
        return game._id === games[i].gameId;
      }).length > 0
    ) {
      games.splice(i, 1);
      i--;
    } else {
      cleanedGames.push(formatGame(games[i]));
    }
  }
  return cleanedGames;
}

async function cleanScheduleUpdates(newGames, players, seasonYear) {
  var games = await getSchedule(seasonYear);
  var cleanedGames = [];
  var gameUpdate;
  var updates = [];
  var gameDate;

  for (let i = 0; i < games.length; i++) {
    if (games[i].gameId === newGames[0].gameId) {
      cleanedGames = games.splice(i, newGames.length);
      i = games.length;
    }
  }

  for (let i = 0; i < cleanedGames.length; i++) {
    console.log(cleanedGames.length - i);
    if (cleanedGames[i].startDateEastern === undefined) {
      gameDate = cleanedGames[i].gameUrlCode.substring(0, 8);
    } else {
      gameDate = cleanedGames[i].startDateEastern;
    }

    var gameStats = await cleanGame(
      gameEndpoint(gameDate, cleanedGames[i].gameId),
      players
    );
    if (gameStats !== null) {
      cleanedGames[i].updateStatus = updateStatus.PENDING;
      cleanedGames[i].hTeam.stats = gameStats.hTeam;
      cleanedGames[i].vTeam.stats = gameStats.vTeam;

      cleanedGames[i].hTeam.stats.team.pos = calcNumOfTeamPos(
        cleanedGames[i].hTeam.stats.team,
        cleanedGames[i].vTeam.stats.team
      );

      cleanedGames[i].vTeam.stats.team.pos = calcNumOfTeamPos(
        cleanedGames[i].vTeam.stats.team,
        cleanedGames[i].hTeam.stats.team
      );

      cleanedGames[i].hTeam.stats.team.pace = calcTeamPace(
        cleanedGames[i].hTeam.stats.team,
        cleanedGames[i].vTeam.stats.team
      );

      cleanedGames[i].vTeam.stats.team.pace = calcTeamPace(
        cleanedGames[i].vTeam.stats.team,
        cleanedGames[i].hTeam.stats.team
      );
    }

    gameUpdate = formatGameUpdate(formatGame(cleanedGames[i]));
    updates.push(gameUpdate);
  }
  return updates;
}

async function cleanGame(url, players) {
  var game = await getGame(url);
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

  if (game.stats !== undefined) {
    var teamMinsPlayed = calcMinutesPlayed(game.stats.hTeam.totals.min);
    var hId = game.basicGameData.hTeam.teamId;

    assignTeamStats(
      gameStats.vTeam.team,
      game.stats.vTeam.totals,
      teamMinsPlayed
    );
    assignTeamStats(
      gameStats.hTeam.team,
      game.stats.hTeam.totals,
      teamMinsPlayed
    );

    cleanPositions(game.stats.activePlayers, players, hId);

    for (let i = 0; i < game.stats.activePlayers.length; i++) {
      var minsPlayed = calcMinutesPlayed(game.stats.activePlayers[i].min);
      var playerStats = {};

      if (game.stats.activePlayers[i].teamId === hId) {
        playerStats = assignPlayerStats(
          game.stats.activePlayers[i],
          minsPlayed
        );
        gameStats.hTeam.player.push(playerStats);
      } else {
        playerStats = assignPlayerStats(
          game.stats.activePlayers[i],
          minsPlayed
        );
        gameStats.vTeam.player.push(playerStats);
      }
    }

    for (let i = 0; i < gameStats.hTeam.player.length; i++) {
      var hTeamPlayer = gameStats.hTeam.player[i];

      if (hTeamPlayer.pos === "" || hTeamPlayer.stats.mp === 0) {
        hTeamPlayer.matchup = {};
      } else {
        hTeamPlayer.matchup = calcEstimatedMatchupStats(
          gameStats.vTeam.player,
          hTeamPlayer.pos
        );
      }
    }

    for (let i = 0; i < gameStats.vTeam.player.length; i++) {
      var vTeamPlayer = gameStats.vTeam.player[i];

      if (vTeamPlayer.pos === "" || vTeamPlayer.stats.mp === 0) {
        vTeamPlayer.matchup = {};
      } else {
        vTeamPlayer.matchup = calcEstimatedMatchupStats(
          gameStats.hTeam.player,
          hTeamPlayer.pos
        );
      }
    }
  }
  return gameStats;
}

async function cleanTeams(leaguePlayers, seasonYear) {
  var teams = await getTeams(seasonYear);
  var cleanedTeams = [];
  var oldRosters = {};
  var remainingPlayers = [];
  var team;
  var roster;

  for (let i = 0; i < teams.length; i++) {
    team = teams[i];
    if (team.isNBAFranchise) {
      roster = await getRoster(rosterEndpoint(seasonYear, team.urlName));
      team.roster = roster.map((player) => {
        return {
          playerId: player.personId,
          isActive: true,
        };
      });

      for (let j = 0; j < team.roster.length; j++) {
        var player = team.roster[j];
        var leaguePlayer;

        leaguePlayer = leaguePlayers.filter((currLeaguePlayer) => {
          return currLeaguePlayer._id === player.playerId;
        });

        if (leaguePlayer.length === 1) {
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
          player.seasonalStats !== undefined &&
          player.seasonalStats.length !== 0
        ) {
          for (let k = 0; k < player.seasonalStats[0].teams.length; k++) {
            var currTeam = player.seasonalStats[0].teams[k];
            if (currTeam.teamId !== team.teamId && currTeam.teamId !== "0") {
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
    player = leaguePlayers[i];
    if (player.stats.season.length === 0) {
      leaguePlayers.splice(i, 1);
      i--;
    } else if (player.stats.season[0].seasonYear === seasonYear) {
      for (let j = 0; j < player.stats.season[0].teams.length; j++) {
        currTeam = player.stats.season[0].teams[j];
        playerStats = {
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
    cleanedTeams.push(formatTeam(teams[i]));
  }

  return cleanedTeams;
}

function cleanPositions(gamePlayers, leaguePlayers) {
  var leaguePlayer;
  var playerPos;

  for (let i = 0; i < gamePlayers.length; i++) {
    leaguePlayer = leaguePlayers.filter((leaguePlayer) => {
      return leaguePlayer._id === gamePlayers[i].personId;
    });

    if (leaguePlayer.length === 1) {
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
    return char !== "-";
  });
  var newPos = newCharArr.join("");

  return newPos;
}

export { cleanPlayers, cleanScheduleUpdates, cleanSchedule, cleanTeams };
