const calculations = require("./calculations.js");
const processing = require("./processing.js");

function daysOld(dateOfBirth) {
  var year = dateOfBirth.substring(0, 4);
  var month = dateOfBirth.substring(5, 7) - 1;
  var day = dateOfBirth.substring(8, 10);

  var currDate = currentDate();
  var birthDate = new Date(year, month, day);

  const diffDays = Math.round((currDate - birthDate) / (24 * 60 * 60 * 1000));

  return diffDays;
}

function testDaysOld() {
  var dateOfBirth = "2001-01-16";

  console.log(daysOld(dateOfBirth));
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
  var cleanedGame = {
    _id: game.gameId,
    seasonStageId: game.seasonStageId,
    gameUrlCode: game.gameUrlCode,
    statusNum: game.statusNum,
    extendedStatusNum: game.extendedStatusNum,
    isStartTimeTBD: game.isStartTimeTBD,
    startTimeUTC: game.startTimeUTC,
    startDateEastern: convertDate(game.startDateEastern),
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
  scoringUsageRankings,
  playmakingUsageRankings,
  reboundingUsageRankings,
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
  updates.scoringUsageRankings = scoringUsageRankings;
  updates.playmakingUsageRankings = playmakingUsageRankings;
  updates.reboundingUsageRankings = reboundingUsageRankings;

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
        filter: { updateStatus: processing.updateStatus.PENDING },
        update: { $set: { updateStatus: processing.updateStatus.COMPLETE } },
      },
    },
  ];
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
