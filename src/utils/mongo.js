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

const modelCollections = {
  PLAYERS: "m-players",
  SCHEDULE: "m-schedule",
  LEAGUE: "m-league",
  TEAMS: "m-teams",
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
  // need to fix functions to allow for model collections to be built.
  const client = await mongoClient();
  try {
    await client.connect();

    // await removeCollection(
    //   client,
    //   database.NBAFANTASYLINEUP,
    //   collections.TEAMS
    // );
    // await removeCollection(
    //   client,
    //   database.NBAFANTASYLINEUP,
    //   collections.SCHEDULE,
    //   { seasonStageId: 2 }
    // );
    // await removePlayers(client);
    // console.log("Collections Removed");

    var seasonYear = await requests.getSeasonYear();

    // misc.displayCurrentTime();
    // await createPlayers(client, await requests.getPlayers(seasonYear, false));
    var players = await pullCollection(client, collections.PLAYERS);

    // misc.displayCurrentTime();
    // await createTeams(client, await requests.getTeams(players, seasonYear));
    // misc.displayCurrentTime();
    // await createGames(client, await requests.getSchedule(seasonYear));

    misc.displayCurrentTime();
    await updateGames(
      client,
      await requests.getUpdatedSchedule(
        gamesToBeUpdated(await toBeUpdated(client)),
        players,
        seasonYear
      )
    );

    misc.displayCurrentTime();
    await updateNewGames(client);

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

async function getData() {
  const client = await mongoClient();
  const modelYear = (await requests.getSeasonYear()) - 1;
  misc.displayCurrentTime();
  try {
    await client.connect();

    // await removeCollection(
    //   client,
    //   database.NBAFANTASYLINEUP,
    //   modelCollections.PLAYERS
    // );

    // await removeCollection(
    //   client,
    //   database.NBAFANTASYLINEUP,
    //   modelCollections.SCHEDULE
    // );

    // await removeCollection(
    //   client,
    //   database.NBAFANTASYLINEUP,
    //   modelCollections.TEAMS
    // );

    // await createPlayers(
    //   client,
    //   await requests.getPlayers(modelYear, true),
    //   database.NBAFANTASYLINEUP,
    //   modelCollections.PLAYERS,
    //   true
    // );

    const players = await pullCollection(client, modelCollections.PLAYERS);

    // await createGames(
    //   client,
    //   await requests.getSchedule(modelYear),
    //   database.NBAFANTASYLINEUP,
    //   modelCollections.SCHEDULE
    // );

    // await createTeams(
    //   client,
    //   await requests.getTeams(players, modelYear, true),
    //   database.NBAFANTASYLINEUP,
    //   modelCollections.TEAMS
    // );

    // misc.displayCurrentTime();

    await updateGames(
      client,
      await requests.getUpdatedSchedule(
        gamesToBeUpdated(
          await toBeUpdated(
            client,
            database.NBAFANTASYLINEUP,
            modelCollections.SCHEDULE
          )
        ),
        players,
        modelYear
      ),
      modelCollections.SCHEDULE
    );

    misc.displayCurrentTime();
    await updateNewGames(
      client,
      modelCollections.SCHEDULE,
      modelCollections.TEAMS,
      modelCollections.PLAYERS,
      modelYear
    );
  } catch (error) {
    console.error(error);
  } finally {
    misc.displayCurrentTime();
    await client.close();
  }
}

getData().catch(console.error);

// main().catch(console.error);

function filterPlayers(players) {
  var teamPlayers = players
    .filter((player) => {
      return player.stats.mp > 0;
    })
    .map((player) => {
      return {
        playerId: player.playerId,
        name: player.name,
        pos: player.pos,
        dnp: player.dnp,
        stats: {
          pts: player.stats.pts,
          ast: player.stats.ast,
          drb: player.stats.drb,
          orb: player.stats.orb,
          stl: player.stats.stl,
          blk: player.stats.blk,
          tov: player.stats.tov,
          fgm: player.stats.fgm,
          fga: player.stats.fga,
          tpm: player.stats.tpm,
          tpa: player.stats.tpa,
          ftm: player.stats.ftm,
          fta: player.stats.fta,
          mp: player.stats.mp,
          pf: player.stats.pf,
          fp: player.stats.fp,
        },
        matchup: player.matchup,
      };
    });
  return teamPlayers;
}

async function pullCollection(client, collection, filter = {}) {
  var items = await client
    .db(database.NBAFANTASYLINEUP)
    .collection(collection)
    .find(filter)
    .toArray();
  return items;
}

function filterGames(games) {
  var cleanedGames;
  var cleanedGame;
  var hTeamPlayers;
  var vTeamPlayers;

  cleanedGames = games.map((game) => {
    hTeamPlayers = filterPlayers(game.hTeam.stats.player);
    vTeamPlayers = filterPlayers(game.vTeam.stats.player);

    cleanedGame = {
      hTeam: {
        gameId: game._id,
        teamId: game.hTeam.teamId,
        teamStats: game.hTeam.stats.team,
        activePlayers: hTeamPlayers,
      },
      vTeam: {
        gameId: game._id,
        teamId: game.vTeam.teamId,
        teamStats: game.vTeam.stats.team,
        activePlayers: vTeamPlayers,
      },
    };
    return cleanedGame;
  });

  return cleanedGames;
}

function sortGamesByTeam(games) {
  var sortedGames = {};

  for (let i = 0; i < games.length; i++) {
    if (sortedGames.hasOwnProperty(games[i].hTeam.teamId)) {
      sortedGames[games[i].hTeam.teamId].push({
        team: games[i].hTeam,
        opponent: games[i].vTeam,
      });
    } else {
      sortedGames[games[i].hTeam.teamId] = [
        {
          team: games[i].hTeam,
          opponent: games[i].vTeam,
        },
      ];
    }

    if (sortedGames.hasOwnProperty(games[i].vTeam.teamId)) {
      sortedGames[games[i].vTeam.teamId].push({
        team: games[i].vTeam,
        opponent: games[i].hTeam,
      });
    } else {
      sortedGames[games[i].vTeam.teamId] = [
        {
          team: games[i].vTeam,
          opponent: games[i].hTeam,
        },
      ];
    }
  }

  return sortedGames;
}

async function updateNewGames(
  client,
  scheduleCollection,
  teamsCollection,
  playerCollection,
  seasonYear
) {
  var gameFilter = {
    updateStatus: requests.updateStatus.PENDING,
    seasonStageId: 002,
  };
  var playedGames = await pullCollection(
    client,
    scheduleCollection,
    gameFilter
  );
  var cleanedGames = filterGames(playedGames);
  var sortedGames = sortGamesByTeam(cleanedGames);

  console.log("Games Sorted");

  var roster = [];
  var missingRoster = [];
  var missingPlayers = [];
  var team;
  var player;
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
  var teamGamesPlayed = {
    old: 0,
    new: 0,
    curr: 0,
  };
  var playerGamesPlayed = {
    old: 0,
    new: 0,
    curr: 0,
  };
  var matchupGamesPlayed = {
    old: 0,
    new: 0,
    curr: 0,
  };
  var playerGameStats = {
    old: [],
    new: [],
    curr: [],
  };
  var matchupAverages = {
    old: {},
    new: {},
    curr: {},
  };
  var matchupGameStats = {
    old: [],
    new: [],
    curr: [],
  };
  var gamelog = {
    old: [],
    new: [],
    curr: [],
  };

  var teams = await pullCollection(client, teamsCollection);

  for (let i = 0; i < teams.length; i++) {
    team = teams[i];
    var playerData = {};
    var teamData = [];
    var teamUpdate;
    var scheduleUpdate;
    var scoringUsageRankings = [];
    var playmakingUsageRankings = [];
    var reboundingUsageRankings = [];

    if (sortedGames.hasOwnProperty(team._id)) {
      roster = team.roster;
      missingRoster = await calculations.missingRoster(
        sortedGames[team._id],
        roster,
        seasonYear
      );
      missingPlayers.push(...missingRoster);
      roster.push(...missingRoster);

      teamGamesPlayed.old = team.gp;
      teamGamesPlayed.new = sortedGames[team._id].length;
      teamGamesPlayed.curr = teamGamesPlayed.old + teamGamesPlayed.new;

      for (let j = 0; j < roster.length; j++) {
        player = roster[j];
        teamAverages.old = player.data.teamAverages;
        playerTeamAverages.old = player.data.averages;
        playerGamesPlayed.old = player.data.gp;
        matchupAverages.old = player.data.matchupAverages;
        playerGameStats.old = player.data.games;
        matchupGamesPlayed.old = player.data.matchupGames.length;
        matchupGameStats.old = player.data.matchupGames;

        newPlayerGames = sortedGames[team._id].filter((game) => {
          return (
            game.team.activePlayers.filter((gamePlayer) => {
              return gamePlayer.playerId == player.playerId;
            }).length > 0
          );
        });

        playerGamesPlayed.new = newPlayerGames.length;

        if (playerGamesPlayed.new > 0) {
          newGamesTeamStats = newPlayerGames.map((game) => {
            return game.team.teamStats;
          });

          playerGameStats.new = newPlayerGames.map((game) => {
            return game.team.activePlayers
              .filter((teamPlayer) => {
                return teamPlayer.playerId == player.playerId;
              })
              .map((gamePlayer) => {
                return gamePlayer.stats;
              })[0];
          });

          matchupGameStats.new = newPlayerGames.map((game) => {
            return game.team.activePlayers
              .filter((teamPlayer) => {
                return (
                  teamPlayer.playerId == player.playerId &&
                  teamPlayer.matchup != {}
                );
              })
              .map((gamePlayer) => {
                return gamePlayer.matchup;
              })[0];
          });

          playerGamesPlayed.curr =
            playerGamesPlayed.old + playerGamesPlayed.new;

          playerGameStats.curr = playerGameStats.old.concat(
            playerGameStats.new
          );

          matchupGamesPlayed.new = matchupGameStats.new.length;
          matchupGamesPlayed.curr =
            matchupGamesPlayed.old + matchupGamesPlayed.new;
          matchupGameStats.curr = matchupGameStats.old.concat(
            matchupGameStats.new
          );

          teamAverages.new = calculations.newAverages(newGamesTeamStats);
          playerTeamAverages.new = calculations.newAverages(
            playerGameStats.new
          );

          if (matchupGamesPlayed.new == 0) {
            matchupAverages.curr = matchupAverages.old;
          } else {
            matchupAverages.new = calculations.newAverages(
              matchupGameStats.new
            );
            if (matchupGamesPlayed.old == 0) {
              matchupAverages.curr = matchupAverages.new;
            } else {
              matchupAverages.curr = calculations.currAverages(
                matchupAverages.old,
                matchupAverages.new,
                matchupGamesPlayed.old,
                matchupGamesPlayed.new,
                matchupGamesPlayed.curr
              );
            }
          }

          if (playerGamesPlayed.new == 0) {
            teamAverages.curr = teamAverages.old;
            playerTeamAverages.curr = playerTeamAverages.old;
          } else {
            teamAverages.new = calculations.newAverages(newGamesTeamStats);
            playerTeamAverages.new = calculations.newAverages(
              playerGameStats.new
            );

            if (playerGamesPlayed.old == 0) {
              teamAverages.curr = teamAverages.new;
              playerTeamAverages.curr = playerTeamAverages.new;
            } else {
              teamAverages.curr = calculations.currAverages(
                teamAverages.old,
                teamAverages.new,
                playerGamesPlayed.old,
                playerGamesPlayed.new,
                playerGamesPlayed.curr
              );
              playerTeamAverages.curr = calculations.currAverages(
                playerTeamAverages.old,
                playerTeamAverages.new,
                playerGamesPlayed.old,
                playerGamesPlayed.new,
                playerGamesPlayed.curr
              );
            }
          }

          usagePercentages = calculations.usagePercentages(
            playerTeamAverages.curr,
            teamAverages.curr,
            playerGamesPlayed.curr,
            teamGamesPlayed.curr
          );

          playerData = {
            usage: usagePercentages,
            games: playerGameStats.curr,
            averages: playerTeamAverages.curr,
            teamAverages: teamAverages.curr,
            matchupGames: matchupGameStats.curr,
            matchupAverages: matchupAverages.curr,
            gp: playerGamesPlayed.curr,
            gm: teamGamesPlayed.curr - playerGamesPlayed.curr,
          };
        } else {
          usagePercentages = {
            scoringUsage: player.data.usage.scoringUsage,
            playmakingUsage: player.data.usage.playmakingUsage,
            reboundingUsage: player.data.usage.reboundingUsage,
          };
          playerData = {
            usage: usagePercentages,
            games: player.data.games,
            averages: player.data.averages,
            teamAverages: player.data.teamAverages,
            matchupGames: player.data.matchupGames,
            matchupAverages: player.data.matchupAverages,
            gp: playerGamesPlayed.old,
            gm: player.data.gm,
          };
        }

        scoringUsageRankings.push({
          playerId: player.playerId,
          name: player.name,
          scoringUsage: usagePercentages.scoringUsage,
        });
        playmakingUsageRankings.push({
          playerId: player.playerId,
          name: player.name,
          playmakingUsage: usagePercentages.playmakingUsage,
        });
        reboundingUsageRankings.push({
          playerId: player.playerId,
          name: player.name,
          reboundingUsage: usagePercentages.reboundingUsage,
        });

        teamData.push(playerData);
      }

      scoringUsageRankings = calculations.usageRankings(
        scoringUsageRankings,
        usageType.SCORING
      );

      playmakingUsageRankings = calculations.usageRankings(
        playmakingUsageRankings,
        usageType.PLAYMAKING
      );

      reboundingUsageRankings = calculations.usageRankings(
        reboundingUsageRankings,
        usageType.REBOUNDING
      );

      gamelog.old = team.gamelog;

      if (gamelog.old.length != 0) {
        gamelog.old = gamelog.old.map((game) => {
          return {
            gameId: game.gameId,
            teamStats: game.teamStats,
            activePlayers: game.activePlayers,
            inactivePlayers: game.inactivePlayers.map((inactivePlayer) => {
              return {
                playerId: inactivePlayer.playerId,
                name: inactivePlayer.name,
                pos: inactivePlayer.pos,
                usageAverage: {
                  scoring: scoringUsageRankings
                    .filter((player) => {
                      return player.playerId == inactivePlayer.playerId;
                    })
                    .map((player) => {
                      return player.scoringUsage;
                    })[0],
                  playmaking: playmakingUsageRankings
                    .filter((player) => {
                      return player.playerId == inactivePlayer.playerId;
                    })
                    .map((player) => {
                      return player.playmakingUsage;
                    })[0],
                  rebounding: reboundingUsageRankings
                    .filter((player) => {
                      return player.playerId == inactivePlayer.playerId;
                    })
                    .map((player) => {
                      return player.reboundingUsage;
                    })[0],
                },
              };
            }),
            opponentId: game.opponentId,
            opponentStats: game.opponentStats,
          };
        });
      }

      //dnp filters players initially so if player is an inactive player, can't access dnp prop

      gamelog.new = sortedGames[team._id].map((game) => {
        return {
          gameId: game.team.gameId,
          teamStats: game.team.teamStats,
          activePlayers: game.team.activePlayers,
          inactivePlayers: roster
            .filter((rosterPlayer) => {
              return (
                game.team.activePlayers.filter((gamePlayer) => {
                  return gamePlayer.playerId == rosterPlayer.playerId;
                }).length == 0
              );
            })
            .map((inactivePlayer) => {
              return {
                playerId: inactivePlayer.playerId,
                name: inactivePlayer.name,
                pos: inactivePlayer.pos,
                usageAverage: {
                  scoring: scoringUsageRankings
                    .filter((player) => {
                      return player.playerId == inactivePlayer.playerId;
                    })
                    .map((player) => {
                      return player.scoringUsage;
                    })[0],
                  playmaking: playmakingUsageRankings
                    .filter((player) => {
                      return player.playerId == inactivePlayer.playerId;
                    })
                    .map((player) => {
                      return player.playmakingUsage;
                    })[0],
                  rebounding: reboundingUsageRankings
                    .filter((player) => {
                      return player.playerId == inactivePlayer.playerId;
                    })
                    .map((player) => {
                      return player.reboundingUsage;
                    })[0],
                },
              };
            }),
          opponentId: game.opponent.teamId,
          opponentStats: game.opponent.teamStats,
        };
      });
      gamelog.curr = gamelog.old.concat(gamelog.new);

      teamUpdate = misc.formatTeamUpdate(
        team._id,
        teamData,
        roster,
        teamGamesPlayed.curr,
        scoringUsageRankings,
        playmakingUsageRankings,
        reboundingUsageRankings,
        gamelog.curr
      );

      updates.push(teamUpdate);
    }
  }
  scheduleUpdate = misc.formatScheduleUpdate();

  await sendUpdates(client, teamsCollection, updates);
  await sendUpdates(client, scheduleCollection, scheduleUpdate);

  if (missingPlayers.length != 0) {
    missingPlayers = missingPlayers.map((player) => {
      return {
        _id: player.playerId,
        name: player.name,
        teamId: player.seasonalStats[0].teams[0].teamId,
        pos: player.pos,
        dateOfBirthUTC: "",
        daysOld: "",
        yearsPro: 0,
        country: "",
        prevSeason:
          player.seasonalStats[1] != undefined ? player.seasonalStats[1] : [],
        stats: {
          season: player.seasonalStats,
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
            deviation: {},
          },
        },
      };
    });

    const result = await client
      .db(database.NBAFANTASYLINEUP)
      .collection(playerCollection)
      .insertMany(missingPlayers);

    if (Object.keys(result.insertedIds).length == missingPlayers.length) {
      console.log(missingPlayers.length + " players created");
    } else {
      console.log("Error occcured during player creation");
    }
  }
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

async function toBeUpdated(
  client,
  db = database.NBAFANTASYLINEUP,
  collection = collections.SCHEDULE
) {
  var results = [];
  try {
    var currDate = misc.currentDate();

    results = await client
      .db(db)
      .collection(collection)
      .find({
        updateStatus: requests.updateStatus.NOTREADY,
        startDateEastern: { $lt: currDate },
      })
      // .limit(200)
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

async function updateGames(client, games, collection) {
  var game = {};
  var gameUpdate;
  var updates = [];

  for (let i = 0; i < games.length; i++) {
    game = misc.formatGame(games[i]);
    gameUpdate = misc.formatGameUpdate(game);
    updates.push(gameUpdate);
  }

  await sendUpdates(client, collection, updates);
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

async function createGames(
  client,
  games,
  db = database.NBAFANTASYLINEUP,
  collection = collections.SCHEDULE
) {
  var existingGames = await pullCollection(client, collections.SCHEDULE);
  var cleanedGames = [];
  var game = {};
  for (let i = 0; i < games.length; i++) {
    if (
      existingGames.filter((game) => {
        return game._id == games[i].gameId;
      }).length > 0
    ) {
      games.splice(i, 1);
      i--;
    } else {
      game = misc.formatGame(games[i]);
      cleanedGames.push(game);
    }
  }

  const result = await client
    .db(db)
    .collection(collection)
    .insertMany(cleanedGames);

  if (Object.keys(result.insertedIds).length == cleanedGames.length) {
    console.log(cleanedGames.length + " games created");
  } else {
    console.log("Error occcured during game creation");
  }
}

async function createTeams(
  client,
  teams,
  db = database.NBAFANTASYLINEUP,
  collection = collections.TEAMS
) {
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
      gamelog: [],
      roster: teams[i].roster,
    };

    cleanedTeams.push(team);
  }

  const result = await client
    .db(db)
    .collection(collection)
    .insertMany(cleanedTeams, options);

  if (Object.keys(result.insertedIds).length == cleanedTeams.length) {
    console.log(cleanedTeams.length + " teams created");
  } else {
    console.log("Error occcured during team creation");
  }
}

async function createPlayers(
  client,
  players,
  db = database.NBAFANTASYLINEUP,
  collection = collections.PLAYERS,
  model = false
) {
  var cleanedPlayers = [];

  for (let i = 0; i < players.length; i++) {
    if (model) {
      cleanedPlayers.push(misc.formatModelPlayer(players[i]));
    } else {
      cleanedPlayers.push(misc.formatPlayer(players[i]));
    }
  }

  const result = await client
    .db(db)
    .collection(collection)
    .insertMany(cleanedPlayers);

  if (Object.keys(result.insertedIds).length == cleanedPlayers.length) {
    console.log(cleanedPlayers.length + " players created");
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

async function removeCollection(client, db, collection, filter = {}) {
  await client.db(db).collection(collection).deleteMany(filter);
}
