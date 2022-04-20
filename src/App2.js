import React, { useState, useRef, useEffect } from "react";
import FantasyAnalytics from "./components/FantasyAnalytics";
import axios from "axios";

const LOCAL_FANTASY_PLAYERS_KEY = "fantasyRoster";

function App() {
  const [fantasyPlayers, setFantasyPlayers] = useState([]);

  const playerNameRef = useRef();

  useEffect(() => {
    const storedPlayers = JSON.parse(
      localStorage.getItem(LOCAL_FANTASY_PLAYERS_KEY)
    );
    if (storedPlayers) {
      setFantasyPlayers(storedPlayers);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_FANTASY_PLAYERS_KEY,
      JSON.stringify(fantasyPlayers)
    );
  }, [fantasyPlayers]);

  function viewPlayerCard(id) {
    const newPlayers = [...fantasyPlayers];
    const player = newPlayers.find((player) => player.id === id);
    player.viewing = !player.viewing;
    setFantasyPlayers(newPlayers);
  }

  function handleAddPlayer() {
    const name = playerNameRef.current.value;
    if (name === "") {
      return;
    }
    setFantasyPlayers((prevPlayers) => {
      return [...prevPlayers, { id: 1, name: name, viewing: false }];
    });
    playerNameRef.current.value = null;
  }

  function handleClearPlayers() {
    setFantasyPlayers([]);
  }

  return (
    <>
      <FantasyAnalytics
        players={fantasyPlayers}
        viewPlayerCard={viewPlayerCard}
      />
      <input ref={playerNameRef} type="text" />
      <button onClick={handleAddPlayer}> Add Player </button>
      <button onClick={handleClearPlayers}> Clear Roster </button>
      <div> {10 - fantasyPlayers.length} Players remaining </div>
    </>
  );
}

export default App;
