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

async function gamesToBeUpdated() {
  const client = await mongoClient();

  try {
    await client.connect();

    var currDate = new Date();
    currDate.setHours(0, 0, 0, 0);
    var gameIds = [];

    const cursor = await client
      .db("nbaFantasyLineup")
      .collection("schedule")
      .find({ gameStatus: "pending", startDateEastern: { $lt: currDate } });
    const results = await cursor.toArray();

    results.forEach((result) => {
      gameIds.push(result._id);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
    return gameIds;
  }
}

async function main() {
  const client = await mongoClient();

  try {
    await client.connect();
    // await addGames(client, await requests.getSchedule());
    await addPlayers(client, await requests.getPlayers());
    // await updateGames(
    //   client,
    //   await requests.getUpdatedSchedule(await gamesToBeUpdated())
    // );
    // await addTeams(client, await requests.getTeams());
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

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
