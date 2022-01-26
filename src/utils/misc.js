const calculations = require("./calculations.js");

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

function sortStats(stats) {
  stats.sort(function (a, b) {
    var dateA = new Date(a.game.date);
    var dateB = new Date(b.game.date);
    return dateA - dateB;
  });
  return stats;
}

function formatGame(game) {
  cleanedGame = {
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
    gameStatus: game.gameStatus,
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

function formatPlayer(player) {
  var seasonsPlayed = [];
  var cleanedPlayer = {};
  if (player.stats != undefined) {
    for (let i = 0; i < player.stats.season.length; i++) {
      var currSeason = player.stats.season[i];
      var teamsPlayed = [];

      for (let j = 0; j < currSeason.teams.length; j++) {
        var currTeam = currSeason.teams[j];

        var team = {
          teamId: currTeam.teamId,
          ppg: parseFloat(currTeam.ppg),
          rpg: parseFloat(currTeam.rpg),
          apg: parseFloat(currTeam.apg),
          spg: parseFloat(currTeam.spg),
          bpg: parseFloat(currTeam.bpg),
          tpg: parseFloat(currTeam.topg),
          mpg: parseFloat(currTeam.mpg),
          tpp: parseFloat(currTeam.tpp),
          ftp: parseFloat(currTeam.ftp),
          fgp: parseFloat(currTeam.fgp),
          pts: parseInt(currTeam.points),
          ast: parseInt(currTeam.assists),
          blk: parseInt(currTeam.blocks),
          stl: parseInt(currTeam.steals),
          tov: parseInt(currTeam.turnovers),
          orb: parseInt(currTeam.offReb),
          drb: parseInt(currTeam.defReb),
          reb: parseInt(currTeam.totReb),
          fgm: parseInt(currTeam.fgm),
          fga: parseInt(currTeam.fga),
          tpm: parseInt(currTeam.tpm),
          tpa: parseInt(currTeam.tpa),
          ftm: parseInt(currTeam.ftm),
          fta: parseInt(currTeam.fta),
          pf: parseInt(currTeam.pFouls),
          gp: parseInt(currTeam.gamesPlayed),
          gs: parseInt(currTeam.gamesStarted),
          pm: parseInt(currTeam.plusMinus),
          min: parseInt(currTeam.min),
          dd2: parseInt(currTeam.dd2),
          td3: parseInt(currTeam.td3),
        };

        teamsPlayed.push(team);
      }
      var season = {
        seasonYear: currSeason.seasonYear,
        teams: teamsPlayed,
        ppg: parseFloat(currSeason.total.ppg),
        rpg: parseFloat(currSeason.total.rpg),
        apg: parseFloat(currSeason.total.apg),
        spg: parseFloat(currSeason.total.spg),
        bpg: parseFloat(currSeason.total.bpg),
        topg: parseFloat(currSeason.total.topg),
        mpg: parseFloat(currSeason.total.mpg),
        tpp: parseFloat(currSeason.total.tpp),
        ftp: parseFloat(currSeason.total.ftp),
        fgp: parseFloat(currSeason.total.fgp),
        pts: parseInt(currSeason.total.points),
        ast: parseInt(currSeason.total.assists),
        blk: parseInt(currSeason.total.blocks),
        stl: parseInt(currSeason.total.steals),
        tov: parseInt(currSeason.total.turnovers),
        orb: parseInt(currSeason.total.offReb),
        drb: parseInt(currSeason.total.defReb),
        reb: parseInt(currSeason.total.totReb),
        fgm: parseInt(currSeason.total.fgm),
        fga: parseInt(currSeason.total.fga),
        tpm: parseInt(currSeason.total.tpm),
        tpa: parseInt(currSeason.total.tpa),
        ftm: parseInt(currSeason.total.ftm),
        fta: parseInt(currSeason.total.fta),
        pf: parseInt(currSeason.total.pFouls),
        gp: parseInt(currSeason.total.gamesPlayed),
        gs: parseInt(currSeason.total.gamesStarted),
        pm: parseInt(currSeason.total.plusMinus),
        min: parseInt(currSeason.total.min),
        dd2: parseInt(currSeason.total.dd2),
        td3: parseInt(currSeason.total.td3),
        fppg: parseFloat(currSeason.total.fppg),
      };

      seasonsPlayed.push(season);
    }

    cleanedPlayer = {
      _id: player.personId,
      name: player.firstName + " " + player.lastName,
      teamId: player.teamId,
      jersey: parseInt(player.jersey),
      heightFeet: parseInt(player.heightFeet),
      heightInches: parseInt(player.heightInches),
      weightPounds: parseInt(player.weightPounds),
      dateOfBirthUTC: player.dateOfBirthUTC,
      age: playerAge(player.dateOfBirthUTC),
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
        },
      },
    };
  } else {
    cleanedPlayer = {
      _id: player.personId,
      name: player.firstName + " " + player.lastName,
      teamId: player.teamId,
      jersey: parseInt(player.jersey),
      heightFeet: parseInt(player.heightFeet),
      heightInches: parseInt(player.heightInches),
      weightPounds: parseInt(player.weightPounds),
      dateOfBirthUTC: player.dateOfBirthUTC,
      yearsPro: parseInt(player.yearsPro),
      country: player.country,
      stats: {
        season: [],
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
        },
      },
    };
  }
  return cleanedPlayer;
}

function assignPlayerStats(player, minsPlayed, matchup, matchupMinsPlayed) {
  var playerStats = {
    playerId: player.personId,
    name: player.firstName + " " + player.lastName,
    matchup:
      matchup == null
        ? null
        : {
            playerId: matchup.personId,
            name: matchup.firstName + " " + matchup.lastName,
            pts: parseInt(matchup.points),
            ast: parseInt(matchup.assists),
            drb: parseInt(matchup.defReb),
            orb: parseInt(matchup.offReb),
            stl: parseInt(matchup.steals),
            blk: parseInt(matchup.blocks),
            tov: parseInt(matchup.turnovers),
            fgm: parseInt(matchup.fgm),
            fga: parseInt(matchup.fga),
            tpm: parseInt(matchup.tpm),
            tpa: parseInt(matchup.tpa),
            ftm: parseInt(matchup.ftm),
            fta: parseInt(matchup.fta),
            mp: matchupMinsPlayed,
            pf: parseInt(matchup.pFouls),
            fp: calculations.playerFantasyPoints(
              parseInt(matchup.points),
              parseInt(matchup.assists),
              parseInt(matchup.defReb) + parseInt(matchup.offReb),
              parseInt(matchup.steals),
              parseInt(matchup.blocks),
              parseInt(matchup.turnovers)
            ),
            dnp: matchup.dnp,
          },
    pos: player.pos,
    pts: parseInt(player.points),
    ast: parseInt(player.assists),
    drb: parseInt(player.defReb),
    orb: parseInt(player.offReb),
    stl: parseInt(player.steals),
    blk: parseInt(player.blocks),
    tov: parseInt(player.turnovers),
    fgm: parseInt(player.fgm),
    fga: parseInt(player.fga),
    tpm: parseInt(player.tpm),
    tpa: parseInt(player.tpa),
    ftm: parseInt(player.ftm),
    fta: parseInt(player.fta),
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
    dnp: player.dnp,
  };

  return playerStats;
}

function updateQueue(currQueue, newQueue, maxGames) {
  if (newQueue === undefined || newQueue.length == 0) {
    return currQueue;
  } else if (currQueue === undefined || currQueue.length == 0) {
    return newQueue;
  } else if (newQueue.length >= maxGames) {
    return newQueue.splice(0, maxGames);
  } else if (currQueue.length + newQueue.length >= maxGames) {
    return currQueue.splice(
      maxGames - newQueue.length,
      currQueue.length + newQueue.length - maxGames
    );
  } else if (currQueue.length + newQueue.length <= maxGames) {
    return newQueue.concat(currQueue);
  }
}

module.exports.playerAge = playerAge;
module.exports.convertDate = convertDate;
module.exports.currentDate = currentDate;
module.exports.playedGame = playedGame;
module.exports.sortStats = sortStats;
module.exports.assignTeamStats = assignTeamStats;
module.exports.formatGame = formatGame;
module.exports.formatPlayer = formatPlayer;
module.exports.assignPlayerStats = assignPlayerStats;
module.exports.updateQueue = updateQueue;
