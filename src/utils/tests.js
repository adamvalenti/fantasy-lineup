const helpers = require("./helpers.js");

function main() {
  queueTest();
  testDaysOld();
  testUsages();
  testAdvancedStats();
}

main();

function queueTest() {
  var maxGames = 10;
  var currQueue1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var currQueue2 = [1, 2, 4];
  var currQueue3 = [];
  var newQueue1 = [10, 11, 13, 14, 15, 16, 17, 12, 14, 15, 16, 17];
  var newQueue2 = [5, 7, 8];
  var newQueue3 = [];

  console.log(helpers.updateQueue(currQueue1, newQueue1, maxGames));
  console.log(helpers.updateQueue(currQueue2, newQueue1, maxGames));
  console.log(helpers.updateQueue(currQueue3, newQueue1, maxGames));
  console.log(helpers.updateQueue(currQueue1, newQueue2, maxGames));
  console.log(helpers.updateQueue(currQueue2, newQueue2, maxGames));
  console.log(helpers.updateQueue(currQueue3, newQueue2, maxGames));
  console.log(helpers.updateQueue(currQueue1, newQueue3, maxGames));
  console.log(helpers.updateQueue(currQueue2, newQueue3, maxGames));
  console.log(helpers.updateQueue(currQueue3, newQueue3, maxGames));
}

function testDaysOld() {
  var dateOfBirth = "2001-01-16";

  console.log(daysOld(dateOfBirth));
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

function testAdvancedStats() {
  var player = {
    stats: {
      pts: 11,
      ast: 0,
      drb: 1,
      orb: 0,
      stl: 1,
      blk: 0,
      tov: 0,
      fgm: 3,
      fga: 9,
      tpm: 2,
      tpa: 7,
      ftm: 3,
      fta: 3,
      mp: 22,
      pf: 2,
    },
  };
  var opponent = {
    stats: {
      pts: 131,
      ast: 36,
      drb: 44,
      orb: 13,
      stl: 13,
      blk: 11,
      tov: 9,
      fgm: 51,
      fga: 109,
      tpm: 16,
      tpa: 37,
      ftm: 13,
      fta: 18,
      mp: 240,
      pf: 24,
      tf: 24,
      pos: 109,
      pace: 109,
    },
  };
  var team = {
    stats: {
      pts: 129,
      ast: 36,
      drb: 44,
      orb: 13,
      stl: 13,
      blk: 11,
      tov: 9,
      fgm: 51,
      fga: 115,
      tpm: 16,
      tpa: 37,
      ftm: 13,
      fta: 18,
      mp: 240,
      pf: 24,
      tf: 24,
      pos: 109,
      pace: 109,
    },
  };
  console.log(advancedPlayerStats(player.stats, team.stats, opponent.stats));
  console.log(lastNAverages());
}
