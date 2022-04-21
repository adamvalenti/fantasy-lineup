import React, { useState, useEffect, useRef } from "react";
import "./builder.css";
import PlayerCard from "../playerCard/PlayerCard";
import axios from "axios";
import { Search, Clear, Add } from "@material-ui/icons";
import { CSSTransition } from "react-transition-group";

export default function Buider() {
  const [availablePlayers, setavailablePlayers] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [openKey, setOpenKey] = useState([-1]);
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [playerText, setPlayerText] = useState([""]);

  const playerFilterRef = useRef();

  const lebronJames = {
    _id: "2544",
    name: "LeBron James",
    teamId: "1610612739",
    jersey: "23",
    pos: "F",
    heightFeet: 6,
    heightInches: 8,
    weightPounds: 250,
    age: 37,
    country: "USA",
    stats: {
      season: [
        {
          perGame: {
            pts: 29.9,
            ast: 4.5,
            orb: 11.6,
            drb: 0.8,
            stl: 1.1,
            blk: 51.8,
            fp: 51.8,
          },
        },
      ],
    },
  };

  const emptyLineup = [{}, {}, {}, {}, {}];

  useEffect(() => {
    const fetchavailablePlayers = async () => {
      const res = await axios.get("/players");
      var sortedavailablePlayers = res.data.sort((a, b) => {
        return a.stats.season[0].perGame.fp > b.stats.season[0].perGame.fp
          ? -1
          : a.stats.season[0].perGame.fp < b.stats.season[0].perGame.fp
          ? 1
          : 0;
      });
      setavailablePlayers(sortedavailablePlayers);
    };

    fetchavailablePlayers();
  }, []);

  useEffect(() => {
    setLineup(emptyLineup);
  }, []);

  function handleClearPlayer() {
    playerFilterRef.current.value = null;
  }

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

  return (
    <div className="builder">
      <div className="builderWrapper">
        <div className="playerCards">
          <div className="builderTopbar">
            <div className="builderTopbarLeft">
              <div className="playerSearchBox">
                <Search className="searchIcon" />
                <input
                  ref={playerFilterRef}
                  placeholder="Search for player"
                  className="searchInput"
                />
                <Clear className="clearIcon" onClick={handleClearPlayer} />
              </div>
            </div>
            <div className="builderTopbarRight"></div>
          </div>
          <div className="lineupBox">
            {lineup.map((player, i) => {
              console.log(player._id !== undefined);
              return player._id === undefined ? (
                <div key={i} className="playerCardBox">
                  <div
                    className="playerCardBoxButton"
                    onClick={() => {
                      openKey === i ? setOpenKey(-1) : setOpenKey(i);
                      setPlayerText("");
                      setPlayerSuggestions([]);
                    }}
                  >
                    <Add className="addPlayerIcon" />
                  </div>
                  <CSSTransition
                    in={openKey === i}
                    unmountOnExit
                    timeout={500}
                    classNames="searchBox-toggle"
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
                  <PlayerCard key={i} player={player} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
