function getScheduleUrl(seasonYear) {
  return "http://data.nba.net/10s/prod/v1/" + seasonYear + "/schedule.json";
}

function getGameUrl(gameDate, gameId) {
  return (
    "https://data.nba.net/prod/v1/" + gameDate + "/" + gameId + "_boxscore.json"
  );
}

function getPlayerStatsUrl(seasonYear, playerId) {
  return (
    "https://data.nba.net/10s/prod/v1/" +
    seasonYear +
    "/players/" +
    playerId +
    "_profile.json"
  );
}

function getPlayersUrl(seasonYear) {
  return "https://data.nba.net/10s/prod/v1/" + seasonYear + "/players.json";
}

function getTeamsUrl(seasonYear) {
  return "http://data.nba.net/10s/prod/v2/" + seasonYear + "/teams.json";
}

function getTeamRosterUrl(seasonYear, teamUrlName) {
  return (
    "http://data.nba.net/10s/prod/v1/" +
    seasonYear +
    "/teams/" +
    teamUrlName +
    "/roster.json"
  );
}
