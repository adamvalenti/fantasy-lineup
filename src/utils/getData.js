const axios = require("axios");

const url = "http://data.nba.net/10s/prod/v1/2021/players/1629027_profile.json";

export function getData() {
  var items = {};
  axios
    .get(url)
    .then((res) => res.json())
    .then((result) => (items = result.league.standard.stats.latest))
    .catch((error) => {
      console.log(error);
      return error.message;
    });

  var results = [];
  for (let i = 0; i < items.length; i++) {
    let isnum = /[+-]?([0-9]*[.])?[0-9]+/.test(items[i]);
    if (isnum) {
      items[i] = parseFloat(items[i], 10);
    }
    results.append({ key: items[i] });
  }
  console.log(results);
  return results;
}
