import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import FantasyAnalytics from "./components/FantasyAnalytics";
// import { getPlayerNames } from "./utils/mongo.js";

const LOCAL_STORAGE_KEY = "fantasy.players";

function App() {
  // const playerNames = getPlayerNames(2016);
  const [players, setPlayers] = useState([]);
  const playerNameRef = useRef();

  useEffect(() => {
    const storedPlayers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (storedPlayers) {
      setPlayers(storedPlayers);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  function viewPlayerCard(id) {
    const newPlayers = [...players];
    const player = newPlayers.find((player) => player.id === id);
    player.viewing = !player.viewing;
    setPlayers(newPlayers);
  }

  function handleAddPlayer() {
    const name = playerNameRef.current.value;
    if (name === "") {
      return;
    }
    setPlayers((prevPlayers) => {
      return [...prevPlayers, { id: 1, name: name, viewing: false }];
    });
    playerNameRef.current.value = null;
  }

  function handleClearPlayers() {
    setPlayers([]);
  }

  return (
    <>
      <FantasyAnalytics players={players} viewPlayerCard={viewPlayerCard} />
      <input ref={playerNameRef} type="text" />
      <button onClick={handleAddPlayer}> Add Player </button>
      <button onClick={handleClearPlayers}> Clear Roster </button>
      <div> {10 - players.length} Players remaining </div>
      {/* <ul> {playerNames} </ul> */}
    </>
  );
}

export default App;
