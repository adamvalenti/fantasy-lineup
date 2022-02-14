const requests = require("./apiRequests.js");
const misc = require("./misc.js");
const calculations = require("./calculations.js");
const { MongoClient } = require("mongodb");
const config = require("../../config.json");

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

const generalPositions = {
  GUARD: "G",
  FORWARD: "F",
  CENTER: "C",
};

const database = {
  NBAFANTASYLINEUP: "nbaFantasyLineup",
};

const collections = {
  PLAYERS: "players",
  SCHEDULE: "schedule",
  LEAGUE: "league",
  TEAMS: "teams",
};

async function mongoClient() {
  const MONGO_CONNECTION_STRING = config.MONGO_CONNECTION_STRING;
  const uri =
    "mongodb+srv://adamvalenti:" +
    MONGO_CONNECTION_STRING +
    "@adam.ogm6r.mongodb.net/nbaFantasyLineup?retryWrites=true&w=majority";

  var client = new MongoClient(uri);
  return client;
}

//function to update teams roster

async function main() {
  const client = await mongoClient();
  try {
    await client.connect();
    misc.displayCurrentTime();

    await removeTeams(client);
    await removeSchedule(client);
    console.log("Collections Removed");
    misc.displayCurrentTime();

    await createTeams(client, await requests.getTeams());
    misc.displayCurrentTime();

    await createGames(client, await requests.getSchedule());
    misc.displayCurrentTime();

    await updateGames(
      client,
      await requests.getUpdatedSchedule(
        gamesToBeUpdated(await toBeUpdated(client))
      )
    );

    misc.displayCurrentTime();
    await playerUsages(client);

    // research atlas search and search index for improved database retrieval
    // research mongodb charts for player stat graphs
    // need function for upcoming games
    // may want to track std deviation of each lastN to determine what can be expected
  } catch (error) {
    console.error(error);
  } finally {
    misc.displayCurrentTime();
    await client.close();
  }
}

main().catch(console.error);

function filterPlayers(players) {
  var teamPlayers = players
    .filter((player) => {
      return player.mp > 0;
    })
    .map((player) => {
      return {
        playerId: player.playerId,
        stats: {
          pts: player.pts,
          ast: player.ast,
          drb: player.drb,
          orb: player.orb,
          stl: player.stl,
          blk: player.blk,
          tov: player.tov,
          fgm: player.fgm,
          fga: player.fga,
          tpm: player.tpm,
          tpa: player.tpa,
          ftm: player.ftm,
          fta: player.fta,
          mp: player.mp,
          pf: player.pf,
          fp: player.fp,
        },
      };
    });

  return teamPlayers;
}

async function pullTeams(client) {
  var teamsCursor = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.TEAMS)
    .find({});

  var teams = await teamsCursor.toArray();
  return teams;
}

async function playerUsages(client) {
  // ennumerate stat type (pts, ast, etc)
  var seasonYear = await requests.getSeasonYear();
  var gamesByTeam = {};
  var cleanedGames = [];
  var cleanedGame = {};
  var hTeamPlayers = [];
  var vTeamPlayers = [];
  var hTeamData;
  var vTeamData;
  var hTeamStats = {};
  var vTeamStats = {};

  var playedGames = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.SCHEDULE)
    .find({ updateStatus: requests.updateStatus.PENDING, seasonStageId: 002 })
    .toArray();

  cleanedGames = playedGames.map((playedGame) => {
    hTeamPlayers = filterPlayers(playedGame.hTeam.stats.player);
    vTeamPlayers = filterPlayers(playedGame.vTeam.stats.player);

    cleanedGame = {
      hTeam: {
        teamId: playedGame.hTeam.teamId,
        teamStats: playedGame.hTeam.stats.team,
        activePlayers: hTeamPlayers,
      },
      vTeam: {
        teamId: playedGame.vTeam.teamId,
        teamStats: playedGame.vTeam.stats.team,
        activePlayers: vTeamPlayers,
      },
    };
    return cleanedGame;
  });

  for (let i = 0; i < cleanedGames.length; i++) {
    hTeamData = cleanedGames[i].hTeam;
    vTeamData = cleanedGames[i].vTeam;
    hTeamStats = {
      teamStats: hTeamData.teamStats,
      activePlayers: hTeamData.activePlayers,
    };
    vTeamStats = {
      teamStats: vTeamData.teamStats,
      activePlayers: vTeamData.activePlayers,
    };
    if (gamesByTeam.hasOwnProperty(hTeamData.teamId)) {
      gamesByTeam[hTeamData.teamId].push(hTeamStats);
    } else {
      gamesByTeam[hTeamData.teamId] = [hTeamStats];
    }

    if (gamesByTeam.hasOwnProperty(vTeamData.teamId)) {
      gamesByTeam[vTeamData.teamId].push(vTeamStats);
    } else {
      gamesByTeam[vTeamData.teamId] = [vTeamStats];
    }
  }

  var nGames = 0;
  for (let team in gamesByTeam) {
    nGames += gamesByTeam[team].length;
  }

  console.log("Games Sorted");

  var activeRoster = [];
  var oldRoster = [];
  var team;
  var player;
  var playerSeasons = [];
  var playerTeams = [];
  var playerTeam;
  var newPlayerGames = [];
  var newGamesTeamStats = [];
  var usagePercentages;
  var updates = [];

  var teamAverages = {
    old: {},
    new: {},
    curr: {},
  };
  var playerTeamAverages = {
    old: {},
    new: {},
    curr: {},
  };
  var playerSeasonAverages = {
    old: {},
    new: {},
    curr: {},
  };
  var teamGamesPlayed = {
    old: {},
    new: {},
    curr: {},
  };
  var playerGamesPlayed = {
    old: {},
    new: {},
    curr: {},
  };
  var playerGameStats = {
    old: {},
    new: {},
    curr: {},
  };

  var teams = await pullTeams(client);

  for (let i = 0; i < teams.length; i++) {
    team = teams[i];
    activeRoster = team.activeRoster;
    oldRoster = team.oldRoster;

    var playerData = {};
    var teamData = [];
    var teamUpdate;
    var scoringUsageRankings = [];
    var playmakingUsageRankings = [];
    var reboundingUsageRankings = [];

    if (gamesByTeam.hasOwnProperty(team._id)) {
      teamGamesPlayed.old = team.gp;
      teamGamesPlayed.new = gamesByTeam[team._id].length;
      teamGamesPlayed.curr = teamGamesPlayed.old + teamGamesPlayed.new;

      for (let j = 0; j < activeRoster.length; j++) {
        player = activeRoster[j];

        if (player.seasonalStats.length !== 0) {
          playerSeasons = player.seasonalStats.filter((season) => {
            return season.seasonYear == seasonYear;
          });
          if (playerSeasons.length !== 0) {
            playerSeasonAverages.old = playerSeasons[0];
            playerTeams = playerSeasons[0].teams;
            playerTeam = playerTeams.filter((playerTeam) => {
              return playerTeam.teamId == team._id;
            })[0];

            if (playerTeam !== undefined) {
              playerTeamAverages.old = playerTeam.perGame;

              newPlayerGames = gamesByTeam[team._id].filter((game) => {
                return (
                  game.activePlayers.filter((gamePlayer) => {
                    return gamePlayer.playerId == player.personId;
                  }).length > 0
                );
              });

              if (newPlayerGames.length > 0) {
                newGamesTeamStats = newPlayerGames.map((game) => {
                  return game.teamStats;
                });

                playerGameStats.new = newPlayerGames.map((game) => {
                  return game.activePlayers
                    .filter((gamePlayer) => {
                      return gamePlayer.playerId == player.personId;
                    })
                    .map((gamePlayer) => {
                      return gamePlayer.stats;
                    })[0];
                });

                playerGamesPlayed.new = newPlayerGames.length;
                teamAverages.new = calculations.newAverages(newGamesTeamStats);
                playerTeamAverages.new = calculations.newAverages(
                  playerGameStats.new
                );
                playerSeasonAverages.new = playerTeamAverages.new;

                if (teamGamesPlayed.old != 0) {
                  teamAverages.old = player.data.teamAverages;
                  playerGamesPlayed.old = player.data.gp;
                  playerGameStats.old = player.data.games;

                  playerGamesPlayed.curr =
                    playerGamesPlayed.old + playerGamesPlayed.new;
                  playerGameStats.curr = playerGameStats.old.concat(
                    playerGameStats.new
                  );
                  teamAverages.curr = calculations.currAverages(
                    teamAverages.old,
                    teamAverages.new,
                    teamGamesPlayed.old,
                    teamGamesPlayed.new,
                    teamGamesPlayed.curr
                  );
                  playerTeamAverages.curr = calculations.currAverages(
                    playerTeamAverages.old,
                    playerTeamAverages.new,
                    playerGamesPlayed.old,
                    playerGamesPlayed.new,
                    playerGamesPlayed.curr
                  );
                  playerSeasonAverages.curr = calculations.currAverages(
                    playerSeasonAverages.old,
                    playerSeasonAverages.new,
                    playerGamesPlayed.old,
                    playerGamesPlayed.new,
                    playerGamesPlayed.curr
                  );
                } else {
                  playerGamesPlayed.curr = playerGamesPlayed.new;
                  playerGameStats.curr = playerGameStats.new;
                  teamAverages.curr = teamAverages.new;
                  playerTeamAverages.curr = playerTeamAverages.new;
                  playerSeasonAverages.curr = playerSeasonAverages.new;
                }
                usagePercentages = calculations.usagePercentages(
                  playerTeamAverages.curr,
                  teamAverages.curr
                );

                playerData = {
                  usage: usagePercentages,
                  games: playerGameStats.curr,
                  averages: playerTeamAverages.curr,
                  teamAverages: teamAverages.curr,
                  gp: playerGamesPlayed.curr,
                  gm: teamGamesPlayed.curr - playerGamesPlayed.curr,
                };
              } else {
                usagePercentages = {
                  scoringUsage: player.data.usage.scoringUsage,
                  playmakingsUsage: player.data.usage.playmakingsUsage,
                  reboundingUsage: player.data.usage.reboundingUsage,
                };
                playerData = {
                  usage: player.data.usage,
                  games: player.data.games,
                  averages: player.data.averages,
                  teamAverages: player.data.teamAverages,
                  gp: player.data.gp,
                  gm: player.data.gm,
                };
              }

              // if (usagePercentages.scoringUsage >= 0) {
              // } else {
              //   console.log(player.personId);
              // }

              scoringUsageRankings.push({
                playerId: player.personId,
                scoringUsage: usagePercentages.scoringUsage,
              });
              playmakingUsageRankings.push({
                playerId: player.personId,
                playmakingUsage: usagePercentages.playmakingUsage,
              });
              reboundingUsageRankings.push({
                playerId: player.personId,
                reboundingUsage: usagePercentages.reboundingUsage,
              });

              teamData.push(playerData);
            }
          }
        }
      }

      teamUpdate = misc.formatTeamUpdate(
        team._id,
        teamData,
        teamGamesPlayed.curr,
        scoringUsageRankings,
        playmakingUsageRankings,
        reboundingUsageRankings
      );

      updates.push(teamUpdate);

      scoringUsageRankings = calculations.usageRankings(
        scoringUsageRankings,
        usageType.SCORING
      );

      playmamkingUsageRankings = calculations.usageRankings(
        playmakingUsageRankings,
        usageType.PLAYMAKING
      );

      reboundingUsageRankings = calculations.usageRankings(
        reboundingUsageRankings,
        usageType.REBOUNDING
      );

      // if (team._id == "1610612747") {
      //   console.log("SCORING : " + team._id);
      //   console.log(scoringUsageRankings);
      //   console.log("PLAYMAKING : " + team._id);
      //   console.log(playmakingUsageRankings);
      //   console.log("REBOUNDING : " + team._id);
      //   console.log(reboundingUsageRankings);
      // }
    }
  }
  var scheduleUpdate = [
    {
      updateMany: {
        filter: { updateStatus: requests.updateStatus.PENDING },
        update: { $set: { updateStatus: requests.updateStatus.COMPLETE } },
      },
    },
  ];

  // console.log(scheduleUpdate);

  await sendUpdates(client, collections.TEAMS, updates);
  await sendUpdates(client, collections.SCHEDULE, scheduleUpdate);
}

async function testUsages() {
  const client = await mongoClient();
  try {
    await client.connect();
    await playerUsages(client);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

// testUsages();

async function createCollections(client) {
  try {
    misc.displayCurrentTime();
    // await addGames(client, await requests.getSchedule());
    // misc.displayCurrentTime();
    // await createPlayers(client, await requests.getPlayers());
    // misc.displayCurrentTime();
    // await addLeague(client);
    await createTeams(client, await requests.getTeams());
    // misc.displayCurrentTime();
  } catch (error) {
    console.error(error);
  }
}

async function updateCollections(client) {
  try {
    var games = await requests.getUpdatedSchedule(
      gamesToBeUpdated(await toBeUpdated(client))
    );
    console.log("Schedule Retrieved");
    misc.displayCurrentTime();

    await updateGames(client, games);

    // await updatePlayers(
    //   client,
    //   await playersWithBirthdays(client),
    //   await teamsToBeUpdated(games)
    // );

    misc.displayCurrentTime();

    // await updateLeague(client);
    // misc.displayCurrentTime();
  } catch (error) {
    console.error(error);
  }
}

async function removeCollections(client) {
  await removePlayers(client);
  await removeSchedule(client);
  await removeTeams(client);
}

async function addLeague(client) {
  // give recommendations for positions based on weakness of a player

  var emptyLeagues = [
    {
      _id: "0",
      name: "all",
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "1",
      name: generalPositions.GUARD,
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "2",
      name: generalPositions.FORWARD,
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "3",
      name: generalPositions.CENTER,
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "4",
      name: "Minutes Criteria",
      averages: {},
      deviation: {},
      sampleSize: {},
    },
  ];

  await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.LEAGUE)
    .InsertMany(emptyLeagues, (error) => {
      if (error) {
        console.log("Error occured while adding league");
      } else {
        console.log("League added");
      }
    });
}

async function updateLeague(client) {
  // make function that determines total number of missed games by a player when initially scrapping for seasonal stats
  // deviation would need to be taken at a game level for all players rather than averaging each deviation
  // May be best to determine consistency based on an assumed league average
  // overwrite season[0] calculation when adding players so that it is done using recent games

  var players = {
    all: {},
    guards: {},
    forwards: {},
    centers: {},
    playedMinutesCriteria: {},
    playedGamesCriteria: {},
  };

  var gamesPlayed = {
    all: [],
    guards: [],
    forwards: [],
    centers: [],
    playedMinutesCriteria: [],
    playedGamesCriteria: [],
  };

  var player = {};

  const cursor = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.PLAYERS)
    .find();

  const results = await cursor.toArray();

  results.map((result) => {
    if (result.stats.season[0] != null) {
      player = {
        playerId: result._id,
        name: result.name,
        pos: result.pos,
      };

      players.all[result._id].firstGame = games.all.length;
      players.all[result._id] = player;
      games.all.push(result.stats.recent.playedGames);
      games.all.push(result);

      if (result.pos == generalPositions.GUARD) {
        players.guards[result._id] = player;
      } else if (result.pos == generalPositions.FORWARD) {
        players.forwards[result._id] = player;
      } else if (result.pos == generalPositions.CENTER) {
        players.centers[result._id] = player;
      }
      if (result.stats.season[0].perGame.mp > 15) {
        players.playedMinutesCriteria[result._id] = player;
      }
      // if (result.stats.season[0].gp > 2 * result.stats.season[0].gm) {
      //   players.playedGamesCriteria[result._id] = player;
      // }
    }
  });

  var averages = calculations.leagueAverages(playerSeasonalStats);
}

async function toBeUpdated(client) {
  var results = [];
  try {
    var currDate = misc.currentDate();

    results = await client
      .db(database.NBAFANTASYLINEUP)
      .collection(collections.SCHEDULE)
      .find({
        updateStatus: requests.updateStatus.NOTREADY,
        startDateEastern: { $lt: currDate },
      })
      // .limit(150)
      .toArray();
  } catch (error) {
    console.error(error);
  } finally {
    return results;
  }
}

async function teamsToBeUpdated(games) {
  var teams = {};

  //add players from each game to players object
  games.forEach((game) => {
    //add home team players to players object
    sortPlayers(
      teams,
      game.hTeam,
      game.vTeam,
      game.gameId,
      game.startDateEastern,
      true
    );

    //add visiting team players to players object
    sortPlayers(
      teams,
      game.vTeam,
      game.hTeam,
      game.gameId,
      game.startDateEastern,
      game.isNeutralVenue
    );
  });
  return teams;
}

function sortPlayers(teams, team, opponent, gameId, gameDate, isHomeTeam) {
  /*teams = {
    "teamId": {
      "gameId": {
        teamStats
        opponentStats
        Players:
      }
    }
  }
  */

  var matchupStats = {};

  team.stats.player.forEach((player) => {
    player.matchup == null
      ? (matchupStats = {})
      : (matchupStats = calculations.matchupStats(
          opponent.stats.player,
          player.matchup
        ));

    if (teams.hasOwnProperty(team.teamId)) {
      if (teams[team.teamId].games.hasOwnProperty(gameId)) {
        teams[team.teamId].games[gameId].players[player.playerId] = {
          playerId: player.playerId,
          playedGame: player.mp != 0,
          playerStatus: player.dnp,
          playerStats:
            player.mp != 0
              ? {
                  pts: player.pts,
                  ast: player.ast,
                  drb: player.drb,
                  orb: player.orb,
                  stl: player.stl,
                  blk: player.blk,
                  tov: player.tov,
                  fgm: player.fgm,
                  fga: player.fga,
                  fgp: player.fgm / player.fga,
                  tpm: player.tpm,
                  tpa: player.tpa,
                  tpp: player.tpm / player.tpa,
                  ftm: player.ftm,
                  fta: player.fta,
                  ftp: player.ftm / player.fta,
                  mp: player.mp,
                  pf: player.pf,
                  fp: player.fp,
                  atr: player.ast / player.tov,
                }
              : {},
          matchup: matchupStats,
        };
      } else {
        teams[team.teamId].games[gameId] = {
          gameId: gameId,
          isHomeGame: isHomeTeam,
          gameDate: gameDate,
          opponentId: opponent.teamId,
          teamStats: team.stats.team,
          opponentStats: opponent.stats.team,
          players: {
            playerId: player.playerId,
            playedGame: player.mp != 0,
            playerStatus: player.dnp,
            playerStats:
              player.mp != 0
                ? {
                    pts: player.pts,
                    ast: player.ast,
                    drb: player.drb,
                    orb: player.orb,
                    stl: player.stl,
                    blk: player.blk,
                    tov: player.tov,
                    fgm: player.fgm,
                    fga: player.fga,
                    fgp: player.fgm / player.fga,
                    tpm: player.tpm,
                    tpa: player.tpa,
                    tpp: player.tpm / player.tpa,
                    ftm: player.ftm,
                    fta: player.fta,
                    ftp: player.ftm / player.fta,
                    mp: player.mp,
                    pf: player.pf,
                    fp: player.fp,
                    atr: player.ast / player.tov,
                  }
                : {},
            matchup: matchupStats,
          },
        };
      }
    } else {
      teams[team.teamId] = {
        teamId: team.teamId,
        games: {
          [gameId]: {
            gameId: gameId,
            isHomeGame: isHomeTeam,
            gameDate: gameDate,
            opponentId: opponent.teamId,
            teamStats: team.stats.team,
            opponentStats: opponent.stats.team,
            players: {
              playerId: player.playerId,
              playedGame: player.mp != 0,
              playerStatus: player.dnp,
              playerStats:
                player.mp != 0
                  ? {
                      pts: player.pts,
                      ast: player.ast,
                      drb: player.drb,
                      orb: player.orb,
                      stl: player.stl,
                      blk: player.blk,
                      tov: player.tov,
                      fgm: player.fgm,
                      fga: player.fga,
                      fgp: player.fgm / player.fga,
                      tpm: player.tpm,
                      tpa: player.tpa,
                      tpp: player.tpm / player.tpa,
                      ftm: player.ftm,
                      fta: player.fta,
                      ftp: player.ftm / player.fta,
                      mp: player.mp,
                      pf: player.pf,
                      fp: player.fp,
                      atr: player.ast / player.tov,
                    }
                  : {},
              matchup: matchupStats,
            },
          },
        },
      };
    }
  });
}

function gamesToBeUpdated(results) {
  var games = [];

  games = results.map((game) => {
    return { gameId: game._id };
  });
  return games;
}

async function createGames(client, games) {
  var cleanedGames = [];
  var game = {};
  for (let i = 0; i < games.length; i++) {
    game = misc.formatGame(games[i]);
    cleanedGames.push(game);
  }

  const result = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.SCHEDULE)
    .insertMany(cleanedGames);

  if (Object.keys(result.insertedIds).length == cleanedGames.length) {
    console.log(cleanedGames.length + " games created");
  } else {
    console.log("Error occcured during game creation");
  }
}

async function updateGames(client, games) {
  var game = {};
  var gameUpdate;
  var updates = [];

  for (let i = 0; i < games.length; i++) {
    game = misc.formatGame(games[i]);
    gameUpdate = misc.formatGameUpdate(game);
    updates.push(gameUpdate);
  }

  await sendUpdates(client, collections.SCHEDULE, updates);
  console.log("All games Updated");
}

async function sendUpdates(client, collection, updates) {
  const result = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collection)
    .bulkWrite(updates);
}

async function updateGame(client, game) {
  const query = { _id: game._id };
  const update = {
    $set: {
      updateStatus: game.updateStatus,
      hTeam: game.hTeam,
      vTeam: game.vTeam,
    },
  };

  await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.SCHEDULE)
    .updateOne(query, update);
}

async function createTeams(client, teams) {
  const options = { ordered: true };
  var cleanedTeams = [];
  var team = {};

  for (let i = 0; i < teams.length; i++) {
    team = {
      _id: teams[i].teamId,
      city: teams[i].city,
      fullName: teams[i].fullName,
      confName: teams[i].confName,
      tricode: teams[i].tricode,
      divName: teams[i].divName,
      nickname: teams[i].nickname,
      urlName: teams[i].urlName,
      gp: 0,
      activeRoster: teams[i].activeRoster,
      oldRoster: teams[i].oldRoster,
    };

    cleanedTeams.push(team);
  }

  const result = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.TEAMS)
    .insertMany(cleanedTeams, options);

  if (Object.keys(result.insertedIds).length == cleanedTeams.length) {
    console.log(cleanedTeams.length + " teams created");
  } else {
    console.log("Error occcured during team creation");
  }
}

async function createPlayers(client, players) {
  var cleanedPlayers = [];

  for (let i = 0; i < players.length; i++) {
    cleanedPlayers.push(misc.formatPlayer(players[i]));
  }

  const result = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.PLAYERS)
    .insertMany(cleanedPlayers);

  if (result.insertedIds.length == cleanedPlayers.length) {
    console.log(result.insertedIds.length + " players created");
  } else {
    console.log("Error occcured during player creation");
  }
}

async function playersWithBirthdays(client) {
  try {
    var playerIds = [];

    const cursor = await client
      .db(database.NBAFANTASYLINEUP)
      .collection(collections.PLAYERS)
      .find();
    const results = await cursor.toArray();

    results.forEach((result) => {
      if (result.age != misc.playerAge(result.dateOfBirthUTC)) {
        playerIds.push(result._id);
      }
    });
  } catch (error) {
    console.error(error);
  } finally {
    return playerIds;
  }
}

async function updatePlayers(client, playersWithBirthday, teamsWithNewGame) {
  try {
    await client
      .db(database.NBAFANTASYLINEUP)
      .collection(collections.PLAYERS)
      .updateMany(
        { _id: { $in: playersWithBirthday } },
        { $inc: { age: 1 } },
        (error) => {
          if (error) {
            console.log("Error occured while updating players birthdays");
          } else {
            console.log("Birthdays updated");
          }
        }
      );

    for (var teamId in teamsWithNewGame) {
      await updateTeam(client, teamsWithNewGame[teamId]);
    }
    console.log("All players updated");
  } catch (error) {
    console.error(error);
  }
}

async function updateTeam(client, team) {
  // create function that updates player rankings within team (based on usage)
  // get player list from each team, as well player usage percentages

  // when predicting player performance, look at the projected lineups combined usages across each category
  // need function to predict lineup for upcoming games
  // determine how much of last 3, 5, 9, 13, 20 increase is from these expected jumps due to missing usage and how much is from improved performance

  // function to determine team averages
  const query = { _id: team.teamId };
  var currTeamAverages;

  const result1 = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.TEAMS)
    .findOne(query);

  currTeamAverages = result.currentSeasonAverages;

  var teamTotals = {
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
    tf: 0,
    pos: 0,
    pace: 0,
    gp: 0,
  };

  for (var gameId in team.games) {
    var game = team.games[gameId];

    teamTotals = {
      pts: teamTotals.pts + game.teamStats.pts,
      ast: teamTotals.ast + game.teamStats.ast,
      drb: teamTotals.drb + game.teamStats.drb,
      orb: teamTotals.orb + game.teamStats.orb,
      stl: teamTotals.stl + game.teamStats.stl,
      blk: teamTotals.blk + game.teamStats.blk,
      tov: teamTotals.tov + game.teamStats.tov,
      fgm: teamTotals.fgm + game.teamStats.fgm,
      fga: teamTotals.fga + game.teamStats.fga,
      tpm: teamTotals.tpm + game.teamStats.tpm,
      tpa: teamTotals.tpa + game.teamStats.tpa,
      ftm: teamTotals.ftm + game.teamStats.ftm,
      fta: teamTotals.fta + game.teamStats.fta,
      mp: teamTotals.mp + game.teamStats.mp,
      pf: teamTotals.pf + game.teamStats.pf,
      tf: teamTotals.pts + game.teamStats.tf,
      pos: teamTotals.pts + game.teamStats.pos,
      pace: teamTotals.pts + game.teamStats.pace,
      gp: teamTotals.num++,
    };
  }

  var totalGamesPlayed = teamTotals.gp + currTeamAverages.gp;
  var currGamesPlayed = currTeamAverages.gp;

  var newSeasonAverages = {
    pts:
      teamTotals.pts / totalGamesPlayed +
      (currTeamAverages.pts * currGamesPlayed) / totalGamesPlayed,
    ast:
      teamTotals.ast / totalGamesPlayed +
      (currTeamAverages.ast * currGamesPlayed) / totalGamesPlayed,
    drb:
      teamTotals.drb / totalGamesPlayed +
      (currTeamAverages.drb * currGamesPlayed) / totalGamesPlayed,
    orb:
      teamTotals.orb / totalGamesPlayed +
      (currTeamAverages.orb * currGamesPlayed) / totalGamesPlayed,
    stl:
      teamTotals.stl / totalGamesPlayed +
      (currTeamAverages.stl * currGamesPlayed) / totalGamesPlayed,
    blk:
      teamTotals.blk / totalGamesPlayed +
      (currTeamAverages.blk * currGamesPlayed) / totalGamesPlayed,
    tov:
      teamTotals.tov / totalGamesPlayed +
      (currTeamAverages.tov * currGamesPlayed) / totalGamesPlayed,
    fgm:
      teamTotals.fgm / totalGamesPlayed +
      (currTeamAverages.fgm * currGamesPlayed) / totalGamesPlayed,
    fga:
      teamTotals.fga / totalGamesPlayed +
      (currTeamAverages.fga * currGamesPlayed) / totalGamesPlayed,
    tpm:
      teamTotals.tpm / totalGamesPlayed +
      (currTeamAverages.tpm * currGamesPlayed) / totalGamesPlayed,
    tpa:
      teamTotals.tpa / totalGamesPlayed +
      (currTeamAverages.tpa * currGamesPlayed) / totalGamesPlayed,
    ftm:
      teamTotals.ftm / totalGamesPlayed +
      (currTeamAverages.ftm * currGamesPlayed) / totalGamesPlayed,
    fta:
      teamTotals.fta / totalGamesPlayed +
      (currTeamAverages.fta * currGamesPlayed) / totalGamesPlayed,
    mp:
      teamTotals.mp / totalGamesPlayed +
      (currTeamAverages.mp * currGamesPlayed) / totalGamesPlayed,
    pf:
      teamTotals.pf / totalGamesPlayed +
      (currTeamAverages.pf * currGamesPlayed) / totalGamesPlayed,
    tf:
      teamTotals.tf / totalGamesPlayed +
      (currTeamAverages.tf * currGamesPlayed) / totalGamesPlayed,
    pos:
      teamTotals.pos / totalGamesPlayed +
      (currTeamAverages.pos * currGamesPlayed) / totalGamesPlayed,
    pace:
      teamTotals.pace / totalGamesPlayed +
      (currTeamAverages.pace * currGamesPlayed) / totalGamesPlayed,
  };

  const update = { currentSeasonAverages: newSeasonAverages };
  const result2 = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.TEAMS)
    .update(query, update);

  /*
  scoringRankings = [
    {playerId: "2544", scoringUsage: 20},
    {},
    {},
  ] 

  playmakingRankings = [
    {playerId: "2544", playmakingUsage: 15},
  ]

  reboundingRankings = [
    {playerId: "2544", reboundingUsage = 10},
  ]
  */

  var roster = [];

  const result = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.TEAMS)
    .findOne(query);

  // for each player calculate their average usages. dont know when to do this.  Assume already calculated (for now roster)
  roster = result.roster;

  var scoringRankings = roster;
  var playmakingRankings = roster;
  var reboundingRankings = roster;
  var playerGames = [];

  for (var gameId in team.games) {
    var missingScoringUsage = scoringRankings;
    var missingPlaymakingUsage = playmakingRankings;
    var missingReboundingUsage = reboundingRankings;

    var game = team.games[gameId];
    for (var playerId in game.players) {
      missingScoringUsage = missingScoringUsage.filter((player) => {
        return player.playerId != playerId;
      });
      missingPlaymakingUsage = missingPlaymakingUsage.filter((player) => {
        return player.playerId != playerId;
      });
      missingReboundingUsage = missingReboundingUsage.filter((player) => {
        return player.playerId != playerId;
      });
    }

    game.missingScoringUsage = missingScoringUsage.slice(0, 3);
    game.missingPlaymakingUsage = missingPlaymakingUsage.slice(0, 3);
    game.missingReboundingUsage = missingReboundingUsage.slice(0, 3);
  }

  for (var player in roster) {
    for (var gameId in team.games) {
      var game = team.games[gameId];

      var gameData = {
        gameId: game.gameId,
        isHomeGame: game.isHomeGame,
        gameDate: game.gameDate,
        opponentId: game.opponentId,
        teamStats: game.teamStats,
        opponentStats: game.opponentStats,
        missingScoringUsage: game.missingScoringUsage,
        missingPlaymakingUsage: missingPlaymakingUsage,
        missingReboundingUsage: missingReboundingUsage,
      };

      var playerData = game.players[player.playerId];

      if (game.players.hasOwnProperty(player.playerId)) {
        playerStats = game.players[player.playerId];
        playerGames.push({
          gameData: gameData,
          playerData: playerData,
        });
      } else {
        playerGames.push({
          gameData: gameData,
        });
      }
    }
    playerGames.sort((a, b) => {
      a.gameData.gameDate < b.gameData.gameDate
        ? -1
        : a.gameData.gameDate > b.gameData.gameDate
        ? 1
        : 0;
    });

    await updatePlayer(client, playerGames);
  }

  /*
   newRecent = {
      playedGames: recentPlayedGames,
      missedGames: recentMissedGames,
      average: averages,
      differential: differential,
      advanced: advanced,
      deviation: deviation,
    };
  */

  // for each team id
  // send gameStats (gameId, gameDate, isHomeGame, oppId, teamStats, oppStats), playerUsages (for usage differential),
}

async function updatePlayer(client, player) {
  const maxGames = 20;

  var seasonAverages = {};
  var currSeason = {};
  var prevSeason = {};
  var newSeasonAverages = {};

  var recentPlayedGames = [];
  var recentMissedGames = [];

  var newRecent = {};
  var differential = {};
  var averages = {};
  var advanced = {};
  var deviation = {};

  // breakout calculations into other functions
  // add function that updates player seasonal stats season averages should only update season[0] once 10 games has been played by the player, otherwise reference previous season averages

  const query = { _id: player.playerId };

  const result = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.PLAYERS)
    .findOne(query);

  if (result != null) {
    seasonAverages = result.stats.season;
    currSeason = seasonAverages[0];
    prevSeason = seasonAverages[1];

    recentPlayedGames = result.stats.recent.playedGames;
    recentMissedGames = result.stats.recent.missedGames;

    //matchupSeasonAverages

    // updatedSeasonAveraged.  Need to update team specific data
    // store season averages prior to lastNstats (season averages neglecting lastN games)

    recentPlayedGames = misc.updateQueue(
      recentPlayedGames,
      player.playedGames,
      maxGames
    );
    recentMissedGames = misc.updateQueue(
      recentMissedGames,
      player.missedGames,
      maxGames
    );

    newSeasonAverages = calculations.newSeasonAverages(
      recentPlayedGames,
      currSeason
    );

    differential = calculations.playerDifferentials(
      recentPlayedGames,
      newSeasonAverages
    );

    averages = calculations.playerAverages(
      recentPlayedGames,
      statType.PLAYER,
      statType.TEAM,
      statType.OPPONENT
    );

    advanced = calculations.playerAdvanced(averages);

    deviation = calculations.playerDeviations(
      recentPlayedGames,
      averages.last20.player,
      maxGames
    );

    newRecent = {
      playedGames: recentPlayedGames,
      missedGames: recentMissedGames,
      average: averages,
      differential: differential,
      advanced: advanced,
      deviation: deviation,
    };

    const update = {
      $set: {
        "stats.recent": newRecent,
        "stats.season.0.perGame": newSeasonAverages.perGame,
        "stats.season.0.perMin": newSeasonAverages.perMin,
        "stats.season.0.totals": newSeasonAverages.totals,
      },
    };

    await client
      .db(database.NBAFANTASYLINEUP)
      .collection(collections.PLAYERS)
      .updateOne(query, update);
  }
}

async function findPlayerByName(client, nameOfPlayer) {
  const result = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.PLAYERS)
    .findOne({ name: nameOfPlayer });

  if (result) {
    console.log(
      "Found a player in the collection with the name " + nameOfPlayer
    );
  } else {
    console.log("No player found with the name " + nameOfPlayer);
  }

  return result;
}

async function findPlayersByStatConstraint(
  client,
  { minimum = "", stat = "", maxPlayers = Number.MAX_SAFE_INTEGER } = {}
) {
  const cursor = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.PLAYERS)
    .find({
      [stat]: { $gte: minimum },
    })
    .sort({ [stat]: -1 })
    .limit(maxPlayers);

  const results = await cursor.toArray();

  if (results.length > 0) {
    console.log("Found player(s) with at least " + minimum + " " + stat);

    results.forEach((result) => {
      console.log(result.name + " | " + result[stat]);
    });
  }
}

async function deletePlayer(client, id) {
  const result = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.PLAYERS)
    .deleteOne({ _id: id });

  console.log(result.name + " was deleted");
}

async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();

  console.log("Databases:");
  databasesList.databases.forEach((db) => {
    console.log("- " + db.name);
  });
}

async function removePlayers(client) {
  await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.PLAYERS)
    .deleteMany({});
}

async function removeSchedule(client) {
  await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.SCHEDULE)
    .deleteMany({});
}

async function removeTeams(client) {
  await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collections.TEAMS)
    .deleteMany({});
}
