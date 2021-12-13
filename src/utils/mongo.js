const { MongoClient } = require("mongodb");

async function main() {
  const config = require("../../config.json");

  const MONGO_CONNECTION_STRING = config.MONGO_CONNECTION_STRING;

  const uri =
    "mongodb+srv://adamvalenti:" +
    MONGO_CONNECTION_STRING +
    "@adam.ogm6r.mongodb.net/nbaFantasyLineup?retryWrites=true&w=majority";

  const client = new MongoClient(uri);

  try {
    await client.connect();
    await findPlayersByStatConstraint(client, {
      minimum: "2",
      stat: "yearsPro",
      maxPlayers: 5,
    });

    // await findPlayersByStatConstraint(client, {
    //   minimum: "2",
    //   stat: "yearsPro",
    //   maxPlayers: 5,
    // });

    // await createPlayer(client, {

    //   _id: "1629027",
    //   name: "Trae Young",
    //   teamId: "1610612737",
    //   jersey: "11",
    //   isActive: true,
    //   pos: "G",
    //   heightFeet: "6",
    //   heightInches: "1",
    //   weightPounds: "164",
    //   dateofBirthUTC: "199",
    //   yearsPro: "3",
    //   country: "USA",
    //   stats: {
    //     latest: {
    //       seasonYear: 2021,
    //       ppg: "26.5",
    //       rpg: "4.1",
    //       apg: "9.5",
    //       mpg: "34.4",
    //       topg: "4.1",
    //       spg: "1.0",
    //       bpg: "0.1",
    //       tpp: "38.6",
    //       ftp: "88.7",
    //       fgp: "45.2",
    //     },
    //     careerSummary: {},
    //     regularSeason: {},
    //   },
    // });
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

async function createPlayer(client, newPlayer) {
  const result = await client
    .db("nbaFantasyLineup")
    .collection("players")
    .insertOne(newPlayer);

  console.log("New player added with the following id: " + result.insertedId);
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

  console.log(result);

  if (result) {
    console.log(
      "Found a player in the collection with the name " + nameOfPlayer
    );
  } else {
    console.log("No player found with the name " + nameOfPlayer);
  }
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

    results.forEach((result, i) => {
      console.log(result.name + " | " + result[stat]);
    });
  }
}

async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();

  console.log("Databases:");
  databasesList.databases.forEach((db) => {
    console.log("- " + db.name);
  });
}
