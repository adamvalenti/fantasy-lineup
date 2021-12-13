import { useEffect, useState } from "react";

export function GetData() {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://data.nba.net/10s/prod/v1/2021/players/1629027_profile.json")
      .then((res) => res.json())
      .then(
        (result) => {
          setIsLoaded(true);
          setItems(result.league.standard.stats.latest);
        },
        (error) => {
          setIsLoaded(true);
          setError(error);
        }
      );
  }, []);

  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (!isLoaded) {
    return <div>Loading...</div>;
  } else {
    return (
      <ul>
        {Object.keys(items).map((key, idx) => {
          let isnum = /[+-]?([0-9]*[.])?[0-9]+/.test(items[key]);
          if (isnum) {
            items[key] = parseFloat(items[key], 10);
          }
          <li key={idx}>
            {key}: {items[key]}
          </li>;
        })}
      </ul>
    );
  }
}
