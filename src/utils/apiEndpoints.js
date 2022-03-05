function root() {
  return "https://data.nba.net/10s/prod/v1/today.json";
}

function schedule(seasonYear) {
  return "http://data.nba.net/10s/prod/v1/" + seasonYear + "/schedule.json";
}

function game(gameDate, gameId) {
  return (
    "https://data.nba.net/prod/v1/" + gameDate + "/" + gameId + "_boxscore.json"
  );
}

function playerProfile(seasonYear, playerId) {
  return (
    "https://data.nba.net/10s/prod/v1/" +
    seasonYear +
    "/players/" +
    playerId +
    "_profile.json"
  );
}

function players(seasonYear) {
  return "https://data.nba.net/10s/prod/v1/" + seasonYear + "/players.json";
}

function teams(seasonYear) {
  return "http://data.nba.net/10s/prod/v2/" + seasonYear + "/teams.json";
}

function roster(seasonYear, teamUrlName) {
  return (
    "http://data.nba.net/10s/prod/v1/" +
    seasonYear +
    "/teams/" +
    teamUrlName +
    "/roster.json"
  );
}

module.exports.root = root;
module.exports.schedule = schedule;
module.exports.game = game;
module.exports.playerProfile = playerProfile;
module.exports.players = players;
module.exports.teams = teams;
module.exports.roster = roster;
