function rootEndpoint() {
  return "https://data.nba.net/10s/prod/v1/today.json";
}

function scheduleEndpoint(seasonYear) {
  return "http://data.nba.net/10s/prod/v1/" + seasonYear + "/schedule.json";
}

function gameEndpoint(gameDate, gameId) {
  return (
    "https://data.nba.net/prod/v1/" + gameDate + "/" + gameId + "_boxscore.json"
  );
}

function playerProfileEndpoint(seasonYear, playerId) {
  return (
    "https://data.nba.net/10s/prod/v1/" +
    seasonYear +
    "/players/" +
    playerId +
    "_profile.json"
  );
}

function playersEndpoint(seasonYear) {
  return "https://data.nba.net/10s/prod/v1/" + seasonYear + "/players.json";
}

function teamsEndpoint(seasonYear) {
  return "http://data.nba.net/10s/prod/v1/" + seasonYear + "/teams.json";
}

function rosterEndpoint(seasonYear, teamUrlName) {
  return (
    "http://data.nba.net/10s/prod/v1/" +
    seasonYear +
    "/teams/" +
    teamUrlName +
    "/roster.json"
  );
}

export {
  rootEndpoint,
  scheduleEndpoint,
  gameEndpoint,
  playerProfileEndpoint,
  playersEndpoint,
  teamsEndpoint,
  rosterEndpoint,
};
