const requests = require("./apiRequests.js");
const calculations = require("./calculations.js");
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

    // var advPlayerStats = await calculations.advancedPlayerStats(client,"Andrew Wiggins");
    // await createPlayer(client, await requests.getPlayerData("203952"));
    await addGames(client, await requests.getSchedule());
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
    game = {
      _id: games[i].gameId,
      seasonStageId: games[i].seasonStageId,
      gameUrlCode: games[i].gameUrlCode,
      statusNum: games[i].statusNum,
      extendedStatusNum: games[i].extendedStatusNum,
      isStartTimeTBD: games[i].isStartTimeTBD,
      startTimeUTC: games[i].startTimeUTC,
      startDateEastern: games[i].startDateEastern,
      isNeutralVenue: games[i].isNeutralVenue,
      startTimeEastern: games[i].startTimeEastern,
      hTeam: {
        teamId: games[i].hTeam.teamId,
        score: parseInt(games[i].hTeam.score),
        win: parseInt(games[i].hTeam.win),
        loss: parseInt(games[i].hTeam.loss),
        gamesPlayed:
          parseInt(games[i].hTeam.win) + parseInt(games[i].hTeam.loss),
        stats: games[i].hTeam.stats,
      },
      vTeam: {
        teamId: games[i].vTeam.teamId,
        score: parseInt(games[i].vTeam.score),
        win: parseInt(games[i].vTeam.win),
        loss: parseInt(games[i].vTeam.loss),
        gamesPlayed:
          parseInt(games[i].vTeam.win) + parseInt(games[i].vTeam.loss),
        stats: games[i].vTeam.stats,
      },
    };

    cleanedGames.push(game);
  }
  await client
    .db("nbaFantasyLineup")
    .collection("schedule")
    .insertMany(cleanedGames);
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

async function createPlayer(client, playerData) {
  var seasonsPlayed = [];

  for (let i = 0; i < playerData.regularSeason.season.length; i++) {
    var currSeason = playerData.regularSeason.season[i];
    var teamsPlayed = [];

    for (let j = 0; j < currSeason.teams.length; j++) {
      var currTeam = currSeason.teams[j];

      var team = {
        teamId: parseInt(currTeam.teamId),
        ppg: parseFloat(currTeam.ppg),
        rpg: parseFloat(currTeam.rpg),
        apg: parseFloat(currTeam.apg),
        spg: parseFloat(currTeam.spg),
        bpg: parseFloat(currTeam.bpg),
        tpg: parseFloat(currTeam.topg),
        mpg: parseFloat(currTeam.mpg),
        tpp: parseFloat(currTeam.tpp),
        ftp: parseFloat(currTeam.ftp),
        fgp: parseFloat(currTeam.fgp),
        pts: parseInt(currTeam.points),
        ast: parseInt(currTeam.assists),
        blk: parseInt(currTeam.blocks),
        stl: parseInt(currTeam.steals),
        tov: parseInt(currTeam.turnovers),
        orb: parseInt(currTeam.offReb),
        drb: parseInt(currTeam.defReb),
        reb: parseInt(currTeam.totReb),
        fgm: parseInt(currTeam.fgm),
        fga: parseInt(currTeam.fga),
        tpm: parseInt(currTeam.tpm),
        tpa: parseInt(currTeam.tpa),
        ftm: parseInt(currTeam.ftm),
        fta: parseInt(currTeam.fta),
        pf: parseInt(currTeam.pFouls),
        gp: parseInt(currTeam.gamesPlayed),
        gs: parseInt(currTeam.gamesStarted),
        pm: parseInt(currTeam.plusMinus),
        min: parseInt(currTeam.min),
        dd2: parseInt(currTeam.dd2),
        td3: parseInt(currTeam.td3),
      };

      teamsPlayed.push(team);
    }
    var season = {
      seasonYear: currSeason.seasonYear,
      teams: teamsPlayed,
      ppg: parseFloat(currSeason.total.ppg),
      rpg: parseFloat(currSeason.total.rpg),
      apg: parseFloat(currSeason.total.apg),
      spg: parseFloat(currSeason.total.spg),
      bpg: parseFloat(currSeason.total.bpg),
      topg: parseFloat(currSeason.total.topg),
      mpg: parseFloat(currSeason.total.mpg),
      tpp: parseFloat(currSeason.total.tpp),
      ftp: parseFloat(currSeason.total.ftp),
      fgp: parseFloat(currSeason.total.fgp),
      pts: parseInt(currSeason.total.points),
      ast: parseInt(currSeason.total.assists),
      blk: parseInt(currSeason.total.blocks),
      stl: parseInt(currSeason.total.steals),
      tov: parseInt(currSeason.total.turnovers),
      orb: parseInt(currSeason.total.offReb),
      drb: parseInt(currSeason.total.defReb),
      reb: parseInt(currSeason.total.totReb),
      fgm: parseInt(currSeason.total.fgm),
      fga: parseInt(currSeason.total.fga),
      tpm: parseInt(currSeason.total.tpm),
      tpa: parseInt(currSeason.total.tpa),
      ftm: parseInt(currSeason.total.ftm),
      fta: parseInt(currSeason.total.fta),
      pf: parseInt(currSeason.total.pFouls),
      gp: parseInt(currSeason.total.gamesPlayed),
      gs: parseInt(currSeason.total.gamesStarted),
      pm: parseInt(currSeason.total.plusMinus),
      min: parseInt(currSeason.total.min),
      dd2: parseInt(currSeason.total.dd2),
      td3: parseInt(currSeason.total.td3),
    };

    seasonsPlayed.push(season);
  }

  var gamesPlayed = [];

  for (let i = 0; i < playerData.recent.length; i++) {
    var currGame = playerData.recent[i];
    var mp = currGame.min;

    if (mp === "") {
      mp = 0;
    } else {
      var mins = parseInt(mp.split(":")[0]);
      var secs = parseInt(mp.split(":")[1]);
      mp = secs >= 30 ? mins + 1 : mins;
    }

    var gameStats = {
      bdlPlayerId: currGame.player.id,
      entryId: currGame.id,
      gameId: currGame.game.id,
      date: currGame.game.date,
      pts: currGame.pts,
      ast: currGame.ast,
      drb: currGame.dreb,
      orb: currGame.oreb,
      stl: currGame.stl,
      blk: currGame.blk,
      tov: currGame.turnover,
      min: mp,
      tpm: currGame.fg3m,
      tpa: currGame.fg3a,
      fgm: currGame.fgm,
      fga: currGame.fga,
      ftm: currGame.ftm,
      fta: currGame.fta,
      pf: currGame.pf,
      homeTeamId: currGame.game.home_team_id,
      homeTeamScore: currGame.game.home_team_score,
      visitorTeamId: currGame.game.visitor_team_id,
      visitorTeamScore: currGame.game.visitor_team_score,
      postseason: currGame.game.postseason,
      season: currGame.game.season,
    };

    gamesPlayed.push(gameStats);
  }
  var player = {
    _id: parseInt(playerData.personId),
    name: playerData.firstName + " " + playerData.lastName,
    playerListId: playerData.listId,
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
        tpg: parseFloat(playerData.latest.topg),
        mpg: parseFloat(playerData.latest.mpg),
        tpp: parseFloat(playerData.latest.tpp),
        ftp: parseFloat(playerData.latest.ftp),
        fgp: parseFloat(playerData.latest.fgp),
        pts: parseInt(playerData.latest.points),
        ast: parseInt(playerData.latest.assists),
        blk: parseInt(playerData.latest.blocks),
        stl: parseInt(playerData.latest.steals),
        tov: parseInt(playerData.latest.turnovers),
        orb: parseInt(playerData.latest.offReb),
        drb: parseInt(playerData.latest.defReb),
        reb: parseInt(playerData.latest.totReb),
        fgm: parseInt(playerData.latest.fgm),
        fga: parseInt(playerData.latest.fga),
        tpm: parseInt(playerData.latest.tpm),
        tpa: parseInt(playerData.latest.tpa),
        ftm: parseInt(playerData.latest.ftm),
        fta: parseInt(playerData.latest.fta),
        pf: parseInt(playerData.latest.pFouls),
        gp: parseInt(playerData.latest.gamesPlayed),
        gs: parseInt(playerData.latest.gamesStarted),
        pm: parseInt(playerData.latest.plusMinus),
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
        pts: parseInt(playerData.careerSummary.points),
        ast: parseInt(playerData.careerSummary.assists),
        blk: parseInt(playerData.careerSummary.blocks),
        stl: parseInt(playerData.careerSummary.steals),
        tov: parseInt(playerData.careerSummary.turnovers),
        orb: parseInt(playerData.careerSummary.offReb),
        drb: parseInt(playerData.careerSummary.defReb),
        reb: parseInt(playerData.careerSummary.totReb),
        fgm: parseInt(playerData.careerSummary.fgm),
        fga: parseInt(playerData.careerSummary.fga),
        tpm: parseInt(playerData.careerSummary.tpm),
        tpa: parseInt(playerData.careerSummary.tpa),
        ftm: parseInt(playerData.careerSummary.ftm),
        fta: parseInt(playerData.careerSummary.fta),
        pf: parseInt(playerData.careerSummary.pFouls),
        gp: parseInt(playerData.careerSummary.gamesPlayed),
        gs: parseInt(playerData.careerSummary.gamesStarted),
        pm: parseInt(playerData.careerSummary.plusMinus),
        min: parseInt(playerData.careerSummary.min),
        dd2: parseInt(playerData.careerSummary.dd2),
        td3: parseInt(playerData.careerSummary.td3),
      },
      regularSeason: {
        season: seasonsPlayed,
      },
      recent: {
        games: gamesPlayed,
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
