import {
  cleanPlayers,
  cleanScheduleUpdates,
  cleanSchedule,
  cleanTeams,
} from "./processing.js";

import {
  updateStatus,
  statType,
  positions,
  database,
  collection,
} from "./constants.js";

import { getSeasonYear } from "./apiRequests.js";

import {
  calcPlayerDeviations,
  calcPlayerDifferentials,
  calcPlayerAverages,
  calcPlayerAdvanced,
  calcNewSeasonAverages,
  calcNewAverages,
  calcUsagePercentages,
  calcMissingRoster,
  calcEstimatedMatchupStats,
} from "./calculations.js";

import {
  playerAge,
  currentDate,
  displayCurrentTime,
  updateQueue,
  formatTeamUpdate,
  formatScheduleUpdate,
  formatMissingPlayers,
  assignNewPlayerGameStats,
  assignNewAverages,
  filterGames,
  sortGamesByTeam,
  updateGamelog,
} from "./helpers.js";
import dotenv from "dotenv";

import { MongoClient } from "mongodb";

// import config from "../config.json" assert { type: "json" };

function mongoClient(db = database.CURRENT) {
  dotenv.config({ path: "../.env" });

  const uri = process.env.CURRENT_DATABASE_URL;

  const client = new MongoClient(uri);

  return client;
}

//function to update teams roster

async function getModelData() {
  var currYear = await getSeasonYear();
  for (let seasonYear = 2020; seasonYear < currYear; seasonYear++) {
    try {
      await getData(seasonYear);
    } catch (error) {
      console.error(error);
    }
  }
}

async function getData(seasonYear) {
  const client = mongoClient();

  displayCurrentTime();
  try {
    await client.connect();

    await removeCollection(
      client,
      database.CURRENT,
      collection.CURRENT.PLAYERS
    );

    await removeCollection(
      client,
      database.CURRENT,
      collection.CURRENT.SCHEDULE
    );

    await removeCollection(client, database.CURRENT, collection.CURRENT.TEAMS);

    await createPlayers(
      client,
      await cleanPlayers(seasonYear),
      database.CURRENT,
      collection.CURRENT.PLAYERS
    );

    const players = await pullCollection(
      client,
      database.CURRENT,
      collection.CURRENT.PLAYERS
    );

    var games = await cleanSchedule(
      seasonYear,
      await pullCollection(
        client,
        database.CURRENT,
        collection.CURRENT.SCHEDULE
      )
    );

    await createGames(
      client,
      games,
      database.CURRENT,
      collection.CURRENT.SCHEDULE
    );

    await createTeams(
      client,
      await cleanTeams(players, seasonYear),
      database.CURRENT,
      collection.CURRENT.TEAMS
    );

    displayCurrentTime();

    await sendUpdates(
      client,
      database.CURRENT,
      collection.CURRENT.SCHEDULE,
      await cleanScheduleUpdates(
        gamesToBeUpdated(
          await toBeUpdated(
            client,
            database.CURRENT,
            collection.CURRENT.SCHEDULE
          )
        ),
        players,
        seasonYear
      )
    );

    displayCurrentTime();
    await addGamesToTeams(
      client,
      database.CURRENT,
      collection.CURRENT.SCHEDULE,
      collection.CURRENT.TEAMS,
      collection.CURRENT.PLAYERS,
      seasonYear
    );
  } catch (error) {
    console.error(error);
  } finally {
    displayCurrentTime();
    await client.close();
  }
}

async function main() {
  await getData(await getSeasonYear());
}

main().catch(console.error);

async function pullCollection(client, db, collection, filter = {}) {
  var items = await client.db(db).collection(collection).find(filter).toArray();
  return items;
}

async function updateLeagueAverages(client, db, teamsCollection, seasonYear) {
  var playerAverages = {};
}

async function addGamesToTeams(
  client,
  db,
  scheduleCollection,
  teamsCollection,
  playersCollection,
  seasonYear
) {
  var filter = {
    updateStatus: updateStatus.PENDING,
    seasonStageId: 2,
  };
  var playedGames = await pullCollection(
    client,
    db,
    scheduleCollection,
    filter
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
  var matchupAverages = {
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
  var teamGameStats = {
    new: [],
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

  var teams = await pullCollection(client, db, teamsCollection);

  for (let i = 0; i < teams.length; i++) {
    team = teams[i];
    var playerData = {};
    var teamData = [];
    var teamUpdate;
    var scheduleUpdate;
    var usageRankings = {
      scoring: [],
      playmaking: [],
      rebounding: [],
    };

    if (sortedGames.hasOwnProperty(team._id)) {
      roster = team.roster;
      missingRoster = await calcMissingRoster(
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
              return gamePlayer.playerId === player.playerId;
            }).length > 0
          );
        });

        playerGamesPlayed.new = newPlayerGames.length;

        if (playerGamesPlayed.new > 0) {
          assignNewPlayerGameStats(
            player,
            newPlayerGames,
            playerGamesPlayed,
            matchupGamesPlayed,
            playerGameStats,
            matchupGameStats,
            teamGameStats
          );

          teamAverages.new = calcNewAverages(teamGameStats.new);
          playerTeamAverages.new = calcNewAverages(playerGameStats.new);

          assignNewAverages(
            matchupGamesPlayed,
            matchupAverages,
            matchupGameStats
          );
          assignNewAverages(playerGamesPlayed, teamAverages, teamGameStats);
          assignNewAverages(
            playerGamesPlayed,
            playerTeamAverages,
            playerGameStats
          );

          usagePercentages = calcUsagePercentages(
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
            games: playerGameStats.old,
            averages: playerTeamAverages.old,
            teamAverages: teamAverages.old,
            matchupGames: matchupGameStats.old,
            matchupAverages: matchupAverages.old,
            gp: playerGamesPlayed.old,
            gm: teamGamesPlayed.curr - playerGamesPlayed.old,
          };
        }

        usageRankings.scoring.push({
          playerId: player.playerId,
          name: player.name,
          scoringUsage: usagePercentages.scoringUsage,
        });
        usageRankings.playmaking.push({
          playerId: player.playerId,
          name: player.name,
          playmakingUsage: usagePercentages.playmakingUsage,
        });
        usageRankings.rebounding.push({
          playerId: player.playerId,
          name: player.name,
          reboundingUsage: usagePercentages.reboundingUsage,
        });

        teamData.push(playerData);
      }

      gamelog.old = team.gamelog;

      updateGamelog(usageRankings, gamelog, sortedGames, team, roster);

      var teamStats = gamelog.curr.map((game) => {
        return game.teamStats;
      });

      var overallTeamAverages = calcNewAverages(teamStats);

      teamUpdate = formatTeamUpdate(
        team._id,
        teamData,
        roster,
        teamGamesPlayed.curr,
        usageRankings,
        gamelog.curr,
        overallTeamAverages
      );

      updates.push(teamUpdate);
    }
  }

  scheduleUpdate = formatScheduleUpdate();

  await sendUpdates(client, db, teamsCollection, updates);
  await sendUpdates(client, db, scheduleCollection, scheduleUpdate);

  missingPlayers = formatMissingPlayers(missingPlayers);

  await createPlayers(client, missingPlayers, db, playersCollection);
}

async function rawTrainData(seasonYear) {
  const client = mongoClient();
  var rawTrainData = {};
  try {
    await client.connect();
    rawTrainData.teams = await pullCollection(
      client,
      database.HISTORICAL,
      collection.HISTORICAL[seasonYear].TEAMS
    );
    rawTrainData.players = await pullCollection(
      client,
      database.HISTORICAL,
      collection.HISTORICAL[seasonYear].PLAYERS
    );
  } catch (error) {
    console.err(error);
  } finally {
    await client.close();
    return rawTrainData;
  }
}

async function removeCollections(client) {
  // await removeCollection(client);
  // await removeSchedule(client);
  // await removeTeams(client);
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
      name: positions.GUARD,
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "2",
      name: positions.GUARDFORWARD,
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "3",
      name: positions.FORWARDGUARD,
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "4",
      name: positions.FORWARD,
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "5",
      name: positions.FORWARDCENTER,
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "6",
      name: positions.CENTERFORWARD,
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "7",
      name: positions.CENTER,
      averages: {},
      deviation: {},
      sampleSize: {},
    },
    {
      _id: "8",
      name: "Minutes Criteria",
      averages: {},
      deviation: {},
      sampleSize: {},
    },
  ];

  await client
    .db(database.CURRENT)
    .collection(collection.CURRENT.LEAGUE)
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
    .db(database.CURRENT)
    .collection(collection.CURRENT.PLAYERS)
    .find();

  const results = await cursor.toArray();

  results.forEach((result) => {
    if (result.stats.season[0] !== null) {
      player = {
        playerId: result._id,
        name: result.name,
        pos: result.pos,
      };

      players.all[result._id].firstGame = gamesPlayed.all.length;
      players.all[result._id] = player;
      gamesPlayed.all.push(result.stats.recent.playedGames);
      gamesPlayed.all.push(result);

      if (result.pos === positions.GUARD) {
        players.guards[result._id] = player;
      } else if (result.pos === positions.FORWARD) {
        players.forwards[result._id] = player;
      } else if (result.pos === positions.CENTER) {
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
}

async function toBeUpdated(
  client,
  db = database.CURRENT,
  collection = collection.CURRENT.SCHEDULE
) {
  var results = [];
  try {
    var currDate = currentDate();

    results = await client
      .db(db)
      .collection(collection)
      .find({
        updateStatus: updateStatus.NOTREADY,
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
    player.matchup === null
      ? (matchupStats = {})
      : (matchupStats = calcEstimatedMatchupStats(
          opponent.stats.player,
          player.matchup
        ));

    if (teams.hasOwnProperty(team.teamId)) {
      if (teams[team.teamId].games.hasOwnProperty(gameId)) {
        teams[team.teamId].games[gameId].players[player.playerId] = {
          playerId: player.playerId,
          playedGame: player.mp !== 0,
          playerStatus: player.dnp,
          playerStats:
            player.mp !== 0
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
            playedGame: player.mp !== 0,
            playerStatus: player.dnp,
            playerStats:
              player.mp !== 0
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
              playedGame: player.mp !== 0,
              playerStatus: player.dnp,
              playerStats:
                player.mp !== 0
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

async function sendUpdates(client, db, collection, updates) {
  const bulkWriteResult = await client
    .db(db)
    .collection(collection)
    .bulkWrite(updates);

  if (bulkWriteResult.result.ok === 1) {
    console.log(bulkWriteResult.modifiedCount + " updates were made");
  }
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
    .db(database.CURRENT)
    .collection(collection.CURRENT.SCHEDULE)
    .updateOne(query, update);
}

async function createGames(
  client,
  games,
  db = database.CURRENT,
  collection = collection.CURRENT.SCHEDULE
) {
  const result = await client.db(db).collection(collection).insertMany(games);

  if (Object.keys(result.insertedIds).length === games.length) {
    console.log(games.length + " games created");
  } else {
    console.log("Error occcured during game creation");
  }
}

async function createTeams(
  client,
  teams,
  db = database.CURRENT,
  collection = collection.CURRENT.TEAMS
) {
  const options = { ordered: true };

  const result = await client
    .db(db)
    .collection(collection)
    .insertMany(teams, options);

  if (Object.keys(result.insertedIds).length === teams.length) {
    console.log(teams.length + " teams created");
  } else {
    console.log("Error occcured during team creation");
  }
}

async function createPlayers(
  client,
  players,
  db = database.CURRENT,
  collection = collection.CURRENT.PLAYERS
) {
  if (players.length !== 0) {
    const result = await client
      .db(db)
      .collection(collection)
      .insertMany(players);

    if (Object.keys(result.insertedIds).length === players.length) {
      console.log(players.length + " players created");
    } else {
      console.log("Error occcured during player creation");
    }
  }
}

async function playersWithBirthdays(client) {
  try {
    var playerIds = [];

    const cursor = await client
      .db(database.CURRENT)
      .collection(collection.CURRENT.PLAYERS)
      .find();
    const results = await cursor.toArray();

    results.forEach((result) => {
      if (result.age !== playerAge(result.dateOfBirthUTC)) {
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
      .db(database.CURRENT)
      .collection(collection.CURRENT.PLAYERS)
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

    // for (var teamId in teamsWithNewGame) {
    //   await updateTeam(client, teamsWithNewGame[teamId]);
    // }
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
    .db(database.CURRENT)
    .collection(collection.CURRENT.PLAYERS)
    .findOne(query);

  if (result !== null) {
    seasonAverages = result.stats.season;
    currSeason = seasonAverages[0];
    prevSeason = seasonAverages[1];

    recentPlayedGames = result.stats.recent.playedGames;
    recentMissedGames = result.stats.recent.missedGames;

    //matchupSeasonAverages

    // updatedSeasonAveraged.  Need to update team specific data
    // store season averages prior to lastNstats (season averages neglecting lastN games)

    recentPlayedGames = updateQueue(
      recentPlayedGames,
      player.playedGames,
      maxGames
    );
    recentMissedGames = updateQueue(
      recentMissedGames,
      player.missedGames,
      maxGames
    );

    newSeasonAverages = calcNewSeasonAverages(recentPlayedGames, currSeason);

    differential = calcPlayerDifferentials(
      recentPlayedGames,
      newSeasonAverages
    );

    averages = calcPlayerAverages(
      recentPlayedGames,
      statType.PLAYER,
      statType.TEAM,
      statType.OPPONENT
    );

    advanced = calcPlayerAdvanced(averages);

    deviation = calcPlayerDeviations(
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
      .db(database.CURRENT)
      .collection(collection.CURRENT.PLAYERS)
      .updateOne(query, update);
  }
}

async function findPlayerByName(client, nameOfPlayer) {
  const result = await client
    .db(database.CURRENT)
    .collection(collection.CURRENT.PLAYERS)
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
    .db(database.CURRENT)
    .collection(collection.CURRENT.PLAYERS)
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
    .db(database.CURRENT)
    .collection(collection.CURRENT.PLAYERS)
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

async function removeCollection(client, db, collection, filter = {}) {
  await client.db(db).collection(collection).deleteMany(filter);
}

export { rawTrainData, findPlayerByName, mongoClient };
