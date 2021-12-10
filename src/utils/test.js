import { useEffect, useState } from "react";

export function GetData() {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://data.nba.net/10s/prod/v1/2021/players/1630547_profile.json")
      .then((res) => res.json())
      .then(
        (result) => {
          setIsLoaded(true);
          setItems(result.league.standard.stats.careerSummary);
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
        {Object.keys(items).map((key, idx) => (
          <li key={idx}>
            {key}: {items[key]}
          </li>
        ))}
      </ul>
    );
  }
}
