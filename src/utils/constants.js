const updateStatus = {
  COMPLETE: "complete",
  NOTREADY: "not ready",
  PENDING: "pending",
};

const statType = {
  PLAYER: "player",
  TEAM: "team",
  OPPONENT: "opponent",
};

const usageType = {
  SCORING: "scoringUsage",
  PLAYMAKING: "playmakingUsage",
  REBOUNDING: "reboundingUsage",
};

const positions = {
  GUARD: "G",
  GUARDFORWARD: "GF",
  FORWARDGUARD: "F",
  FORWARD: "F",
  FORWARDCENTER: "FC",
  CENTERFORWARD: "CF",
  CENTER: "C",
};

const database = {
  CURRENT: "currentSeason",
  HISTORICAL: "historicalSeasons",
};

const historicalCollection = {
  2015: {
    PLAYERS: "2015-players",
    SCHEDULE: "2015-schedule",
    LEAGUE: "2015-league",
    TEAMS: "2015-teams",
  },
  2016: {
    PLAYERS: "2016-players",
    SCHEDULE: "2016-schedule",
    LEAGUE: "2016-league",
    TEAMS: "2016-teams",
  },
  2017: {
    PLAYERS: "2017-players",
    SCHEDULE: "2017-schedule",
    LEAGUE: "2017-league",
    TEAMS: "2017-teams",
  },
  2018: {
    PLAYERS: "2018-players",
    SCHEDULE: "2018-schedule",
    LEAGUE: "2018-league",
    TEAMS: "2018-teams",
  },
  2019: {
    PLAYERS: "2019-players",
    SCHEDULE: "2019-schedule",
    LEAGUE: "2019-league",
    TEAMS: "2019-teams",
  },
  2020: {
    PLAYERS: "2020-players",
    SCHEDULE: "2020-schedule",
    LEAGUE: "2020-league",
    TEAMS: "2020-teams",
  },
};

const currentCollection = {
  PLAYERS: "players",
  SCHEDULE: "schedule",
  LEAGUE: "league",
  TEAMS: "teams",
};

module.exports.updateStatus = updateStatus;
module.exports.statType = statType;
module.exports.usageType = usageType;
module.exports.positions = positions;
module.exports.database = database;
module.exports.historicalCollection = historicalCollection;
module.exports.currentCollection = currentCollection;
