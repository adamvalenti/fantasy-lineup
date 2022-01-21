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
    results = await cursor.toArray();
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
    return results;
  }
}

async function updateData() {
  var newGames = gamesToBeUpdated(await toBeUpdated());
}

//function to update teams roster

async function playersToBeUpdated(results) {
  //need to track missed games
  //need to track matchups for each game

  results.forEach((result) => {
    var weightedMatchupStats = {};

    result.hTeam.stats.player.forEach((player) => {
      weightedMatchupStats = calculations.matchupStats(
        result.vTeam.stats.player,
        player.matchups
      );

      if (players.hasOwnProperty(player.playerId)) {
        players[player.playerId].newGames.push({
          gameId: result.gameId,
          matchups: player.matchups,
          isHomeGame: true,
          playerStats: {
            pts: player[i].pts,
            ast: player[i].ast,
            drb: player[i].drb,
            orb: player[i].orb,
            stl: player[i].stl,
            blk: player[i].blk,
            tov: player[i].tov,
            fgm: player[i].fgm,
            fga: player[i].fga,
            tpm: player[i].tpm,
            tpa: player[i].tpa,
            ftm: player[i].ftm,
            fta: player[i].fta,
            mp: player[i].mp,
            pf: player[i].pf,
          },
          matchupStats: weightedMatchupStats,
          teamStats: result.hTeam.stats.team,
          oppStats: result.vTeam.stats.team,
        });
      } else {
        players[player.playerId] = {
          playerId: player.playerId,
          newGames: [
            {
              gameId: result.gameId,
              matchups: player.matchups,
              isHomeGame: true,
              playerStats: {
                pts: player[i].pts,
                ast: player[i].ast,
                drb: player[i].drb,
                orb: player[i].orb,
                stl: player[i].stl,
                blk: player[i].blk,
                tov: player[i].tov,
                fgm: player[i].fgm,
                fga: player[i].fga,
                tpm: player[i].tpm,
                tpa: player[i].tpa,
                ftm: player[i].ftm,
                fta: player[i].fta,
                mp: player[i].mp,
                pf: player[i].pf,
              },
              matchupStats: weightedMatchupStats,
              teamStats: result.hTeam.stats.team,
              oppStats: result.vTeam.stats.team,
            },
          ],
        };
      }
    });
    result.vTeam.stats.player.forEach((player) => {
      weightedMatchupStats = calculations.matchupStats(
        result.hTeam.stats.player,
        player.matchups
      );

      if (players.hasOwnProperty(player.playerId)) {
        players[player.playerId].newGames.push({
          gameId: result.gameId,
          matchups: player.matchups,
          isHomeGame: false,
          playerStats: {
            pts: player[i].pts,
            ast: player[i].ast,
            drb: player[i].drb,
            orb: player[i].orb,
            stl: player[i].stl,
            blk: player[i].blk,
            tov: player[i].tov,
            fgm: player[i].fgm,
            fga: player[i].fga,
            tpm: player[i].tpm,
            tpa: player[i].tpa,
            ftm: player[i].ftm,
            fta: player[i].fta,
            mp: player[i].mp,
            pf: player[i].pf,
          },
          matchupStats: weightedMatchupStats,
          teamStats: result.vTeam.stats.team,
          oppStats: result.hTeam.stats.team,
        });
      } else {
        players[player.playerId] = {
          playerId: player.playerId,
          newGames: [
            {
              gameId: result.gameId,
              matchups: player.matchups,
              isHomeGame: false,
              playerStats: {
                pts: player[i].pts,
                ast: player[i].ast,
                drb: player[i].drb,
                orb: player[i].orb,
                stl: player[i].stl,
                blk: player[i].blk,
                tov: player[i].tov,
                fgm: player[i].fgm,
                fga: player[i].fga,
                tpm: player[i].tpm,
                tpa: player[i].tpa,
                ftm: player[i].ftm,
                fta: player[i].fta,
                mp: player[i].mp,
                pf: player[i].pf,
              },
              matchupStats: weightedMatchupStats,
              teamStats: result.vTeam.stats.team,
              oppStats: result.hTeam.stats.team,
            },
          ],
        };
      }
    });
  });
  return players;
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

async function main() {
  const client = await mongoClient();

  try {
    await client.connect();
    await addGames(client, await requests.getSchedule());
    // await updatePlayers(await playersWithBirthdays());
    // await addPlayers(client, await requests.getPlayers());
    await updateGames(
      client,
      await requests.getUpdatedSchedule(await gamesToBeUpdated())
    );
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

    for (const playerId in playersWithNewGame) {
      await updatePlayer(playersWithNewGame[playerId]);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

// finish update player function (queue of games)

async function updatePlayer(player) {
  /*
  recent = {
    games: [
      gameId: "",
      matchupIds: ["","","",""],
      playerStats{
        ppg: 0,
        rpg: 0,
        apg: 0,
        spg: 0,
        bpg: 0,
        tpg: 0,
        mpg: 0,
        tpp: 0,
        ftp: 0,
        fgp: 0,
        pts: 0,
        ast: 0,
        blk: 0,
        tov: 0,
        orb: 0,
        drb: 0,
        reb: 0,
        fgm: 0,
        fga: 0,
        tpm: 0,
        tpa: 0,
        ftm: 0,
        fta: 0,
        pf: 0,
        gp: 0,
        gs: 0,
        pm: 0,
        min: 0,
        dd2: 0,
        td3: 0,
      }
      matchupStats: {

      }
      oppStats: {

      }
      teamStats: {

      }
    ],
    last3: {
      ppg: 0,
      rpg: 0,
      apg: 0,
      spg: 0,
      bpg: 0,
      tpg: 0,
      mpg: 0,
      tpp: 0,
      ftp: 0,
      fgp: 0,
      pts: 0,
      ast: 0,
      blk: 0,
      tov: 0,
      orb: 0,
      drb: 0,
      reb: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      pf: 0,
      gp: 0,
      gs: 0,
      pm: 0,
      min: 0,
      dd2: 0,
      td3: 0,
    },
    last5: {},
    last7: {},
    last10: {},
  }
  */

  const query = { _id: player.playerId };
  var recentGames = [];
  var newRecent = {};

  const result = await client
    .db("nbaFantasyLineup")
    .collection("players")
    .findOne({ _id: query });

  recentGames = result.stats.recent.games;
  recentGames.splice(
    recentGames.length - player.newGames.length,
    player.newGames.length
  );
  recentGames.push(newGames);

  // Calculate averages and advanced stats at this point.  Update database

  lastNStats = calculations.lastNStats(recentGames);

  newRecent = {
    games: recentGames,
    last3: last3Stats,
    last5: last3Stats,
    last7: last3Stats,
    last10: last3Stats,
  };

  const update = {
    $set: { gameStatus: game.gameStatus, hTeam: game.hTeam, vTeam: game.vTeam },
  };

  await client
    .db("nbaFantasyLineup")
    .collection("schedule")
    .updateOne(query, update);
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
