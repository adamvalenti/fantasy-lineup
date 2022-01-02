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
  team.pos = numOfTeamPos(team, opponent);

  var advancedStats = {
    ortg: playerOffRtg(player, team, opponent),
    drtg: playerDefRtg(player, team, opponent),
  };

  return advancedStats;
}

function teamPos(team, opponent) {
  return (
    team.fga +
    0.4 * team.fta -
    1.07 * (team.orb / (team.orb + opponent.orb)) * (team.fga - team.fgm) +
    team.tov
  );
}

function numOfTeamPos(team, opponent) {
  return Math.round(0.5 * (teamPos(team, opponent) + teamPos(opponent, team)));
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

module.exports.advancedPlayerStats = advancedPlayerStats;
module.exports.minutesPlayed = minutesPlayed;
