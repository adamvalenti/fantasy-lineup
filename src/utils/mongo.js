const { getData } = require("./getData.js");
const { MongoClient } = require("mongodb");
const config = require("../../config.json");

async function main() {
  const MONGO_CONNECTION_STRING = config.MONGO_CONNECTION_STRING;

  const uri =
    "mongodb+srv://adamvalenti:" +
    MONGO_CONNECTION_STRING +
    "@adam.ogm6r.mongodb.net/nbaFantasyLineup?retryWrites=true&w=majority";

  const client = new MongoClient(uri);

  try {
    await client.connect();
    // await createPlayer(client, await getData("203952"));
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

async function createPlayer(client, playerData) {
  var seasonsPlayed = [];

  for (let i = 0; i < playerData.regularSeason.season.length; i++) {
    var currSeason = playerData.regularSeason.season[i];
    var teamsPlayed = [];

    for (let j = 0; j < currSeason.teams.length; j++) {
      var currTeam = currSeason.teams[j];

      var team = {
        teamId: parseInt([currTeam].assists),
        ppg: parseFloat([currTeam].ppg),
        rpg: parseFloat([currTeam].rpg),
        apg: parseFloat([currTeam].apg),
        spg: parseFloat([currTeam].spg),
        bpg: parseFloat([currTeam].bpg),
        topg: parseFloat([currTeam].topg),
        mpg: parseFloat([currTeam].mpg),
        tpp: parseFloat([currTeam].tpp),
        ftp: parseFloat([currTeam].ftp),
        fgp: parseFloat([currTeam].fgp),
        points: parseInt([currTeam].points),
        assists: parseInt([currTeam].assists),
        blocks: parseInt([currTeam].blocks),
        steals: parseInt([currTeam].steals),
        turnovers: parseInt([currTeam].turnovers),
        offReb: parseInt([currTeam].offReb),
        defReb: parseInt([currTeam].defReb),
        totReb: parseInt([currTeam].totReb),
        fgm: parseInt([currTeam].fgm),
        fga: parseInt([currTeam].fga),
        tpm: parseInt([currTeam].tpm),
        tpa: parseInt([currTeam].tpa),
        ftm: parseInt([currTeam].ftm),
        fta: parseInt([currTeam].fta),
        pFouls: parseInt([currTeam].pFouls),
        gamesPlayed: parseInt([currTeam].gamesPlayed),
        gamesStarted: parseInt([currTeam].gamesStarted),
        plusMinus: parseInt([currTeam].plusMinus),
        min: parseInt([currTeam].min),
        dd2: parseInt([currTeam].dd2),
        td3: parseInt([currTeam].td3),
      };

      teamsPlayed.push(team);
    }
    var season = {
      seasonYear: [currSeason].seasonYear,
      teams: teamsPlayed,
      ppg: parseFloat([currSeason].ppg),
      rpg: parseFloat([currSeason].rpg),
      apg: parseFloat([currSeason].apg),
      spg: parseFloat([currSeason].spg),
      bpg: parseFloat([currSeason].bpg),
      topg: parseFloat([currSeason].topg),
      mpg: parseFloat([currSeason].mpg),
      tpp: parseFloat([currSeason].tpp),
      ftp: parseFloat([currSeason].ftp),
      fgp: parseFloat([currSeason].fgp),
      points: parseInt([currSeason].points),
      assists: parseInt([currSeason].assists),
      blocks: parseInt([currSeason].blocks),
      steals: parseInt([currSeason].steals),
      turnovers: parseInt([currSeason].turnovers),
      offReb: parseInt([currSeason].offReb),
      defReb: parseInt([currSeason].defReb),
      totReb: parseInt([currSeason].totReb),
      fgm: parseInt([currSeason].fgm),
      fga: parseInt([currSeason].fga),
      tpm: parseInt([currSeason].tpm),
      tpa: parseInt([currSeason].tpa),
      ftm: parseInt([currSeason].ftm),
      fta: parseInt([currSeason].fta),
      pFouls: parseInt([currSeason].pFouls),
      gamesPlayed: parseInt([currSeason].gamesPlayed),
      gamesStarted: parseInt([currSeason].gamesStarted),
      plusMinus: parseInt([currSeason].plusMinus),
      min: parseInt([currSeason].min),
      dd2: parseInt([currSeason].dd2),
      td3: parseInt([currSeason].td3),
    };

    seasonsPlayed.push(season);
  }

  var player = {
    _id: parseInt(playerData.personId),
    name: playerData.firstName + " " + playerData.lastName,
    teamId: parseInt(playerData.teamId),
    jersey: parseInt(playerData.jersey),
    heightFeet: parseInt(playerData.heightFeet),
    heightInches: parseInt(playerData.heightInches),
    weightPounds: parseInt(playerData.weightPounds),
    dateOfBirthUTC: playerData.dateOfBirthUTC,
    yearsPro: parseInt(playerData.yearsPro),
    country: playerData.country,
    stats: {
      latest: {
        seasonYear: playerData.latest.seasonYear,
        seasonStageId: playerData.latest.seasonStageId,
        ppg: parseFloat(playerData.latest.ppg),
        rpg: parseFloat(playerData.latest.rpg),
        apg: parseFloat(playerData.latest.apg),
        spg: parseFloat(playerData.latest.spg),
        bpg: parseFloat(playerData.latest.bpg),
        topg: parseFloat(playerData.latest.topg),
        mpg: parseFloat(playerData.latest.mpg),
        tpp: parseFloat(playerData.latest.tpp),
        ftp: parseFloat(playerData.latest.ftp),
        fgp: parseFloat(playerData.latest.fgp),
        points: parseInt(playerData.latest.points),
        assists: parseInt(playerData.latest.assists),
        blocks: parseInt(playerData.latest.blocks),
        steals: parseInt(playerData.latest.steals),
        turnovers: parseInt(playerData.latest.turnovers),
        offReb: parseInt(playerData.latest.offReb),
        defReb: parseInt(playerData.latest.defReb),
        totReb: parseInt(playerData.latest.totReb),
        fgm: parseInt(playerData.latest.fgm),
        fga: parseInt(playerData.latest.fga),
        tpm: parseInt(playerData.latest.tpm),
        tpa: parseInt(playerData.latest.tpa),
        ftm: parseInt(playerData.latest.ftm),
        fta: parseInt(playerData.latest.fta),
        pFouls: parseInt(playerData.latest.pFouls),
        gamesPlayed: parseInt(playerData.latest.gamesPlayed),
        gamesStarted: parseInt(playerData.latest.gamesStarted),
        plusMinus: parseInt(playerData.latest.plusMinus),
        min: parseInt(playerData.latest.min),
        dd2: parseInt(playerData.latest.dd2),
        td3: parseInt(playerData.latest.td3),
      },
      careerSummary: {
        ppg: parseFloat(playerData.careerSummary.ppg),
        rpg: parseFloat(playerData.careerSummary.rpg),
        apg: parseFloat(playerData.careerSummary.apg),
        spg: parseFloat(playerData.careerSummary.spg),
        bpg: parseFloat(playerData.careerSummary.bpg),
        mpg: parseFloat(playerData.careerSummary.mpg),
        tpp: parseFloat(playerData.careerSummary.tpp),
        ftp: parseFloat(playerData.careerSummary.ftp),
        fgp: parseFloat(playerData.careerSummary.fgp),
        points: parseInt(playerData.careerSummary.points),
        assists: parseInt(playerData.careerSummary.assists),
        blocks: parseInt(playerData.careerSummary.blocks),
        steals: parseInt(playerData.careerSummary.steals),
        turnovers: parseInt(playerData.careerSummary.turnovers),
        offReb: parseInt(playerData.careerSummary.offReb),
        defReb: parseInt(playerData.careerSummary.defReb),
        totReb: parseInt(playerData.careerSummary.totReb),
        fgm: parseInt(playerData.careerSummary.fgm),
        fga: parseInt(playerData.careerSummary.fga),
        tpm: parseInt(playerData.careerSummary.tpm),
        tpa: parseInt(playerData.careerSummary.tpa),
        ftm: parseInt(playerData.careerSummary.ftm),
        fta: parseInt(playerData.careerSummary.fta),
        pFouls: parseInt(playerData.careerSummary.pFouls),
        gamesPlayed: parseInt(playerData.careerSummary.gamesPlayed),
        gamesStarted: parseInt(playerData.careerSummary.gamesStarted),
        plusMinus: parseInt(playerData.careerSummary.plusMinus),
        min: parseInt(playerData.careerSummary.min),
        dd2: parseInt(playerData.careerSummary.dd2),
        td3: parseInt(playerData.careerSummary.td3),
      },
      regularSeason: {
        season: seasonsPlayed,
      },
    },
  };

  await client
    .db("nbaFantasyLineup")
    .collection("players")
    .insertOne(player)
    .then(
      console.log(
        player.name + " was added with the following id: " + player._id
      )
    );
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
