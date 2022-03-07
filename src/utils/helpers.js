const calculations = require("./calculations.js");
const constants = require("./constants.js");

function daysOld(dateOfBirth) {
  var year = dateOfBirth.substring(0, 4);
  var month = dateOfBirth.substring(5, 7) - 1;
  var day = dateOfBirth.substring(8, 10);

  var currDate = currentDate();
  var birthDate = new Date(year, month, day);

  const diffDays = Math.round((currDate - birthDate) / (24 * 60 * 60 * 1000));

  return diffDays;
}

function playerAge(dateString) {
  var year = dateString.substring(0, 4);
  var month = dateString.substring(5, 7);
  var day = dateString.substring(8, 9);

  var dateOfBirth = new Date(year, month - 1, day);
  var today = currentDate();
  var age = today.getFullYear() - dateOfBirth.getFullYear();
  var m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

function currentDate() {
  var currDate = new Date();
  currDate.setHours(0, 0, 0, 0);
  return currDate;
}

function displayCurrentTime() {
  var currDate = new Date();
  var hours = currDate.getHours();
  var minutes = currDate.getMinutes();
  var seconds = currDate.getSeconds();
  var time = hours + ":" + minutes + ":" + seconds;

  console.log(time);
}

function convertDate(dateString) {
  var year = dateString.substring(0, 4);
  var month = dateString.substring(4, 6);
  var day = dateString.substring(6, 8);

  return new Date(year, month - 1, day);
}

function playedGame(dateString) {
  var date = convertDate(dateString);
  var currDate = currentDate();

  return date < currDate;
}

function sortStats(stats) {
  stats.sort(function (a, b) {
    var dateA = new Date(a.game.date);
    var dateB = new Date(b.game.date);
    return dateA - dateB;
  });
  return stats;
}

function parseSeasonStats(seasonStats, isTeam) {
  var minutesPlayed = parseInt(seasonStats.min);
  var gamesPlayed = parseInt(seasonStats.gamesPlayed);

  var totals = {
    pts: parseInt(seasonStats.points),
    ast: parseInt(seasonStats.assists),
    orb: parseInt(seasonStats.offReb),
    drb: parseInt(seasonStats.defReb),
    stl: parseInt(seasonStats.steals),
    blk: parseInt(seasonStats.blocks),
    tov: parseInt(seasonStats.turnovers),
    tpm: parseInt(seasonStats.tpm),
    tpa: parseInt(seasonStats.tpa),
    tpp: parseFloat(seasonStats.tpp),
    fgm: parseInt(seasonStats.fgm),
    fga: parseInt(seasonStats.fga),
    fgp: parseFloat(seasonStats.fgp),
    ftm: parseInt(seasonStats.ftm),
    fta: parseInt(seasonStats.fta),
    ftp: parseFloat(seasonStats.ftp),
    mp: minutesPlayed,
    pf: parseFloat(seasonStats.pFouls),
    fp: calculations.playerFantasyPoints(
      parseFloat(seasonStats.points),
      parseFloat(seasonStats.assists),
      parseFloat(seasonStats.totReb),
      parseFloat(seasonStats.steals),
      parseFloat(seasonStats.blocks),
      parseFloat(seasonStats.turnovers)
    ),
    atr: parseFloat(seasonStats.apg) / parseFloat(seasonStats.topg),
    gp: gamesPlayed,
    gs: parseInt(seasonStats.gamesStarted),
  };

  var season = {
    perGame: {
      pts: totals.pts / gamesPlayed,
      ast: totals.ast / gamesPlayed,
      orb: totals.orb / gamesPlayed,
      drb: totals.drb / gamesPlayed,
      stl: totals.stl / gamesPlayed,
      blk: totals.blk / gamesPlayed,
      tov: totals.tov / gamesPlayed,
      tpm: totals.tpm / gamesPlayed,
      tpa: totals.tpa / gamesPlayed,
      fgm: totals.fgm / gamesPlayed,
      fga: totals.fga / gamesPlayed,
      ftm: totals.ftm / gamesPlayed,
      fta: totals.fta / gamesPlayed,
      mp: totals.mp / gamesPlayed,
      pf: totals.pf / gamesPlayed,
      fp: totals.fp / gamesPlayed,
      atr: totals.atr / gamesPlayed,
    },
    perMin: {
      pts: totals.pts / minutesPlayed,
      ast: totals.ast / minutesPlayed,
      orb: totals.orb / minutesPlayed,
      drb: totals.drb / minutesPlayed,
      stl: totals.stl / minutesPlayed,
      blk: totals.blk / minutesPlayed,
      tov: totals.tov / minutesPlayed,
      tpm: totals.tpm / minutesPlayed,
      tpa: totals.tpa / minutesPlayed,
      fgm: totals.fgm / minutesPlayed,
      fga: totals.fga / minutesPlayed,
      ftm: totals.ftm / minutesPlayed,
      fta: totals.fta / minutesPlayed,
      mp: totals.mp / minutesPlayed,
      pf: totals.pf / minutesPlayed,
      fp: totals.fp / minutesPlayed,
      atr: totals.atr / minutesPlayed,
    },
    totals: totals,
  };

  if (isTeam) {
    season.teamId = seasonStats.teamId;
  }

  return season;
}

function parseSeasonalStats(seasonalStats) {
  var seasonsPlayed = [];

  if (seasonalStats != undefined || seasonalStats.length != 0) {
    var numOfTeams = 0;
    for (let i = 0; i < seasonalStats.length; i++) {
      var currSeason = seasonalStats[i];
      var teamsPlayed = [];
      var season = {};
      var team = {};

      for (let j = 0; j < currSeason.teams.length; j++) {
        var currTeam = currSeason.teams[j];
        var team = parseSeasonStats(currTeam, true);
        teamsPlayed.push(team);
        numOfTeams = j;
      }
      if (numOfTeams == 1) {
        season = {
          seasonYear: currSeason.seasonYear,
          teams: teamsPlayed,
          perGame: teamsPlayed[0].perGame,
          perMin: teamsPlayed[0].perMin,
          totals: teamsPlayed[0].totals,
        };
      } else {
        season = parseSeasonStats(currSeason.total, false);
        season.seasonYear = currSeason.seasonYear;
        season.teams = teamsPlayed;
      }
      seasonsPlayed.push(season);
    }
  }
  return seasonsPlayed;
}

function updateQueue(currQueue, newQueue, maxGames) {
  var currGames = currQueue;
  var newGames = newQueue;
  var result = [];

  if (newGames === undefined || newGames.length == 0) {
    result =
      currGames.length > maxGames ? currGames.slice(0, maxGames) : currGames;
  } else if (newGames.length >= maxGames) {
    result = newGames.slice(0, maxGames);
  } else if (currGames === undefined || currGames.length == 0) {
    result = newGames;
  } else if (currGames.length + newGames.length >= maxGames) {
    result = newGames.concat(currGames.slice(0, maxGames - newGames.length));
  } else if (currGames.length + newGames.length <= maxGames) {
    result = newGames.concat(currGames);
  }
  return result;
}

function formatPlayer(player) {
  var cleanedPlayer = {};
  var seasonsPlayed = [];

  if (player.stats.season != undefined) {
    seasonsPlayed = parseSeasonalStats(player.stats.season);
  }

  cleanedPlayer = {
    _id: player.personId,
    name: player.firstName + " " + player.lastName,
    teamId: player.teamId,
    jersey: parseInt(player.jersey),
    pos: player.pos,
    heightFeet: parseInt(player.heightFeet),
    heightInches: parseInt(player.heightInches),
    weightPounds: parseInt(player.weightPounds),
    dateOfBirthUTC: player.dateOfBirthUTC,
    daysOld: daysOld(player.dateOfBirthUTC),
    yearsPro: parseInt(player.yearsPro),
    country: player.country,
    stats: {
      season: seasonsPlayed,
      recent: {
        playedGames: [],
        missedGames: [],
        differential: {
          last3: {},
          last5: {},
          last7: {},
          last10: {},
        },
        advanced: {
          last3: {},
          last5: {},
          last7: {},
          last10: {},
        },
        deviation: {},
      },
    },
  };
  return cleanedPlayer;
}

function formatGame(game) {
  var gameDate;
  if (game.startDateEastern == undefined) {
    gameDate = game.gameUrlCode.substring(0, 8);
  } else {
    gameDate = game.startDateEastern;
  }

  var cleanedGame = {
    _id: game.gameId,
    seasonStageId: game.seasonStageId,
    gameUrlCode: game.gameUrlCode,
    statusNum: game.statusNum,
    extendedStatusNum: game.extendedStatusNum,
    isStartTimeTBD: game.isStartTimeTBD,
    startTimeUTC: game.startTimeUTC,
    startDateEastern: convertDate(gameDate),
    isNeutralVenue: game.isNeutralVenue,
    startTimeEastern: game.startTimeEastern,
    updateStatus: game.updateStatus,
    hTeam: {
      teamId: game.hTeam.teamId,
      score: parseInt(game.hTeam.score),
      win: parseInt(game.hTeam.win),
      loss: parseInt(game.hTeam.loss),
      gamesPlayed: parseInt(game.hTeam.win) + parseInt(game.hTeam.loss),
      stats: game.hTeam.stats,
    },
    vTeam: {
      teamId: game.vTeam.teamId,
      score: parseInt(game.vTeam.score),
      win: parseInt(game.vTeam.win),
      loss: parseInt(game.vTeam.loss),
      gamesPlayed: parseInt(game.vTeam.win) + parseInt(game.vTeam.loss),
      stats: game.vTeam.stats,
    },
  };

  return cleanedGame;
}

function formatTeam(team) {
  var cleanedTeam = {
    _id: team.teamId,
    city: team.city,
    fullName: team.fullName,
    confName: team.confName,
    tricode: team.tricode,
    divName: team.divName,
    nickname: team.nickname,
    urlName: team.urlName,
    gp: 0,
    gamelog: [],
    roster: team.roster,
  };

  return cleanedTeam;
}

function formatTeamUpdate(
  teamId,
  teamData,
  roster,
  gamesPlayed,
  usageRankings,
  gamelog
) {
  var updates = {};
  var updateString;
  var command;

  for (let i = 0; i < teamData.length; i++) {
    updateString = "roster." + i;

    updates[updateString] = {
      playerId: roster[i].playerId,
      isActive: roster[i].isActive,
      pos: roster[i].pos,
      name: roster[i].name,
      seasonalStats: roster[i].seasonalStats,
      data: {
        usage: teamData[i].usage,
        games: teamData[i].games,
        averages: teamData[i].averages,
        teamAverages: teamData[i].teamAverages,
        matchupGames: teamData[i].matchupGames,
        matchupAverages: teamData[i].matchupAverages,
        gp: teamData[i].gp,
        gm: teamData[i].gm,
      },
    };
  }
  updates.gp = gamesPlayed;
  updates.gamelog = gamelog;
  updates.usageRankings = usageRankings;

  command = {
    updateOne: {
      filter: { _id: teamId },
      update: { $set: updates },
    },
  };
  return command;
}

function formatGameUpdate(game) {
  var updates = {};
  var command;

  updates.updateStatus = game.updateStatus;
  updates.hTeam = game.hTeam;
  updates.vTeam = game.vTeam;

  command = {
    updateOne: {
      filter: { _id: game._id },
      update: { $set: updates },
    },
  };

  return command;
}

function formatScheduleUpdate() {
  return [
    {
      updateMany: {
        filter: { updateStatus: constants.updateStatus.PENDING },
        update: { $set: { updateStatus: constants.updateStatus.COMPLETE } },
      },
    },
  ];
}

function formatMissingPlayers(missingPlayers) {
  var cleanedPlayers = [];

  if (missingPlayers.length != 0) {
    cleanedPlayers = missingPlayers.map((player) => {
      return {
        _id: player.playerId,
        name: player.name,
        teamId:
          player.seasonalStats[0] != undefined
            ? player.seasonalStats[0].teams[0].teamId
            : "",
        pos: player.pos,
        dateOfBirthUTC: "",
        daysOld: "",
        yearsPro: 0,
        country: "",
        stats: {
          season: player.seasonalStats,
          recent: {
            playedGames: [],
            missedGames: [],
            differential: {
              last3: {},
              last5: {},
              last7: {},
              last10: {},
            },
            advanced: {
              last3: {},
              last5: {},
              last7: {},
              last10: {},
            },
            deviation: {},
          },
        },
      };
    });
  }

  return cleanedPlayers;
}

function assignPlayerStats(player, minsPlayed) {
  var playerStats = {
    playerId: player.personId,
    pos: player.pos,
    name: player.firstName + " " + player.lastName,
    dnp: player.dnp,
    stats: {
      pts: parseInt(player.points),
      ast: parseInt(player.assists),
      drb: parseInt(player.defReb),
      orb: parseInt(player.offReb),
      stl: parseInt(player.steals),
      blk: parseInt(player.blocks),
      tov: parseInt(player.turnovers),
      fgm: parseInt(player.fgm),
      fga: parseInt(player.fga),
      fgp: parseFloat(player.fgp),
      tpm: parseInt(player.tpm),
      tpa: parseInt(player.tpa),
      tpp: parseFloat(player.tpp),
      ftm: parseInt(player.ftm),
      fta: parseInt(player.fta),
      ftp: parseFloat(player.ftp),
      mp: minsPlayed,
      pf: parseInt(player.pFouls),
      fp: calculations.playerFantasyPoints(
        parseInt(player.points),
        parseInt(player.assists),
        parseInt(player.defReb) + parseInt(player.offReb),
        parseInt(player.steals),
        parseInt(player.blocks),
        parseInt(player.turnovers)
      ),
    },
  };

  return playerStats;
}

function assignTeamStats(key, value, mins) {
  key.pts = parseInt(value.points);
  key.ast = parseInt(value.assists);
  key.drb = parseInt(value.defReb);
  key.orb = parseInt(value.offReb);
  key.stl = parseInt(value.steals);
  key.blk = parseInt(value.blocks);
  key.tov = parseInt(value.turnovers);
  key.fgm = parseInt(value.fgm);
  key.fga = parseInt(value.fga);
  key.tpm = parseInt(value.tpm);
  key.tpa = parseInt(value.tpa);
  key.ftm = parseInt(value.ftm);
  key.fta = parseInt(value.fta);
  key.mp = mins;
  key.pf = parseInt(value.pFouls);
  key.tf = parseInt(value.team_fouls);
}

function assignDnp(player) {
  const reasons = {
    MISSING_FROM_ROSTER: "Missing From Game Roster",
    COACH_DECISION: "Coach's Decision",
    INJURY_ILLNESS: "Injury / Illness",
  };
  if (player == undefined) {
    return reasons.MISSING_FROM_ROSTER;
  } else if (player.dnp == "") {
    return reasons.COACH_DECISION;
  } else if (player.dnp.substring(0, 3) == "DNP") {
    return player.dnp.substring(5, player.dnp.length);
  }
}

function assignNewPlayerGameStats(
  player,
  newPlayerGames,
  playerGamesPlayed,
  matchupGamesPlayed,
  playerGameStats,
  matchupGameStats,
  teamGameStats
) {
  teamGameStats.new = newPlayerGames.map((game) => {
    return game.team.teamStats;
  });

  playerGameStats.new = newPlayerGames.map((game) => {
    return game.team.activePlayers
      .filter((teamPlayer) => {
        return teamPlayer.playerId == player.playerId;
      })
      .map((gamePlayer) => {
        return gamePlayer.stats;
      })[0];
  });

  matchupGameStats.new = newPlayerGames.map((game) => {
    return game.team.activePlayers
      .filter((teamPlayer) => {
        return (
          teamPlayer.playerId == player.playerId && teamPlayer.matchup != {}
        );
      })
      .map((gamePlayer) => {
        return gamePlayer.matchup;
      })[0];
  });

  matchupGamesPlayed.new = matchupGameStats.new.length;

  playerGamesPlayed.curr = playerGamesPlayed.old + playerGamesPlayed.new;
  playerGameStats.curr = playerGameStats.old.concat(playerGameStats.new);
  matchupGamesPlayed.curr = matchupGamesPlayed.old + matchupGamesPlayed.new;
  matchupGameStats.curr = matchupGameStats.old.concat(matchupGameStats.new);
}

function assignNewAverages(gamesPlayed, averages, gameStats) {
  if (gamesPlayed.new == 0) {
    averages.curr = averages.old;
  } else {
    averages.new = calculations.newAverages(gameStats.new);
    if (gamesPlayed.old == 0) {
      averages.curr = averages.new;
    } else {
      averages.curr = calculations.currAverages(
        averages.old,
        averages.new,
        gamesPlayed.old,
        gamesPlayed.new,
        gamesPlayed.curr
      );
    }
  }
}

function assignMissingUsage(inactivePlayers, missingUsage) {
  for (let j = 0; j < inactivePlayers.length; j++) {
    for (var usage in missingUsage.all) {
      missingUsage.all[usage] += inactivePlayers[j].usageAverage[usage];
    }
    if (inactivePlayers[j].pos != "") {
      for (var usage in missingUsage[inactivePlayers[j].pos]) {
        missingUsage[inactivePlayers[j].pos][usage] +=
          inactivePlayers[j].usageAverage[usage];
      }
    }
  }
}

function assignGameToTeam(sortedGames, teamA, teamB) {
  if (sortedGames.hasOwnProperty(teamA.teamId)) {
    sortedGames[teamA.teamId].push({
      team: teamA,
      opponent: teamB,
    });
  } else {
    sortedGames[teamA.teamId] = [
      {
        team: teamA,
        opponent: teamB,
      },
    ];
  }
}

function filterGames(games) {
  var cleanedGames;
  var cleanedGame;
  var hTeamActivePlayers;
  var vTeamActivePlayers;
  var hTeamInactivePlayers;
  var vTeamInactivePlayers;

  cleanedGames = games.map((game) => {
    hTeamActivePlayers = activePlayers(game.hTeam.stats.player);
    vTeamActivePlayers = activePlayers(game.vTeam.stats.player);
    hTeamInactivePlayers = inactivePlayers(game.hTeam.stats.player);
    vTeamInactivePlayers = inactivePlayers(game.vTeam.stats.player);

    cleanedGame = {
      hTeam: {
        gameId: game._id,
        teamId: game.hTeam.teamId,
        teamStats: game.hTeam.stats.team,
        activePlayers: hTeamActivePlayers,
        inactivePlayers: hTeamInactivePlayers,
      },
      vTeam: {
        gameId: game._id,
        teamId: game.vTeam.teamId,
        teamStats: game.vTeam.stats.team,
        activePlayers: vTeamActivePlayers,
        inactivePlayers: vTeamInactivePlayers,
      },
    };
    return cleanedGame;
  });

  return cleanedGames;
}

function activePlayers(players) {
  var activePlayers = players
    .filter((player) => {
      return player.stats.mp > 0;
    })
    .map((player) => {
      return {
        playerId: player.playerId,
        name: player.name,
        pos: player.pos,
        dnp: player.dnp,
        stats: {
          pts: player.stats.pts,
          ast: player.stats.ast,
          drb: player.stats.drb,
          orb: player.stats.orb,
          stl: player.stats.stl,
          blk: player.stats.blk,
          tov: player.stats.tov,
          fgm: player.stats.fgm,
          fga: player.stats.fga,
          tpm: player.stats.tpm,
          tpa: player.stats.tpa,
          ftm: player.stats.ftm,
          fta: player.stats.fta,
          mp: player.stats.mp,
          pf: player.stats.pf,
          fp: player.stats.fp,
        },
        matchup: player.matchup,
      };
    });
  return activePlayers;
}

function inactivePlayers(players) {
  var inactivePlayers = players
    .filter((player) => {
      return player.stats.mp == 0;
    })
    .map((player) => {
      return {
        playerId: player.playerId,
        name: player.name,
        pos: player.pos,
        dnp: player.dnp,
        stats: {},
        matchup: {},
      };
    });
  return inactivePlayers;
}

function sortGamesByTeam(games) {
  var sortedGames = {};

  for (let i = 0; i < games.length; i++) {
    assignGameToTeam(sortedGames, games[i].hTeam, games[i].vTeam);
    assignGameToTeam(sortedGames, games[i].vTeam, games[i].hTeam);
  }

  return sortedGames;
}

function updateNewGamelog(usageRankings, gamelog, sortedGames, team, roster) {
  gamelog.new = sortedGames[team._id].map((game) => {
    var missingUsage = {
      all: {
        scoring: 0,
        playmaking: 0,
        rebounding: 0,
      },
      G: {
        scoring: 0,
        playmaking: 0,
        rebounding: 0,
      },
      GF: {
        scoring: 0,
        playmaking: 0,
        rebounding: 0,
      },
      FG: {
        scoring: 0,
        playmaking: 0,
        rebounding: 0,
      },
      F: {
        scoring: 0,
        playmaking: 0,
        rebounding: 0,
      },
      FC: {
        scoring: 0,
        playmaking: 0,
        rebounding: 0,
      },
      CF: {
        scoring: 0,
        playmaking: 0,
        rebounding: 0,
      },
      C: {
        scoring: 0,
        playmaking: 0,
        rebounding: 0,
      },
    };
    var inactivePlayers = roster
      .filter((rosterPlayer) => {
        return (
          game.team.activePlayers.filter((gamePlayer) => {
            return gamePlayer.playerId == rosterPlayer.playerId;
          }).length == 0
        );
      })
      .map((inactivePlayer) => {
        var match = game.team.inactivePlayers.filter((gamePlayer) => {
          return gamePlayer.playerId == inactivePlayer.playerId;
        })[0];

        var dnp = assignDnp(match);

        return {
          playerId: inactivePlayer.playerId,
          name: inactivePlayer.name,
          pos: inactivePlayer.pos,
          dnp: dnp,
          usageAverage: {
            scoring: usageRankings.scoring
              .filter((player) => {
                return player.playerId == inactivePlayer.playerId;
              })
              .map((player) => {
                return player.scoringUsage;
              })[0],
            playmaking: usageRankings.playmaking
              .filter((player) => {
                return player.playerId == inactivePlayer.playerId;
              })
              .map((player) => {
                return player.playmakingUsage;
              })[0],
            rebounding: usageRankings.rebounding
              .filter((player) => {
                return player.playerId == inactivePlayer.playerId;
              })
              .map((player) => {
                return player.reboundingUsage;
              })[0],
          },
        };
      });

    assignMissingUsage(inactivePlayers, missingUsage);

    return {
      gameId: game.team.gameId,
      teamStats: game.team.teamStats,
      activePlayers: game.team.activePlayers,
      inactivePlayers: inactivePlayers,
      missingUsage: missingUsage,
      opponentId: game.opponent.teamId,
      opponentStats: game.opponent.teamStats,
    };
  });
}

function updateOldGamelog(usageRankings, gamelog) {
  usageRankings.scoring = calculations.usageRankings(
    usageRankings.scoring,
    constants.usageType.SCORING
  );

  usageRankings.playmaking = calculations.usageRankings(
    usageRankings.playmaking,
    constants.usageType.PLAYMAKING
  );

  usageRankings.rebounding = calculations.usageRankings(
    usageRankings.rebounding,
    constants.usageType.REBOUNDING
  );

  if (gamelog.old.length != 0) {
    gamelog.old = gamelog.old.map((game) => {
      var missingUsage = {
        all: {
          scoring: 0,
          playmaking: 0,
          rebounding: 0,
        },
        G: {
          scoring: 0,
          playmaking: 0,
          rebounding: 0,
        },
        GF: {
          scoring: 0,
          playmaking: 0,
          rebounding: 0,
        },
        FG: {
          scoring: 0,
          playmaking: 0,
          rebounding: 0,
        },
        F: {
          scoring: 0,
          playmaking: 0,
          rebounding: 0,
        },
        FC: {
          scoring: 0,
          playmaking: 0,
          rebounding: 0,
        },
        CF: {
          scoring: 0,
          playmaking: 0,
          rebounding: 0,
        },
        C: {
          scoring: 0,
          playmaking: 0,
          rebounding: 0,
        },
      };
      var inactivePlayers = game.inactivePlayers.map((inactivePlayer) => {
        return {
          playerId: inactivePlayer.playerId,
          name: inactivePlayer.name,
          pos: inactivePlayer.pos,
          dnp: inactivePlayer.dnp,
          usageAverage: {
            scoring: usageRankings.scoring
              .filter((player) => {
                return player.playerId == inactivePlayer.playerId;
              })
              .map((player) => {
                return player.scoringUsage;
              })[0],
            playmaking: usageRankings.playmaking
              .filter((player) => {
                return player.playerId == inactivePlayer.playerId;
              })
              .map((player) => {
                return player.playmakingUsage;
              })[0],
            rebounding: usageRankings.rebounding
              .filter((player) => {
                return player.playerId == inactivePlayer.playerId;
              })
              .map((player) => {
                return player.reboundingUsage;
              })[0],
          },
        };
      });

      assignMissingUsage(inactivePlayers, missingUsage);

      return {
        gameId: game.gameId,
        teamStats: game.teamStats,
        activePlayers: game.activePlayers,
        inactivePlayers: inactivePlayers,
        missingUsage: missingUsage,
        opponentId: game.opponentId,
        opponentStats: game.opponentStats,
      };
    });
  }
}

function updateGamelog(usageRankings, gamelog, sortedGames, team, roster) {
  updateOldGamelog(usageRankings, gamelog);
  updateNewGamelog(usageRankings, gamelog, sortedGames, team, roster);
  gamelog.curr = gamelog.old.concat(gamelog.new);
}

module.exports.playerAge = playerAge;
module.exports.convertDate = convertDate;
module.exports.currentDate = currentDate;
module.exports.displayCurrentTime = displayCurrentTime;
module.exports.playedGame = playedGame;
module.exports.sortStats = sortStats;
module.exports.updateQueue = updateQueue;

module.exports.formatPlayer = formatPlayer;
module.exports.formatGame = formatGame;
module.exports.formatTeam = formatTeam;
module.exports.formatTeamUpdate = formatTeamUpdate;
module.exports.formatGameUpdate = formatGameUpdate;
module.exports.formatScheduleUpdate = formatScheduleUpdate;
module.exports.formatMissingPlayers = formatMissingPlayers;
module.exports.assignPlayerStats = assignPlayerStats;
module.exports.assignTeamStats = assignTeamStats;
module.exports.assignDnp = assignDnp;
module.exports.assignNewPlayerGameStats = assignNewPlayerGameStats;
module.exports.assignNewAverages = assignNewAverages;
module.exports.assignMissingUsage = assignMissingUsage;
module.exports.filterGames = filterGames;
module.exports.sortGamesByTeam = sortGamesByTeam;
module.exports.updateGamelog = updateGamelog;
