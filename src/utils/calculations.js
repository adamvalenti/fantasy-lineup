/*

how to access game data "/data/10s/json/cms/2021/game/{{gameDate}}/{{gameId}}/playersPerGame.json"

Based on DR by Oliver

Most stats are team based and then estimated to a player by dividing by 5 and multiplying by steals*blocks

assumptions of IDR:
    - all teammates are equally good at forcing misses and turnovers.
    - team DRtg can be used as a basis for individial defense, with stops providing an player deviation.
    - all 5 players on court shoulder the same amount of defensive possessions. (In short, for all players %Tm_DPoss=0.2)

Glossary:
IDR = player defensive rating
TDR = team defensive rating
D_Pts_per_ScPoss = how many points, on average, the player allows when the shot is made (or a foul is committed).
Stops1 = countable stops caused by a player
Stops2 = uncountable stops caused by a player
FMwt = the difficulty of forcing a miss against the difficulty of grabbing a defensive rebound 
DOR% = defensive offensive rebound percentage
DFG% = defensive field goal percentage
Opp_ORB = opponent offensive rebounds
Team_DRB = team defensive rebounds
Opp_FG% = opponent field goal percentage 

*/

function minutesPlayed(minsPlayed) {
  if (minsPlayed === "") {
    minsPlayed = 0;
  } else {
    var mins = parseInt(minsPlayed.split(":")[0]);
    var secs = parseInt(minsPlayed.split(":")[1]);
    minsPlayed = secs >= 30 ? mins + 1 : mins;
  }
  return minsPlayed;
}

function advancedPlayerStats(player, team, opponent) {
  var advancedStats = {
    ortg: playerOffRtg(player, team, opponent),
    drtg: playerDefRtg(player, team, opponent),
    // per: playerEffRtg(player, team, league),
    usg: playerUsage(player, team),
  };

  return advancedStats;
}

function teamPos(team, opponent) {
  return (
    team.fga +
    0.4 * team.fta -
    1.07 * (team.orb / (team.orb + opponent.drb)) * (team.fga - team.fgm) +
    team.tov
  );
}

function numOfTeamPos(team, opponent) {
  return Math.round(0.5 * (teamPos(team, opponent) + teamPos(opponent, team)));
}

function teamPace(team, opponent) {
  var pace = 48 * ((team.pos + opponent.pos) / (2 * (team.mp / 5)));

  return pace;
}

function playerFantasyPoints(pts, ast, reb, stl, blk, tov) {
  const sliders = {
    pts: 1,
    ast: 1.5,
    reb: 1.2,
    stl: 3,
    blk: 3,
    tov: -1,
  };

  var fantasyPoints =
    pts * sliders.pts +
    ast * sliders.ast +
    reb * sliders.reb +
    stl * sliders.stl +
    blk * sliders.blk +
    tov * sliders.tov;

  return parseFloat(fantasyPoints);
}

function playerOffRtg(player, team, opponent) {
  var qAST =
    (player.mp / (team.mp / 5)) *
      (1.14 * ((team.ast - player.ast) / team.fgm)) +
    (((team.ast / team.mp) * player.mp * 5 - player.ast) /
      ((team.fgm / team.mp) * player.mp * 5 - player.fgm)) *
      (1 - player.mp / (team.mp / 5));

  var fgPart =
    player.fgm *
    (1 - 0.5 * ((player.pts - player.ftm) / (2 * player.fga)) * qAST);

  var astPart =
    0.5 *
    ((team.pts - team.ftm - (player.pts - player.ftm)) /
      (2 * (team.fga - player.fga))) *
    player.ast;

  var ftPart = ((1 - (1 - player.ftm / player.fta)) ^ 2) * 0.4 * player.fta;

  var teamScPoss =
    team.fgm + ((1 - (1 - team.ftm / team.fta)) ^ 2) * team.fta * 0.4;

  var teamOrbPer = team.orb / (team.orb + opponent.drb);

  var teamPlayPer = teamScPoss / (team.fga + team.fta * 0.4 + team.tov);

  var teamOrbWeight =
    ((1 - teamOrbPer) * teamPlayPer) /
    ((1 - teamOrbPer) * teamPlayPer + teamOrbPer * (1 - teamPlayPer));

  var orbPart = player.orb * teamOrbWeight * teamPlayPer;

  var scPoss =
    (fgPart + astPart + ftPart) *
      (1 - (team.orb / teamScPoss) * teamOrbWeight * teamPlayPer) +
    orbPart;

  var fgxPoss = (player.fga - player.fgm) * (1 - 1.07 * teamOrbPer);

  var ftxPoss = ((1 - player.ftm / player.fta) ^ 2) * 0.4 * player.fta;

  var totPoss = scPoss + fgxPoss + ftxPoss + player.tov;

  var ptsProdFgPart =
    2 *
    (player.fgm + 0.5 * player.tpm) *
    (1 - 0.5 * ((player.pts - player.ftm) / (2 * player.fga)) * qAST);

  var ptsProdAstPart =
    2 *
    ((team.fgm - player.fgm + 0.5 * (team.tpm - player.tpm)) /
      (team.fgm - player.fgm)) *
    0.5 *
    ((team.pts - team.ftm - (player.pts - player.ftm)) /
      (2 * (team.fga - player.fga))) *
    player.ast;

  var ptsProdOrbPart =
    player.orb *
    teamOrbWeight *
    teamPlayPer *
    (team.pts /
      (team.fgm + ((1 - (1 - team.ftm / team.fta)) ^ 2) * 0.4 * team.fta));

  var ptsProd =
    (ptsProdFgPart + ptsProdAstPart + player.ftm) *
      (1 - (team.orb / teamScPoss) * teamOrbWeight * teamPlayPer) +
    ptsProdOrbPart;

  var playerORtg = 100 * (ptsProd / totPoss);

  return playerORtg;
}

function test() {
  var player = {
    stats: {
      pts: 11,
      ast: 0,
      drb: 1,
      orb: 0,
      stl: 1,
      blk: 0,
      tov: 0,
      fgm: 3,
      fga: 9,
      tpm: 2,
      tpa: 7,
      ftm: 3,
      fta: 3,
      mp: 22,
      pf: 2,
    },
  };
  var opponent = {
    stats: {
      pts: 131,
      ast: 36,
      drb: 44,
      orb: 13,
      stl: 13,
      blk: 11,
      tov: 9,
      fgm: 51,
      fga: 109,
      tpm: 16,
      tpa: 37,
      ftm: 13,
      fta: 18,
      mp: 240,
      pf: 24,
      tf: 24,
      pos: 109,
      pace: 109,
    },
  };
  var team = {
    stats: {
      pts: 129,
      ast: 36,
      drb: 44,
      orb: 13,
      stl: 13,
      blk: 11,
      tov: 9,
      fgm: 51,
      fga: 115,
      tpm: 16,
      tpa: 37,
      ftm: 13,
      fta: 18,
      mp: 240,
      pf: 24,
      tf: 24,
      pos: 109,
      pace: 109,
    },
  };
  console.log(advancedPlayerStats(player.stats, team.stats, opponent.stats));
  console.log(lastNAverages());
}

// test();

function playerDefRtg(player, team, opponent) {
  var dorp = opponent.orb / (opponent.orb + team.drb);
  var fmwt =
    ((opponent.fgm / opponent.fga) * (1 - dorp)) /
    ((opponent.fgm / opponent.fga) * (1 - dorp) +
      (1 - opponent.fgm / opponent.fga) * dorp);
  var stops1 =
    player.stl +
    player.blk * fmwt * (1 - 1.07 * dorp) +
    player.drb * (1 - fmwt);
  var stops2 =
    (((opponent.fga - opponent.fgm - team.blk) / team.mp) *
      fmwt *
      (1 - 1.07 * dorp) +
      (opponent.tov - team.stl) / team.mp) *
      player.mp +
    (player.pf / team.pf) *
      0.4 *
      opponent.fta *
      ((1 - opponent.ftm / opponent.fta) ^ 2);
  var stopP = ((stops1 + stops2) * opponent.mp) / (team.pos * player.mp);
  var dPtsPerScPoss =
    opponent.pts /
    (opponent.fgm +
      ((1 - (1 - opponent.ftm / opponent.fta)) ^ 2) * opponent.fta * 0.4);
  var teamDrtg = 100 * (opponent.pts / team.pos);
  var playerDRtg =
    teamDrtg + 0.2 * (100 * dPtsPerScPoss * (1 - stopP) - teamDrtg);

  return playerDRtg;
}

function leagueConstants() {
  // var league = {
  //   factor:
  //     2 / 3 - (0.5 * (leagueStats.ast / leagueStats.fgm)) / (2 * (leagueStats.fgm / leagueStats.ftm));
  //   vop:
  //     leagueStats.pts / (leagueStats.fga - leagueStats.orb + leagueStats.tov + 0.44 * leagueStats.fta);
  //   drbp: leagueStats.drb / (leagueStats.drb + leagueStats.orb);
  // }

  // stats from basketball reference, 2020-2021 stats used. https://www.basketball-reference.com/leagues/NBA_stats_per_game.html

  // would be cool if leauge averages were projected for next season to help predict player improvement

  leagueStats = {
    pts: 112.1,
    ast: 24.8,
    orb: 9.8,
    drb: 34.5,
    tov: 13.8,
    fgm: 41.2,
    fga: 88.4,
    ftm: 17.0,
    fta: 21.8,
    pf: 19.3,
    pace: 99.2,
  };

  var league = {
    factor:
      2 / 3 -
      (0.5 * (24.8 / leagueStats.fgm)) /
        (2 * (leagueStats.fgm / leagueStats.ftm)),
    vop:
      leagueStats.pts /
      (leagueStats.fga -
        leagueStats.orb +
        leagueStats.tov +
        0.44 * leagueStats.fta),
    drbp: leagueStats.drb / (leagueStats.drb + leagueStats.orb),
    ftmpf: leagueStats.ftm / leagueStats.pf,
    ftapf: leagueStats.fta / leagueStats.pf,
    pace: leagueStats.pace,
  };
  return league;
}

function playerEffRtg(player, team, league) {
  var uPER =
    (1 / player.mp) *
    (player.tpm +
      (2 / 3) * player.ast +
      (2 - league.factor * (team.ast / team.fgm)) * player.fgm +
      player.ftm *
        0.5 *
        (1 + (1 - team.ast / team.fgm) + (2 / 3) * (team.ast / team.fgm)) -
      league.vop * player.tov -
      league.vop * league.drbp * (player.fga - player.fgm) -
      league.vop *
        0.44 *
        (0.44 + 0.56 * league.drbp) *
        (player.fta - player.ftm) +
      league.vop * (1 - league.drbp) * player.drb +
      league.vop * league.drbp * player.orb +
      league.vop * player.stl +
      league.vop * league.drbp * player.blk -
      player.pf * (league.ftmpf - 0.44 * league.ftapf * league.vop));

  var aPER = (league.pace / team.pace) * uPER;

  var PER = aPER * 54;

  return PER;
}

function playerUsage(player, team) {
  var usage =
    (100 * ((player.fga + 0.44 * player.fta + player.tov) * (team.mp / 5))) /
    (player.mp * (team.fga + 0.44 * team.fta + team.tov));

  return usage;
}

function scoringUsage(player, team) {
  var scoringUsage =
    (100 * (player.fga + 0.44 * player.fta)) / (team.fga + 0.44 * team.fta);

  return scoringUsage;
}

function playmakingUsage(player, team) {
  var playmakingUsage =
    (100 * (player.ast + player.tov)) / (team.ast + team.tov);

  return playmakingUsage;
}

function reboundingUsage(player, team) {
  var reboundingUsage =
    (100 * (player.orb + player.drb)) / (team.orb + team.drb);

  return reboundingUsage;
}

function usagePercentages(player, team) {
  // use these to predict increases to a players performance based on missing players in upcoming games

  var usagePercentages = {
    scoringUsage: scoringUsage(player, team),
    playmakingUsage: playmakingUsage(player, team),
    reboundingUsage: reboundingUsage(player, team),
  };

  return usagePercentages;
}

function lastNStatAverage(recentGames, type, n, stat) {
  var sum = 0;
  var lastNGames = recentGames;
  var num = n > lastNGames.length ? lastNGames.length : n;

  for (let i = 0; i < num; i++) {
    sum += lastNGames[i].stats[type][stat];
  }
  return sum / num;
}

function lastNAverages(recentGames, type, n) {
  var pos =
    type == "team" || type == "opponent"
      ? lastNStatAverage(recentGames, type, n, "pos")
      : null;
  var pace =
    type == "team" || type == "opponent"
      ? lastNStatAverage(recentGames, type, n, "pace")
      : null;

  var lastNAverages = {
    pts: lastNStatAverage(recentGames, type, n, "pts"),
    ast: lastNStatAverage(recentGames, type, n, "ast"),
    drb: lastNStatAverage(recentGames, type, n, "drb"),
    orb: lastNStatAverage(recentGames, type, n, "orb"),
    stl: lastNStatAverage(recentGames, type, n, "stl"),
    blk: lastNStatAverage(recentGames, type, n, "blk"),
    tov: lastNStatAverage(recentGames, type, n, "tov"),
    fgm: lastNStatAverage(recentGames, type, n, "fgm"),
    fga: lastNStatAverage(recentGames, type, n, "fga"),
    tpm: lastNStatAverage(recentGames, type, n, "tpm"),
    tpa: lastNStatAverage(recentGames, type, n, "tpa"),
    ftm: lastNStatAverage(recentGames, type, n, "ftm"),
    fta: lastNStatAverage(recentGames, type, n, "fta"),
    mp: lastNStatAverage(recentGames, type, n, "mp"),
    pf: lastNStatAverage(recentGames, type, n, "pf"),
    pos: pos,
    pace: pace,
  };

  return lastNAverages;
}

function lastNDifferential(recentGames, seasonAverages, n) {
  var lastNDifferential = {
    pts: lastNStatAverage(recentGames, "player", n, "pts") - seasonAverages.ppg,
    ast: lastNStatAverage(recentGames, "player", n, "ast") - seasonAverages.apg,
    drb:
      lastNStatAverage(recentGames, "player", n, "drb") -
      seasonAverages.drb / seasonAverages.gp,
    orb:
      lastNStatAverage(recentGames, "player", n, "orb") -
      seasonAverages.orb / seasonAverages.gp,
    stl: lastNStatAverage(recentGames, "player", n, "stl") - seasonAverages.spg,
    blk: lastNStatAverage(recentGames, "player", n, "blk") - seasonAverages.bpg,
    tov:
      lastNStatAverage(recentGames, "player", n, "tov") - seasonAverages.topg,
    fgm:
      lastNStatAverage(recentGames, "player", n, "fgm") -
      seasonAverages.fgm / seasonAverages.gp,
    fga:
      lastNStatAverage(recentGames, "player", n, "fga") -
      seasonAverages.fga / seasonAverages.gp,
    tpm:
      lastNStatAverage(recentGames, "player", n, "tpm") -
      seasonAverages.tpm / seasonAverages.gp,
    tpa:
      lastNStatAverage(recentGames, "player", n, "tpa") -
      seasonAverages.tpa / seasonAverages.gp,
    ftm:
      lastNStatAverage(recentGames, "player", n, "ftm") -
      seasonAverages.ftm / seasonAverages.gp,
    fta:
      lastNStatAverage(recentGames, "player", n, "fta") -
      seasonAverages.fta / seasonAverages.gp,
    mp: lastNStatAverage(recentGames, "player", n, "mp") - seasonAverages.mpg,
    pf:
      lastNStatAverage(recentGames, "player", n, "pf") -
      seasonAverages.pf / seasonAverages.gp,
    fp: lastNStatAverage(recentGames, "player", n, "fp") - seasonAverages.fppg,
  };
  return lastNDifferential;
}

function positions(players, hId) {
  var sortedPositions = {
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

  for (let i = 0; i < players.length; i++) {
    var minsPlayed = minutesPlayed(players[i].min);

    if (
      players[i].teamId == hId &&
      players[i].dnp == "" &&
      players[i].pos != ""
    ) {
      sortedPositions.hTeam[players[i].pos] = {
        playerId: players[i].personId,
        mins: minsPlayed,
        idx: i,
      };
    } else if (players[i].dnp == "" && players[i].pos != "") {
      sortedPositions.vTeam[players[i].pos] = {
        playerId: players[i].personId,
        mins: minsPlayed,
        idx: i,
      };
    }
  }

  return sortedPositions;
}

function matchupStats(opponents, matchup) {
  // only one matchup may need to figure out how to include others

  var stats = {};

  var individualMatchup = opponents.filter((player) => {
    return player.playerId === matchup.playerId;
  });

  stats = {
    pts: individualMatchup[0].pts,
    ast: individualMatchup[0].ast,
    drb: individualMatchup[0].drb,
    orb: individualMatchup[0].orb,
    stl: individualMatchup[0].stl,
    blk: individualMatchup[0].blk,
    tov: individualMatchup[0].tov,
    fgm: individualMatchup[0].fgm,
    fga: individualMatchup[0].fga,
    fgp: individualMatchup[0].fgm / individualMatchup[0].fga,
    tpm: individualMatchup[0].tpm,
    tpa: individualMatchup[0].tpa,
    tpp: individualMatchup[0].tpm / individualMatchup[0].tpa,
    ftm: individualMatchup[0].ftm,
    fta: individualMatchup[0].fta,
    ftp: individualMatchup[0].ftm / individualMatchup[0].fta,
    mp: individualMatchup[0].mp,
    pf: individualMatchup[0].pf,
    fp: individualMatchup[0].fp,
    atr: individualMatchup[0].ast / individualMatchup[0].tov,
  };

  return stats;
}

function statDeviation(recentGames, averages, maxGames, stat) {
  var stdDev = 0;
  var sumOfSquares = 0;
  var lastNGames = recentGames;
  var mean = averages[stat];
  var n = Math.min(maxGames, lastNGames.length);

  for (let i = 0; i < n; i++) {
    sumOfSquares += Math.pow(lastNGames[i].stats.player[stat] - mean, 2);
  }
  stdDev = Math.sqrt(sumOfSquares / n);

  return stdDev;
}

function playerDeviations(recentGames, averages, maxGames) {
  // should be per 48 min

  var deviation = {
    pts: statDeviation(recentGames, averages, maxGames, "pts"),
    ast: statDeviation(recentGames, averages, maxGames, "ast"),
    drb: statDeviation(recentGames, averages, maxGames, "drb"),
    orb: statDeviation(recentGames, averages, maxGames, "orb"),
    stl: statDeviation(recentGames, averages, maxGames, "stl"),
    blk: statDeviation(recentGames, averages, maxGames, "blk"),
    tov: statDeviation(recentGames, averages, maxGames, "tov"),
    fgm: statDeviation(recentGames, averages, maxGames, "fgm"),
    fga: statDeviation(recentGames, averages, maxGames, "fga"),
    tpm: statDeviation(recentGames, averages, maxGames, "tpm"),
    tpa: statDeviation(recentGames, averages, maxGames, "tpa"),
    ftm: statDeviation(recentGames, averages, maxGames, "ftm"),
    fta: statDeviation(recentGames, averages, maxGames, "fta"),
    mp: statDeviation(recentGames, averages, maxGames, "mp"),
    pf: statDeviation(recentGames, averages, maxGames, "pf"),
    fp: statDeviation(recentGames, averages, maxGames, "fp"),
  };

  return deviation;
}

function playerDifferentials(recentGames, seasonAverages) {
  var differential =
    seasonAverages === undefined
      ? undefined
      : {
          last3: calculations.lastNDifferential(recentGames, seasonAverages, 3),
          last5: calculations.lastNDifferential(recentGames, seasonAverages, 7),
          last9: calculations.lastNDifferential(recentGames, seasonAverages, 7),
          last13: calculations.lastNDifferential(
            recentGames,
            seasonAverages,
            10
          ),
          last20: calculations.lastNDifferential(
            recentGames,
            seasonAverages,
            20
          ),
        };

  return differential;
}

function playerAverages(recentGames, player, team, opponent) {
  var averages = {
    last3: {
      player: calculations.lastNAverages(recentGames, player, 3),
      team: calculations.lastNAverages(recentGames, team, 3),
      opponent: calculations.lastNAverages(recentGames, opponent, 3),
    },
    last5: {
      player: calculations.lastNAverages(recentGames, player, 5),
      team: calculations.lastNAverages(recentGames, team, 5),
      opponent: calculations.lastNAverages(recentGames, opponent, 5),
    },
    last9: {
      player: calculations.lastNAverages(recentGames, player, 9),
      team: calculations.lastNAverages(recentGames, team, 9),
      opponent: calculations.lastNAverages(recentGames, opponent, 9),
    },
    last13: {
      player: calculations.lastNAverages(recentGames, player, 13),
      team: calculations.lastNAverages(recentGames, team, 13),
      opponent: calculations.lastNAverages(recentGames, opponent, 13),
    },
    last20: {
      player: calculations.lastNAverages(recentGames, player, 20),
      team: calculations.lastNAverages(recentGames, team, 20),
      opponent: calculations.lastNAverages(recentGames, opponent, 20),
    },
  };

  return averages;
}

function playerAdvanced(averages) {
  var advanced = {
    last3: calculations.advancedPlayerStats(
      averages.last3.player,
      averages.last3.team,
      averages.last3.opponent
    ),
    last5: calculations.advancedPlayerStats(
      averages.last5.player,
      averages.last5.team,
      averages.last5.opponent
    ),
    last9: calculations.advancedPlayerStats(
      averages.last9.player,
      averages.last9.team,
      averages.last9.opponent
    ),
    last13: calculations.advancedPlayerStats(
      averages.last13.player,
      averages.last13.team,
      averages.last13.opponent
    ),
    last20: calculations.advancedPlayerStats(
      averages.last20.player,
      averages.last20.team,
      averages.last20.opponent
    ),
  };

  return advanced;
}

function newSeasonAverages(recentGames, seasonAverages) {
  var numNewGames = recentGames.length;
  var numExistingGames = seasonAverages.gp;
  var numOfGames = numNewGames + numExistingGames;

  var perGameStats = {
    pts: lastNStatAverage(recentGames, "player", numNewGames, "pts"),
    ast: lastNStatAverage(recentGames, "player", numNewGames, "ast"),
    orb: lastNStatAverage(recentGames, "player", numNewGames, "orb"),
    drb: lastNStatAverage(recentGames, "player", numNewGames, "drb"),
    stl: lastNStatAverage(recentGames, "player", numNewGames, "stl"),
    blk: lastNStatAverage(recentGames, "player", numNewGames, "blk"),
    tov: lastNStatAverage(recentGames, "player", numNewGames, "tov"),
    tpm: lastNStatAverage(recentGames, "player", numNewGames, "tpm"),
    tpa: lastNStatAverage(recentGames, "player", numNewGames, "tpa"),
    tpp: lastNStatAverage(recentGames, "player", numNewGames, "pts"),
    fgm: lastNStatAverage(recentGames, "player", numNewGames, "fgm"),
    fga: lastNStatAverage(recentGames, "player", numNewGames, "fga"),
    fgp: lastNStatAverage(recentGames, "player", numNewGames, "fpg"),
    ftm: lastNStatAverage(recentGames, "player", numNewGames, "ftm"),
    fta: lastNStatAverage(recentGames, "player", numNewGames, "fta"),
    ftp: lastNStatAverage(recentGames, "player", numNewGames, "ftp"),
    mp: lastNStatAverage(recentGames, "player", numNewGames, "mp"),
    pf: lastNStatAverage(recentGames, "player", numNewGames, "pf"),
    fp: lastNStatAverage(recentGames, "player", numNewGames, "fp"),
    atr: lastNStatAverage(recentGames, "player", numNewGames, "atr"),
  };

  var recentAverages = {
    perGame: perGameStats,
    perMin: {
      pts: perGameStats.pts / perGameStats.mp,
      ast: perGameStats.ast / perGameStats.mp,
      orb: perGameStats.orb / perGameStats.mp,
      drb: perGameStats.drb / perGameStats.mp,
      stl: perGameStats.stl / perGameStats.mp,
      blk: perGameStats.blk / perGameStats.mp,
      tov: perGameStats.tov / perGameStats.mp,
      tpm: perGameStats.tpm / perGameStats.mp,
      tpa: perGameStats.tpa / perGameStats.mp,
      tpp: perGameStats.tpp,
      fgm: perGameStats.fgm / perGameStats.mp,
      fga: perGameStats.fga / perGameStats.mp,
      fgp: perGameStats.fgp,
      ftm: perGameStats.ftm / perGameStats.mp,
      fta: perGameStats.fta / perGameStats.mp,
      ftp: perGameStats.ftp,
      pf: perGameStats.pf / perGameStats.mp,
      fp: perGameStats.fp / perGameStats.mp,
      atr: perGameStats.atr,
    },
    totals: {
      pts: perGameStats.pts * numNewGames,
      ast: perGameStats.ast * numNewGames,
      orb: perGameStats.orb * numNewGames,
      drb: perGameStats.drb * numNewGames,
      stl: perGameStats.stl * numNewGames,
      blk: perGameStats.blk * numNewGames,
      tov: perGameStats.tov * numNewGames,
      tpm: perGameStats.tpm * numNewGames,
      tpa: perGameStats.tpa * numNewGames,
      tpp: perGameStats.tpp,
      fgm: perGameStats.fgm * numNewGames,
      fga: perGameStats.fga * numNewGames,
      fgp: perGameStats.fgp,
      ftm: perGameStats.ftm * numNewGames,
      fta: perGameStats.fta * numNewGames,
      ftp: perGameStats.ftp,
      mp: perGameStats.mp * numNewGames,
      pf: perGameStats.pf * numNewGames,
      fp: perGameStats.fp * numNewGames,
      atr: perGameStats.atr,
    },
  };

  var newAverages = {
    perGame: {
      pts:
        seasonAverages.perGame.pts * (numExistingGames / numOfGames) +
        recentAverages.perGame.pts * (numNewGames / numOfGames),
      ast:
        seasonAverages.perGame.ast * (numExistingGames / numOfGames) +
        recentAverages.perGame.ast * (numNewGames / numOfGames),
      orb:
        seasonAverages.perGame.orb * (numExistingGames / numOfGames) +
        recentAverages.perGame.orb * (numNewGames / numOfGames),
      drb:
        seasonAverages.perGame.drb * (numExistingGames / numOfGames) +
        recentAverages.perGame.drb * (numNewGames / numOfGames),
      stl:
        seasonAverages.perGame.stl * (numExistingGames / numOfGames) +
        recentAverages.perGame.stl * (numNewGames / numOfGames),
      blk:
        seasonAverages.perGame.blk * (numExistingGames / numOfGames) +
        recentAverages.perGame.blk * (numNewGames / numOfGames),
      tov:
        seasonAverages.perGame.tov * (numExistingGames / numOfGames) +
        recentAverages.perGame.tov * (numNewGames / numOfGames),
      tpm:
        seasonAverages.perGame.tpm * (numExistingGames / numOfGames) +
        recentAverages.perGame.tpm * (numNewGames / numOfGames),
      tpa:
        seasonAverages.perGame.tpa * (numExistingGames / numOfGames) +
        recentAverages.perGame.tpa * (numNewGames / numOfGames),
      tpp:
        seasonAverages.perGame.tpp * (numExistingGames / numOfGames) +
        recentAverages.perGame.tpp * (numNewGames / numOfGames),
      fgm:
        seasonAverages.perGame.fgm * (numExistingGames / numOfGames) +
        recentAverages.perGame.fgm * (numNewGames / numOfGames),
      fga:
        seasonAverages.perGame.fga * (numExistingGames / numOfGames) +
        recentAverages.perGame.fga * (numNewGames / numOfGames),
      fgp:
        seasonAverages.perGame.fgp * (numExistingGames / numOfGames) +
        recentAverages.perGame.fgp * (numNewGames / numOfGames),
      ftm:
        seasonAverages.perGame.ftm * (numExistingGames / numOfGames) +
        recentAverages.perGame.ftm * (numNewGames / numOfGames),
      fta:
        seasonAverages.perGame.fta * (numExistingGames / numOfGames) +
        recentAverages.perGame.fta * (numNewGames / numOfGames),
      ftp:
        seasonAverages.perGame.ftp * (numExistingGames / numOfGames) +
        recentAverages.perGame.ftp * (numNewGames / numOfGames),
      mp:
        seasonAverages.perGame.mp * (numExistingGames / numOfGames) +
        recentAverages.perGame.mp * (numNewGames / numOfGames),
      pf:
        seasonAverages.perGame.pf * (numExistingGames / numOfGames) +
        recentAverages.perGame.pf * (numNewGames / numOfGames),
      fp:
        seasonAverages.perGame.fp * (numExistingGames / numOfGames) +
        recentAverages.perGame.fp * (numNewGames / numOfGames),
      atr:
        seasonAverages.perGame.atr * (numExistingGames / numOfGames) +
        recentAverages.perGame.atr * (numNewGames / numOfGames),
    },
    perMin: {
      pts:
        seasonAverages.perMin.pts * (numExistingGames / numOfGames) +
        recentAverages.perMin.pts * (numNewGames / numOfGames),
      ast:
        seasonAverages.perMin.ast * (numExistingGames / numOfGames) +
        recentAverages.perMin.ast * (numNewGames / numOfGames),
      orb:
        seasonAverages.perMin.orb * (numExistingGames / numOfGames) +
        recentAverages.perMin.orb * (numNewGames / numOfGames),
      drb:
        seasonAverages.perMin.drb * (numExistingGames / numOfGames) +
        recentAverages.perMin.drb * (numNewGames / numOfGames),
      stl:
        seasonAverages.perMin.stl * (numExistingGames / numOfGames) +
        recentAverages.perMin.stl * (numNewGames / numOfGames),
      blk:
        seasonAverages.perMin.blk * (numExistingGames / numOfGames) +
        recentAverages.perMin.blk * (numNewGames / numOfGames),
      tov:
        seasonAverages.perMin.tov * (numExistingGames / numOfGames) +
        recentAverages.perMin.tov * (numNewGames / numOfGames),
      tpm:
        seasonAverages.perMin.tpm * (numExistingGames / numOfGames) +
        recentAverages.perMin.tpm * (numNewGames / numOfGames),
      tpa:
        seasonAverages.perMin.tpa * (numExistingGames / numOfGames) +
        recentAverages.perMin.tpa * (numNewGames / numOfGames),
      tpp:
        seasonAverages.perMin.tpp * (numExistingGames / numOfGames) +
        recentAverages.perMin.tpp * (numNewGames / numOfGames),
      fgm:
        seasonAverages.perMin.fgm * (numExistingGames / numOfGames) +
        recentAverages.perMin.fgm * (numNewGames / numOfGames),
      fga:
        seasonAverages.perMin.fga * (numExistingGames / numOfGames) +
        recentAverages.perMin.fga * (numNewGames / numOfGames),
      fgp:
        seasonAverages.perMin.fgp * (numExistingGames / numOfGames) +
        recentAverages.perMin.fgp * (numNewGames / numOfGames),
      ftm:
        seasonAverages.perMin.ftm * (numExistingGames / numOfGames) +
        recentAverages.perMin.ftm * (numNewGames / numOfGames),
      fta:
        seasonAverages.perMin.fta * (numExistingGames / numOfGames) +
        recentAverages.perMin.fta * (numNewGames / numOfGames),
      ftp:
        seasonAverages.perMin.ftp * (numExistingGames / numOfGames) +
        recentAverages.perMin.ftp * (numNewGames / numOfGames),
      pf:
        seasonAverages.perMin.pf * (numExistingGames / numOfGames) +
        recentAverages.perMin.pf * (numNewGames / numOfGames),
      fp:
        seasonAverages.perMin.fp * (numExistingGames / numOfGames) +
        recentAverages.perMin.fp * (numNewGames / numOfGames),
      atr:
        seasonAverages.perMin.atr * (numExistingGames / numOfGames) +
        recentAverages.perMin.atr * (numNewGames / numOfGames),
    },
    totals: {
      pts: seasonAverages.totals.pts + recentAverages.totals.pts,
      ast: seasonAverages.totals.ast + recentAverages.totals.ast,
      orb: seasonAverages.totals.orb + recentAverages.totals.orb,
      drb: seasonAverages.totals.drb + recentAverages.totals.drb,
      stl: seasonAverages.totals.stl + recentAverages.totals.stl,
      blk: seasonAverages.totals.blk + recentAverages.totals.blk,
      tov: seasonAverages.totals.tov + recentAverages.totals.tov,
      tpm: seasonAverages.totals.tpm + recentAverages.totals.tpm,
      tpa: seasonAverages.totals.tpa + recentAverages.totals.tpa,
      tpp:
        seasonAverages.totals.tpp * (numExistingGames / numOfGames) +
        recentAverages.totals.tpp * (numNewGames / numOfGames),
      fgm: seasonAverages.totals.fgm + recentAverages.totals.fgm,
      fga: seasonAverages.totals.fga + recentAverages.totals.fga,
      fgp:
        seasonAverages.totals.fgp * (numExistingGames / numOfGames) +
        recentAverages.totals.fgp * (numNewGames / numOfGames),
      ftm: seasonAverages.totals.ftm + recentAverages.totals.ftm,
      fta: seasonAverages.totals.fta + recentAverages.totals.fta,
      ftp:
        seasonAverages.totals.ftp * (numExistingGames / numOfGames) +
        recentAverages.totals.ftp * (numNewGames / numOfGames),
      mp: seasonAverages.totals.mp + recentAverages.totals.mp,
      pf: seasonAverages.totals.pf + recentAverages.totals.pf,
      fp: seasonAverages.totals.fp + recentAverages.totals.fp,
      atr:
        seasonAverages.totals.atr * (numExistingGames / numOfGames) +
        recentAverages.totals.atr * (numNewGames / numOfGames),
    },
  };

  return newAverages;
}

function statAverage(playerStats, stat) {}

function leagueAverages(playerStats) {
  //add advanced stats to seasonal stats.  Calculate when adding and updating seasonal stats
  //add relevant stats to seasonal stats to make calculations easier

  var leagueAverages = {
    pts: statAverage(recentGames, type, n, "ppg"),
    ast: statAverage(recentGames, type, n, "apg"),
    drb: statAverage(recentGames, type, n, "drpg"),
    orb: statAverage(recentGames, type, n, "orpg"),
    stl: statAverage(recentGames, type, n, "bpg"),
    blk: statAverage(recentGames, type, n, ""),
    tov: statAverage(recentGames, type, n, "tov"),
    fgm: statAverage(recentGames, type, n, "fgm"),
    fga: statAverage(recentGames, type, n, "fga"),
    tpm: statAverage(recentGames, type, n, "tpm"),
    tpa: statAverage(recentGames, type, n, "tpa"),
    ftm: statAverage(recentGames, type, n, "ftm"),
    fta: statAverage(recentGames, type, n, "fta"),
    mp: statAverage(recentGames, type, n, "mpg"),
    pf: statAverage(recentGames, type, n, "pf"),
    fp: statAverage(recentGames, type, n, "pf"),
  };
}

function teamAverages(games) {
  var numOfGames;

  var totals = {
    pts: 0,
    ast: 0,
    orb: 0,
    drb: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    tpm: 0,
    tpa: 0,
    fgm: 0,
    fga: 0,
    ftm: 0,
    fta: 0,
    mp: 0,
    pf: 0,
    fp: 0,
  };

  for (let i = 0; i < games.length; i++) {
    numOfGames = i;
    totals = {
      pts: games[i].pts + totals.pts,
      ast: games[i].ast + totals.ast,
      orb: games[i].orb + totals.orb,
      drb: games[i].drb + totals.drb,
      stl: games[i].stl + totals.stl,
      blk: games[i].blk + totals.blk,
      tov: games[i].tov + totals.tov,
      tpm: games[i].tpm + totals.tpm,
      tpa: games[i].tpa + totals.tpa,
      fgm: games[i].fgm + totals.fgm,
      fga: games[i].fga + totals.fga,
      ftm: games[i].ftm + totals.ftm,
      fta: games[i].fta + totals.fta,
      mp: games[i].mp + totals.mp,
      pf: games[i].pf + totals.pf,
      fp: games[i].fp + totals.fp,
    };
  }
  var averages = {
    pts: totals.pts / numOfGames,
    ast: totals.ast / numOfGames,
    orb: totals.orb / numOfGames,
    drb: totals.drb / numOfGames,
    stl: totals.stl / numOfGames,
    blk: totals.blk / numOfGames,
    tov: totals.tov / numOfGames,
    tpm: totals.tpm / numOfGames,
    tpa: totals.tpa / numOfGames,
    fgm: totals.fgm / numOfGames,
    fga: totals.fga / numOfGames,
    ftm: totals.ftm / numOfGames,
    fta: totals.fta / numOfGames,
    mp: totals.mp / numOfGames,
    pf: totals.pf / numOfGames,
    fp: totals.fp / numOfGames,
  };

  return averages;
}

module.exports.advancedPlayerStats = advancedPlayerStats;
module.exports.minutesPlayed = minutesPlayed;
module.exports.leagueConstants = leagueConstants;
module.exports.numOfTeamPos = numOfTeamPos;
module.exports.teamPace = teamPace;
module.exports.lastNDifferential = lastNDifferential;
module.exports.playerFantasyPoints = playerFantasyPoints;
module.exports.positions = positions;
module.exports.matchupStats = matchupStats;
module.exports.lastNAverages = lastNAverages;
module.exports.playerDeviations = playerDeviations;
module.exports.playerDifferentials = playerDifferentials;
module.exports.playerAverages = playerAverages;
module.exports.playerAdvanced = playerAdvanced;
module.exports.newSeasonAverages = newSeasonAverages;
module.exports.playerUsage = playerUsage;
module.exports.teamAverages = teamAverages;
module.exports.usagePercentages = usagePercentages;
