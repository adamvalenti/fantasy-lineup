const requests = require("./apiRequests.js");
const misc = require("./misc.js");
const calculations = require("./calculations.js");
const { MongoClient } = require("mongodb");
const config = require("../../config.json");

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
    // await addGames(client, await requests.getSchedule());
    // console.log("Games Added");
    await addPlayers(client, await requests.getPlayers());
    console.log("Players Added");
    var games = await requests.getUpdatedSchedule(
      gamesToBeUpdated(await toBeUpdated())
    );

    console.log("Schedule Retrieved");
    await updatePlayers(
      await playersWithBirthdays(),
      await playersToBeUpdated(games)
    );

    console.log("Players Updated");
    await updateGames(client, games);
    console.log("Games Updated");
    // await addTeams(client, await requests.getTeams());
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

async function toBeUpdated() {
  const client = await mongoClient();
  var results = [];
  try {
    await client.connect();

    var currDate = misc.currentDate();

    const cursor = await client
      .db("nbaFantasyLineup")
      .collection("schedule")
      .find({ gameStatus: "pending", startDateEastern: { $lt: currDate } });
    // .find({ _id: "0012100012" });
    results = await cursor.toArray();
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
    return results;
  }
}

async function playersToBeUpdated(games) {
  var players = {};

  //add players from each game to players object
  games.forEach((game) => {
    //add home team players to players object
    sortPlayers(
      players,
      game.hTeam.stats,
      game.vTeam.stats,
      game.gameId,
      game.startDateEastern,
      true
    );

    //add visiting team players to players object
    sortPlayers(
      players,
      game.vTeam.stats,
      game.hTeam.stats,
      game.gameId,
      game.startDateEastern,
      game.isNeutralVenue
    );
  });

  return players;
}

function sortPlayers(players, team, opponent, gameId, gameDate, isHomeTeam) {
  var matchupStats = {};

  team.player.forEach((player) => {
    player.matchup == null
      ? (matchupStats = null)
      : (matchupStats = calculations.matchupStats(
          opponent.player,
          player.matchup
        ));

    if (players.hasOwnProperty(player.playerId)) {
      if (player.dnp == "") {
        players[player.playerId].playedGames.push({
          gameId: gameId,
          isHomeGame: isHomeTeam,
          stats: {
            player: {
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
            matchup: matchupStats,
            team: team.team,
            opponent: opponent.team,
          },
        });
      } else {
        players[player.playerId].missedGames.push({
          gameId: gameId,
          gameDate: gameDate,
          isHomeGame: isHomeTeam,
          reason: player.dnp,
        });
      }
    } else {
      if (player.dnp == "") {
        players[player.playerId] = {
          playerId: player.playerId,
          missedGames: [],
          playedGames: [
            {
              gameId: gameId,
              gameDate: gameDate,
              isHomeGame: isHomeTeam,
              stats: {
                player: {
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
                matchup: matchupStats,
                team: team.team,
                opponent: opponent.team,
              },
            },
          ],
        };
      } else {
        players[player.playerId] = {
          playerId: player.playerId,
          missedGames: [
            {
              gameId: gameId,
              gameDate: gameDate,
              isHomeGame: isHomeTeam,
              reason: player.dnp,
            },
          ],
          playedGames: [],
        };
      }
    }
  });
  return;
}

function gamesToBeUpdated(results) {
  var games = [];
  var game = {};

  results.forEach((result) => {
    game = {
      gameId: result._id,
    };
    games.push(game);
  });

  return games;
}

async function updateData() {
  var newGames = gamesToBeUpdated(await toBeUpdated());
}

async function addGames(client, games) {
  var cleanedGames = [];
  var game = {};
  for (let i = 0; i < games.length; i++) {
    game = misc.formatGame(games[i]);
    cleanedGames.push(game);
  }

  await client
    .db("nbaFantasyLineup")
    .collection("schedule")
    .insertMany(cleanedGames);
}

async function updateGames(client, games) {
  var game = {};
  for (let i = 0; i < games.length; i++) {
    game = misc.formatGame(games[i]);
    await updateGame(client, game);
  }
}

async function updateGame(client, game) {
  const query = { _id: game._id };
  const update = {
    $set: { gameStatus: game.gameStatus, hTeam: game.hTeam, vTeam: game.vTeam },
  };

  await client
    .db("nbaFantasyLineup")
    .collection("schedule")
    .updateOne(query, update);
}

async function addTeams(client, teams) {
  var cleanedTeams = [];
  var team = {};
  for (let i = 0; i < teams.length; i++) {
    team = {
      _id: teams[i].teamId,
      city: teams[i].city,
      fullName: teams[i].fullName,
      isNBAFranchise: teams[i].isNBAFranchise,
      confName: teams[i].confName,
      tricode: teams[i].tricode,
      divName: teams[i].divName,
      nickname: teams[i].nickname,
      urlName: teams[i].urlName,
    };

    cleanedTeams.push(team);
  }

  await client
    .db("nbaFantasyLineup")
    .collection("teams")
    .insertMany(cleanedTeams);
}

async function addPlayers(client, players) {
  var cleanedPlayers = [];

  for (let i = 0; i < players.length; i++) {
    cleanedPlayers.push(misc.formatPlayer(players[i]));
  }

  await client
    .db("nbaFantasyLineup")
    .collection("players")
    .insertMany(cleanedPlayers);
}

async function playersWithBirthdays() {
  const client = await mongoClient();

  try {
    await client.connect();

    var playerIds = [];

    const cursor = await client
      .db("nbaFantasyLineup")
      .collection("players")
      .find();
    const results = await cursor.toArray();

    results.forEach((result) => {
      if (result.age != misc.playerAge(result.dateOfBirthUTC)) {
        players.push(result._id);
      }
    });
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
    return playerIds;
  }
}

async function updatePlayers(playersWithBirthday, playersWithNewGame) {
  const client = await mongoClient();

  try {
    await client.connect();

    await client
      .db("nbaFantasyLineup")
      .collection("players")
      .updateMany({ _id: { $in: playersWithBirthday } }, { $inc: { age: 1 } });

    for (var playerId in playersWithNewGame) {
      await updatePlayer(client, playersWithNewGame[playerId]);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

async function updatePlayer(client, player) {
  const maxGames = 10;
  const query = { _id: player.playerId };
  var seasonAverages = {};
  var recentPlayedGames = [];
  var recentMissedGames = [];
  var newRecent = {};

  // add function that updates player seasonal stats season averages should only update season[0] once 10 games has been played by the player, otherwise reference previous season averages

  const result = await client
    .db("nbaFantasyLineup")
    .collection("players")
    .findOne(query);

  if (result != null) {
    seasonAverages = result.stats.season[0];
    recentPlayedGames = result.stats.recent.playedGames;
    recentMissedGames = result.stats.recent.missedGames;

    //matchupSeasonAverages

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

    //change "type" to enumeration
    newRecent = {
      playedGames: recentPlayedGames,
      missedGames: recentMissedGames,
      differential: {
        last3: calculations.lastNDifferential(
          recentPlayedGames,
          seasonAverages,
          3
        ),
        last5: calculations.lastNDifferential(
          recentPlayedGames,
          seasonAverages,
          5
        ),
        last7: calculations.lastNDifferential(
          recentPlayedGames,
          seasonAverages,
          7
        ),
        last10: calculations.lastNDifferential(
          recentPlayedGames,
          seasonAverages,
          10
        ),
      },
      advanced: {
        last3: calculations.advancedPlayerStats(
          calculations.lastNAverages(recentPlayedGames, "player", 3),
          calculations.lastNAverages(recentPlayedGames, "team", 3),
          calculations.lastNAverages(recentPlayedGames, "opponent", 3)
        ),
        last5: calculations.advancedPlayerStats(
          calculations.lastNAverages(recentPlayedGames, "player", 5),
          calculations.lastNAverages(recentPlayedGames, "team", 5),
          calculations.lastNAverages(recentPlayedGames, "opponent", 5)
        ),
        last7: calculations.advancedPlayerStats(
          calculations.lastNAverages(recentPlayedGames, "player", 7),
          calculations.lastNAverages(recentPlayedGames, "team", 7),
          calculations.lastNAverages(recentPlayedGames, "opponent", 7)
        ),
        last10: calculations.advancedPlayerStats(
          calculations.lastNAverages(recentPlayedGames, "player", 10),
          calculations.lastNAverages(recentPlayedGames, "team", 10),
          calculations.lastNAverages(recentPlayedGames, "opponent", 10)
        ),
      },
    };

    const update = {
      $set: { "stats.recent": newRecent },
    };

    await client
      .db("nbaFantasyLineup")
      .collection("players")
      .updateOne(query, update);
  }
}

async function createPlayers(client, newPlayers) {
  const result = await client
    .db("nbaFantasyLineup")
    .collection("players")
    .insertMany(newPlayers);

  console.log(
    result.insertedCount +
      "new players added with the following id(s): " +
      result.insertedIds
  );
}

async function findPlayerByName(client, nameOfPlayer) {
  const result = await client
    .db("nbaFantasyLineup")
    .collection("players")
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
    .db("nbaFantasyLineup")
    .collection("players")
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
    .db("nbaFantasyLineup")
    .collection("players")
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
