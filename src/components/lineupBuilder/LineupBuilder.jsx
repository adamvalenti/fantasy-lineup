import React, { useState, useEffect, useRef } from "react";
import "./lineupBuilder.css";
import PlayerCard from "../playerCard/PlayerCard";
import axios from "axios";
import { Add } from "@material-ui/icons";
import { CSSTransition } from "react-transition-group";

export default function LineupBuider() {
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [openKeySearch, setOpenKeySearch] = useState([-1]);
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [playerText, setPlayerText] = useState([""]);

  const emptyLineup = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}];

  useEffect(() => {
    const fetchAllPlayers = async () => {
      const res = await axios.get("/players");
      var sortedPlayers = res.data.sort((a, b) => {
        return a.stats.season[0].perGame.fp > b.stats.season[0].perGame.fp
          ? -1
          : a.stats.season[0].perGame.fp < b.stats.season[0].perGame.fp
          ? 1
          : 0;
      });
      setAvailablePlayers(sortedPlayers);
      setAllPlayers(sortedPlayers);
    };

    fetchAllPlayers();
  }, []);

  useEffect(() => {
    var newAvailablePlayers = [...allPlayers];

    for (let i = 0; i < lineup.length; i++) {
      if (lineup[i]._id !== undefined) {
        var index = newAvailablePlayers.findIndex((player) => {
          return player._id === lineup[i]._id;
        });

        newAvailablePlayers.splice(index, 1);
      }
    }
    setAvailablePlayers(newAvailablePlayers);
  }, [lineup]);

  useEffect(() => {
    setLineup(emptyLineup);
  }, []);

  function autocompletePlayers(text) {
    let matches = [];
    if (text.length > 2) {
      matches = availablePlayers.filter((player) => {
        const regex = new RegExp(`${text}`, "gi");
        return player.name.match(regex);
      });
    }
    setPlayerSuggestions(matches);
    setPlayerText(text);
  }

  function handleSuggestionSelect(player, cardPosition) {
    var newLineup = [...lineup];
    newLineup[cardPosition] = player;
    setLineup(newLineup);
  }

  function handleClearPlayer(playerId) {
    var newLineup = [...lineup];

    const index = newLineup.findIndex((player) => {
      return player._id === playerId;
    });

    newLineup[index] = {};

    setLineup(newLineup);
    setOpenKeySearch(-1);
  }

  return (
    <>
      <div className="lineupBox">
        {lineup.map((player, i) => {
          return player._id === undefined ? (
            <div key={i} className="playerCardBox">
              <div
                className="playerCardBoxButton"
                onClick={() => {
                  openKeySearch === i
                    ? setOpenKeySearch(-1)
                    : setOpenKeySearch(i);
                  setPlayerText("");
                  setPlayerSuggestions([]);
                }}
              >
                <Add className="addPlayerIcon" />
              </div>
              <CSSTransition
                in={openKeySearch === i}
                unmountOnExit
                timeout={500}
                classNames="searchBoxToggle"
              >
                <>
                  <input
                    className="cardSearchBox"
                    placeholder="Search players..."
                    onChange={(e) => autocompletePlayers(e.target.value)}
                    value={playerText}
                  />
                  <div className="dropdownMenu">
                    {playerSuggestions &&
                      playerSuggestions.map((player, idx) => {
                        return (
                          <div
                            key={idx}
                            className="dropdownItem"
                            onClick={() => {
                              handleSuggestionSelect(player, i);
                            }}
                          >
                            {player.name}
                          </div>
                        );
                      })}
                  </div>
                </>
              </CSSTransition>
            </div>
          ) : (
            <div key={i} className="playerCardBox">
              <PlayerCard
                key={i}
                player={player}
                handleClearPlayer={handleClearPlayer}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
