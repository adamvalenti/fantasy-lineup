import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import FantasyAnalytics from "./components/FantasyAnalytics";
import { getLeaguePlayers } from "./utils/mongo.js";
import axios from "axios";

const LOCAL_FANTASY_PLAYERS_KEY = "fantasyRoster";
const LOCAL_LEAGUE_PLAYERS_KEY = "leaguePlayers";

function App() {
  const url =
    "https://webhooks.mongodb-stitch.com/api/client/v2.0/app/covid-19-qppza/service/REST-API/incoming_webhook/metadata";

  const [fantasyPlayers, setFantasyPlayers] = useState([]);
  const [leaguePlayers, setAllLeaguePlayers] = useState([]);

  const playerNameRef = useRef();

  useEffect(() => {
    const storedPlayers = localStorage.getItem(LOCAL_LEAGUE_PLAYERS_KEY);
    if (storedPlayers) {
      setAllLeaguePlayers(storedPlayers);
    }
  }, []);

  useEffect(() => {
    axios.get(url).then((res) => {
      setAllLeaguePlayers(res.data);
      localStorage.setItem(LOCAL_LEAGUE_PLAYERS_KEY, leaguePlayers);
    });
  }, []);

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
