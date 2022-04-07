import { positions } from "./constants.js";

import { playerProfileEndpoint } from "./apiEndpoints.js";

import { getSeasonalStats } from "./apiRequests.js";

async function calcMissingRoster(games, roster, seasonYear) {
  var missingPlayers = [];
  var gamesRoster = {};
  var gamesRosterIds = [];

  for (let i = 0; i < games.length; i++) {
    for (let j = 0; j < games[i].team.activePlayers.length; j++) {
      gamesRoster[games[i].team.activePlayers[j].playerId] =
        games[i].team.activePlayers[j].playerId;
    }
  }

  gamesRosterIds = Object.keys(gamesRoster);

  missingPlayers = await Promise.all(
    gamesRosterIds
      .filter((playerId) => {
        for (let i = 0; i < roster.length; i++) {
          if (roster[i].playerId === playerId) {
            return false;
          }
        }
        return true;
      })
      .map(async function (playerId) {
        var seasonalStats = await getSeasonalStats(
          playerProfileEndpoint(seasonYear, playerId)
        );

        return {
          playerId: playerId,
          isActive: false,
          pos: "",
          name: "",
          seasonalStats: seasonalStats,
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
      })
  );

  return missingPlayers;
}

function calcAdvancedPlayerStats(player, team, opponent) {
  var advancedStats = {
    ortg: calcPlayerOffRtg(player, team, opponent),
    drtg: calcPlayerDefRtg(player, team, opponent),
    // per: calcPlayerEffRtg(player, team, league),
    usg: calcPlayerUsage(player, team),
  };

  return advancedStats;
}

function calcTeamPos(team, opponent) {
  return (
    team.fga +
    0.4 * team.fta -
    1.07 * (team.orb / (team.orb + opponent.drb)) * (team.fga - team.fgm) +
    team.tov
  );
}

function calcNumOfTeamPos(team, opponent) {
  return Math.round(
    0.5 * (calcTeamPos(team, opponent) + calcTeamPos(opponent, team))
  );
}

function calcTeamPace(team, opponent) {
  var pace = 48 * ((team.pos + opponent.pos) / (2 * (team.mp / 5)));

  return pace;
}

function calcPlayerFantasyPoints(pts, ast, reb, stl, blk, tov) {
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

function calcPlayerOffRtg(player, team, opponent) {
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

function calcPlayerDefRtg(player, team, opponent) {
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

function calcLeagueConstants() {
  // var league = {
  //   factor:
  //     2 / 3 - (0.5 * (leagueStats.ast / leagueStats.fgm)) / (2 * (leagueStats.fgm / leagueStats.ftm));
  //   vop:
  //     leagueStats.pts / (leagueStats.fga - leagueStats.orb + leagueStats.tov + 0.44 * leagueStats.fta);
  //   drbp: leagueStats.drb / (leagueStats.drb + leagueStats.orb);
  // }

  // stats from basketball reference, 2020-2021 stats used. https://www.basketball-reference.com/leagues/NBA_stats_per_game.html

  // would be cool if leauge averages were projected for next season to help predict player improvement

  var leagueStats = {
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

function calcPlayerEffRtg(player, team, league) {
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

function calcPlayerUsage(player, team) {
  var usage =
    (100 * ((player.fga + 0.44 * player.fta + player.tov) * (team.mp / 5))) /
    (player.mp * (team.fga + 0.44 * team.fta + team.tov));

  return usage;
}

function calcScoringUsage(player, team) {
  var scoringUsage =
    (100 * (player.fga + 0.44 * player.fta)) / (team.fga + 0.44 * team.fta);

  return scoringUsage;
}

function calcPlaymakingUsage(player, team) {
  var playmakingUsage =
    (100 * (player.ast + player.tov)) / (team.ast + team.tov);

  return playmakingUsage;
}

function calcReboundingUsage(player, team) {
  var reboundingUsage =
    (100 * (player.orb + player.drb)) / (team.orb + team.drb);

  return reboundingUsage;
}

function calcUsagePercentages(
  player,
  team,
  playerGamesPlayed,
  teamGamesPlayed
) {
  // use these to predict increases to a players performance based on missing players in upcoming games

  var usagePercentages = {
    scoringUsage:
      (calcScoringUsage(player, team) * playerGamesPlayed) / teamGamesPlayed,
    playmakingUsage:
      (calcPlaymakingUsage(player, team) * playerGamesPlayed) / teamGamesPlayed,
    reboundingUsage:
      (calcReboundingUsage(player, team) * playerGamesPlayed) / teamGamesPlayed,
  };

  return usagePercentages;
}

function calcLastNStatAverage(recentGames, type, n, stat) {
  var sum = 0;
  var lastNGames = recentGames;
  var num = n > lastNGames.length ? lastNGames.length : n;

  for (let i = 0; i < num; i++) {
    sum += lastNGames[i].stats[type][stat];
  }
  return sum / num;
}

function calcLastNAverages(recentGames, type, n) {
  var pos =
    type === "team" || type === "opponent"
      ? calcLastNStatAverage(recentGames, type, n, "pos")
      : null;
  var pace =
    type === "team" || type === "opponent"
      ? calcLastNStatAverage(recentGames, type, n, "pace")
      : null;

  var lastNAverages = {
    pts: calcLastNStatAverage(recentGames, type, n, "pts"),
    ast: calcLastNStatAverage(recentGames, type, n, "ast"),
    drb: calcLastNStatAverage(recentGames, type, n, "drb"),
    orb: calcLastNStatAverage(recentGames, type, n, "orb"),
    stl: calcLastNStatAverage(recentGames, type, n, "stl"),
    blk: calcLastNStatAverage(recentGames, type, n, "blk"),
    tov: calcLastNStatAverage(recentGames, type, n, "tov"),
    fgm: calcLastNStatAverage(recentGames, type, n, "fgm"),
    fga: calcLastNStatAverage(recentGames, type, n, "fga"),
    tpm: calcLastNStatAverage(recentGames, type, n, "tpm"),
    tpa: calcLastNStatAverage(recentGames, type, n, "tpa"),
    ftm: calcLastNStatAverage(recentGames, type, n, "ftm"),
    fta: calcLastNStatAverage(recentGames, type, n, "fta"),
    mp: calcLastNStatAverage(recentGames, type, n, "mp"),
    pf: calcLastNStatAverage(recentGames, type, n, "pf"),
    pos: pos,
    pace: pace,
  };

  return lastNAverages;
}

function calcLastNDifferential(recentGames, seasonAverages, n) {
  var lastNDifferential = {
    pts:
      calcLastNStatAverage(recentGames, "player", n, "pts") -
      seasonAverages.ppg,
    ast:
      calcLastNStatAverage(recentGames, "player", n, "ast") -
      seasonAverages.apg,
    drb:
      calcLastNStatAverage(recentGames, "player", n, "drb") -
      seasonAverages.drb / seasonAverages.gp,
    orb:
      calcLastNStatAverage(recentGames, "player", n, "orb") -
      seasonAverages.orb / seasonAverages.gp,
    stl:
      calcLastNStatAverage(recentGames, "player", n, "stl") -
      seasonAverages.spg,
    blk:
      calcLastNStatAverage(recentGames, "player", n, "blk") -
      seasonAverages.bpg,
    tov:
      calcLastNStatAverage(recentGames, "player", n, "tov") -
      seasonAverages.topg,
    fgm:
      calcLastNStatAverage(recentGames, "player", n, "fgm") -
      seasonAverages.fgm / seasonAverages.gp,
    fga:
      calcLastNStatAverage(recentGames, "player", n, "fga") -
      seasonAverages.fga / seasonAverages.gp,
    tpm:
      calcLastNStatAverage(recentGames, "player", n, "tpm") -
      seasonAverages.tpm / seasonAverages.gp,
    tpa:
      calcLastNStatAverage(recentGames, "player", n, "tpa") -
      seasonAverages.tpa / seasonAverages.gp,
    ftm:
      calcLastNStatAverage(recentGames, "player", n, "ftm") -
      seasonAverages.ftm / seasonAverages.gp,
    fta:
      calcLastNStatAverage(recentGames, "player", n, "fta") -
      seasonAverages.fta / seasonAverages.gp,
    mp:
      calcLastNStatAverage(recentGames, "player", n, "mp") - seasonAverages.mpg,
    pf:
      calcLastNStatAverage(recentGames, "player", n, "pf") -
      seasonAverages.pf / seasonAverages.gp,
    fp:
      calcLastNStatAverage(recentGames, "player", n, "fp") -
      seasonAverages.fppg,
  };
  return lastNDifferential;
}

function calcStatDeviation(recentGames, averages, maxGames, stat) {
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

function calcPlayerDeviations(recentGames, averages, maxGames) {
  // should be per 48 min

  var deviation = {
    pts: calcStatDeviation(recentGames, averages, maxGames, "pts"),
    ast: calcStatDeviation(recentGames, averages, maxGames, "ast"),
    drb: calcStatDeviation(recentGames, averages, maxGames, "drb"),
    orb: calcStatDeviation(recentGames, averages, maxGames, "orb"),
    stl: calcStatDeviation(recentGames, averages, maxGames, "stl"),
    blk: calcStatDeviation(recentGames, averages, maxGames, "blk"),
    tov: calcStatDeviation(recentGames, averages, maxGames, "tov"),
    fgm: calcStatDeviation(recentGames, averages, maxGames, "fgm"),
    fga: calcStatDeviation(recentGames, averages, maxGames, "fga"),
    tpm: calcStatDeviation(recentGames, averages, maxGames, "tpm"),
    tpa: calcStatDeviation(recentGames, averages, maxGames, "tpa"),
    ftm: calcStatDeviation(recentGames, averages, maxGames, "ftm"),
    fta: calcStatDeviation(recentGames, averages, maxGames, "fta"),
    mp: calcStatDeviation(recentGames, averages, maxGames, "mp"),
    pf: calcStatDeviation(recentGames, averages, maxGames, "pf"),
    fp: calcStatDeviation(recentGames, averages, maxGames, "fp"),
  };

  return deviation;
}

function calcPlayerDifferentials(recentGames, seasonAverages) {
  var differential =
    seasonAverages === undefined
      ? undefined
      : {
          last3: calcLastNDifferential(recentGames, seasonAverages, 3),
          last5: calcLastNDifferential(recentGames, seasonAverages, 7),
          last9: calcLastNDifferential(recentGames, seasonAverages, 7),
          last13: calcLastNDifferential(recentGames, seasonAverages, 10),
          last20: calcLastNDifferential(recentGames, seasonAverages, 20),
        };

  return differential;
}

function calcPlayerAverages(recentGames, player, team, opponent) {
  var averages = {
    last3: {
      player: calcLastNAverages(recentGames, player, 3),
      team: calcLastNAverages(recentGames, team, 3),
      opponent: calcLastNAverages(recentGames, opponent, 3),
    },
    last5: {
      player: calcLastNAverages(recentGames, player, 5),
      team: calcLastNAverages(recentGames, team, 5),
      opponent: calcLastNAverages(recentGames, opponent, 5),
    },
    last9: {
      player: calcLastNAverages(recentGames, player, 9),
      team: calcLastNAverages(recentGames, team, 9),
      opponent: calcLastNAverages(recentGames, opponent, 9),
    },
    last13: {
      player: calcLastNAverages(recentGames, player, 13),
      team: calcLastNAverages(recentGames, team, 13),
      opponent: calcLastNAverages(recentGames, opponent, 13),
    },
    last20: {
      player: calcLastNAverages(recentGames, player, 20),
      team: calcLastNAverages(recentGames, team, 20),
      opponent: calcLastNAverages(recentGames, opponent, 20),
    },
  };

  return averages;
}

function calcPlayerAdvanced(averages) {
  var advanced = {
    last3: calcAdvancedPlayerStats(
      averages.last3.player,
      averages.last3.team,
      averages.last3.opponent
    ),
    last5: calcAdvancedPlayerStats(
      averages.last5.player,
      averages.last5.team,
      averages.last5.opponent
    ),
    last9: calcAdvancedPlayerStats(
      averages.last9.player,
      averages.last9.team,
      averages.last9.opponent
    ),
    last13: calcAdvancedPlayerStats(
      averages.last13.player,
      averages.last13.team,
      averages.last13.opponent
    ),
    last20: calcAdvancedPlayerStats(
      averages.last20.player,
      averages.last20.team,
      averages.last20.opponent
    ),
  };

  return advanced;
}

function calcNewSeasonAverages(recentGames, seasonAverages) {
  var numNewGames = recentGames.length;
  var numExistingGames = seasonAverages.gp;
  var numOfGames = numNewGames + numExistingGames;

  var perGameStats = {
    pts: calcLastNStatAverage(recentGames, "player", numNewGames, "pts"),
    ast: calcLastNStatAverage(recentGames, "player", numNewGames, "ast"),
    orb: calcLastNStatAverage(recentGames, "player", numNewGames, "orb"),
    drb: calcLastNStatAverage(recentGames, "player", numNewGames, "drb"),
    stl: calcLastNStatAverage(recentGames, "player", numNewGames, "stl"),
    blk: calcLastNStatAverage(recentGames, "player", numNewGames, "blk"),
    tov: calcLastNStatAverage(recentGames, "player", numNewGames, "tov"),
    tpm: calcLastNStatAverage(recentGames, "player", numNewGames, "tpm"),
    tpa: calcLastNStatAverage(recentGames, "player", numNewGames, "tpa"),
    tpp: calcLastNStatAverage(recentGames, "player", numNewGames, "pts"),
    fgm: calcLastNStatAverage(recentGames, "player", numNewGames, "fgm"),
    fga: calcLastNStatAverage(recentGames, "player", numNewGames, "fga"),
    fgp: calcLastNStatAverage(recentGames, "player", numNewGames, "fpg"),
    ftm: calcLastNStatAverage(recentGames, "player", numNewGames, "ftm"),
    fta: calcLastNStatAverage(recentGames, "player", numNewGames, "fta"),
    ftp: calcLastNStatAverage(recentGames, "player", numNewGames, "ftp"),
    mp: calcLastNStatAverage(recentGames, "player", numNewGames, "mp"),
    pf: calcLastNStatAverage(recentGames, "player", numNewGames, "pf"),
    fp: calcLastNStatAverage(recentGames, "player", numNewGames, "fp"),
    atr: calcLastNStatAverage(recentGames, "player", numNewGames, "atr"),
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

function calcStatAverage(playerStats, stat) {}

function calcLeagueAverages(playerStats) {
  //add advanced stats to seasonal stats.  Calculate when adding and updating seasonal stats
  //add relevant stats to seasonal stats to make calculations easier
  // var leagueAverages = {
  //   pts: statAverage(recentGames, type, n, "ppg"),
  //   ast: statAverage(recentGames, type, n, "apg"),
  //   drb: statAverage(recentGames, type, n, "drpg"),
  //   orb: statAverage(recentGames, type, n, "orpg"),
  //   stl: statAverage(recentGames, type, n, "bpg"),
  //   blk: statAverage(recentGames, type, n, ""),
  //   tov: statAverage(recentGames, type, n, "tov"),
  //   fgm: statAverage(recentGames, type, n, "fgm"),
  //   fga: statAverage(recentGames, type, n, "fga"),
  //   tpm: statAverage(recentGames, type, n, "tpm"),
  //   tpa: statAverage(recentGames, type, n, "tpa"),
  //   ftm: statAverage(recentGames, type, n, "ftm"),
  //   fta: statAverage(recentGames, type, n, "fta"),
  //   mp: statAverage(recentGames, type, n, "mpg"),
  //   pf: statAverage(recentGames, type, n, "pf"),
  //   fp: statAverage(recentGames, type, n, "pf"),
  // };
}

function calcNewAverages(games) {
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
    tf: 0,
    pos: 0,
    pace: 0,
  };
  var averages = {};

  for (let i = 0; i < games.length; i++) {
    for (var stat in games[i]) {
      totals[stat] += games[i][stat];
    }
  }

  for (var stat in totals) {
    averages[stat] = totals[stat] / games.length;
  }

  return averages;
}

function calcCurrAverages(
  oldAverages,
  newAverages,
  oldGamesPlayed,
  newGamesPlayed,
  currGamesPlayed
) {
  var currAverages = {};
  for (var stat in oldAverages) {
    currAverages[stat] =
      (oldAverages[stat] * oldGamesPlayed +
        newAverages[stat] * newGamesPlayed) /
      currGamesPlayed;
  }

  return currAverages;
}

function calcUsageRankings(rankings, prop) {
  var sum = 0;
  for (let j = 0; j < rankings.length; j++) {
    sum += rankings[j][prop];
  }

  for (let i = 0; i < rankings.length; i++) {
    rankings[i][prop] *= 100 / sum;
  }

  rankings.sort((a, b) => {
    return a[prop] < b[prop] ? 1 : a[prop] > b[prop] ? -1 : 0;
  });

  return rankings;
}

function calcEstimatedMatchupStats(opponents, playerPos) {
  const matchupType = {
    PRIMARY: 9,
    SECONDARY: 3,
    TERTIARY: 1,
    ANTI: 0,
  };

  const matchupWeights = {
    G: {
      G: matchupType.PRIMARY,
      GF: matchupType.SECONDARY,
      FG: matchupType.TERTIARY,
      F: matchupType.ANTI,
      FC: matchupType.ANTI,
      CF: matchupType.ANTI,
      C: matchupType.ANTI,
    },
    GF: {
      G: matchupType.SECONDARY,
      GF: matchupType.PRIMARY,
      FG: matchupType.SECONDARY,
      F: matchupType.TERTIARY,
      FC: matchupType.ANTI,
      CF: matchupType.ANTI,
      C: matchupType.ANTI,
    },
    FG: {
      G: matchupType.TERTIARY,
      GF: matchupType.SECONDARY,
      FG: matchupType.PRIMARY,
      F: matchupType.SECONDARY,
      FC: matchupType.TERTIARY,
      CF: matchupType.ANTI,
      C: matchupType.ANTI,
    },
    F: {
      G: matchupType.ANTI,
      GF: matchupType.TERTIARY,
      FG: matchupType.SECONDARY,
      F: matchupType.PRIMARY,
      FC: matchupType.SECONDARY,
      CF: matchupType.TERTIARY,
      C: matchupType.ANTI,
    },
    FC: {
      G: matchupType.ANTI,
      GF: matchupType.ANTI,
      FG: matchupType.TERTIARY,
      F: matchupType.SECONDARY,
      FC: matchupType.PRIMARY,
      CF: matchupType.SECONDARY,
      C: matchupType.TERTIARY,
    },
    CF: {
      G: matchupType.ANTI,
      GF: matchupType.ANTI,
      FG: matchupType.ANTI,
      F: matchupType.TERTIARY,
      FC: matchupType.SECONDARY,
      CF: matchupType.PRIMARY,
      C: matchupType.SECONDARY,
    },
    C: {
      G: matchupType.ANTI,
      GF: matchupType.ANTI,
      FG: matchupType.ANTI,
      F: matchupType.ANTI,
      FC: matchupType.TERTIARY,
      CF: matchupType.SECONDARY,
      C: matchupType.PRIMARY,
    },
  };

  if (playerPos === "") {
    return {};
  }

  var matchupStats = {
    pts: 0,
    ast: 0,
    drb: 0,
    orb: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    mp: 0,
    pf: 0,
    fp: 0,
  };

  var opponentPositions = {
    G: opponents.filter((opponent) => {
      return opponent.pos === positions.GUARD;
    }).length,
    GF: opponents.filter((opponent) => {
      return opponent.pos === positions.GUARDFORWARD;
    }).length,
    FG: opponents.filter((opponent) => {
      return opponent.pos === positions.FORWARDGUARD;
    }).length,
    F: opponents.filter((opponent) => {
      return opponent.pos === positions.FORWARD;
    }).length,
    FC: opponents.filter((opponent) => {
      return opponent.pos === positions.FORWARDCENTER;
    }).length,
    CF: opponents.filter((opponent) => {
      return opponent.pos === positions.CENTERFORWARD;
    }).length,
    C: opponents.filter((opponent) => {
      return opponent.pos === positions.CENTER;
    }).length,
  };

  var sumProduct = 0;

  for (let position in matchupWeights[playerPos]) {
    sumProduct +=
      matchupWeights[playerPos][position] * opponentPositions[position];
  }

  var factor = 1 / sumProduct;

  for (let i = 0; i < opponents.length; i++) {
    if (opponents[i].pos !== "" && opponents[i].stats.mp > 0) {
      for (let stat in matchupStats) {
        matchupStats[stat] +=
          opponents[i].stats[stat] *
          factor *
          matchupWeights[playerPos][opponents[i].pos];
      }
    }
  }
  return matchupStats;
}

function calcMinutesPlayed(minsPlayed) {
  if (minsPlayed === "") {
    minsPlayed = 0;
  } else {
    var mins = parseInt(minsPlayed.split(":")[0]);
    var secs = parseInt(minsPlayed.split(":")[1]);
    minsPlayed = secs >= 30 ? mins + 1 : mins;
  }
  return minsPlayed;
}

export {
  calcMinutesPlayed,
  calcAdvancedPlayerStats,
  calcLeagueConstants,
  calcNumOfTeamPos,
  calcTeamPace,
  calcLastNDifferential,
  calcPlayerFantasyPoints,
  calcLastNAverages,
  calcPlayerDeviations,
  calcPlayerDifferentials,
  calcPlayerAverages,
  calcPlayerAdvanced,
  calcNewSeasonAverages,
  calcPlayerUsage,
  calcNewAverages,
  calcCurrAverages,
  calcUsagePercentages,
  calcUsageRankings,
  calcMissingRoster,
  calcEstimatedMatchupStats,
};
