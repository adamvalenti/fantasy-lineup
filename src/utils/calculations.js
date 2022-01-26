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
    fp: playerFantasyPoints(
      player.pts,
      player.ast,
      player.orb + player.drb,
      player.stl,
      player.blk,
      player.tov
    ),
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

  return fantasyPoints;
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
      pts: 10,
      stl: 2,
      blk: 3,
      drb: 4,
      mp: 20,
      pf: 4,
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
  console.log(playerDefRtg(player.stats, team.stats, opponent.stats));
}

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
    pos:
      type == "team" || type == "opponent"
        ? lastNStatAverage(recentGames, type, n, "pos")
        : null,
    pace:
      type == "team" || type == "opponent"
        ? lastNStatAverage(recentGames, type, n, "pace")
        : null,
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
    tpm: individualMatchup[0].tpm,
    tpa: individualMatchup[0].tpa,
    ftm: individualMatchup[0].ftm,
    fta: individualMatchup[0].fta,
    mp: individualMatchup[0].mp,
    pf: individualMatchup[0].pf,
    fp: individualMatchup[0].fp,
  };

  return stats;
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
