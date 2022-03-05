const helpers = require("./helpers.js");

function main() {
  queueTest();
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
