import React, { useState, useEffect, useRef } from "react";
import "./builder.css";
import PlayerCard from "../playerCard/PlayerCard";
import axios from "axios";
import { Add } from "@material-ui/icons";
import { CSSTransition } from "react-transition-group";
import { Slider } from "@mui/material";

export default function Buider() {
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [openKeySearch, setOpenKeySearch] = useState([-1]);
  const [openKeyFilter, setOpenKeyFilter] = useState([-1]);
  // const [openKeyScoring, setOpenKeyScoring] = useState([-1]);
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [playerText, setPlayerText] = useState([""]);
  const [positionRequirements, setPositionRequirements] = useState([]);
  const [scoringParams, setScoringParams] = useState([]);

  const emptyLineup = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
  const startingRequirements = { G: 4, F: 4, C: 1, Any: 1 };
  const startingParams = {
    PTS: 1,
    AST: 1.5,
    REB: 1.5,
    STL: 3,
    BLK: 3,
    TOV: -1,
  };

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
    setPositionRequirements(startingRequirements);
  }, []);

  useEffect(() => {
    setScoringParams(startingParams);
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

  function handleParamChange(event, param) {
    var newScoringParams = { ...scoringParams };
    newScoringParams[param] = event.target.value;
    setScoringParams(newScoringParams);
  }

  function calcPositionValues() {
    var positionValues = Object.values(startingRequirements).slice(0, 3);
    var sum = 0;
    for (let i = 0; i < positionValues.length; i++) {
      positionValues[i] += sum;
      sum = positionValues[i];
    }

    return positionValues;
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

  function handlePositionChange() {}

  return (
    <div className="builder">
      <div className="builderWrapper">
        <div className="playerCards">
          <div className="builderHeader">
            <div className="builderHeaderSection">
              <div className="builderHeaderTitle">Roster Requirements</div>
              <div className="positionSliderContainer">
                <Slider
                  sx={{
                    color: "#a5b4fc",
                    "& .MuiSlider-thumb": {
                      borderRadius: "1px",
                      width: "8px",
                    },
                    "& .MuiSlider-thumb:hover": {
                      boxShadow: "0 0 2px 4px rgba(126, 135, 191, 0.5)",
                    },
                    "& .MuiSlider-track": {
                      color: "#a5b4fc",
                      opacity: 1,
                    },
                    "& .MuiSlider-rail": {
                      bacground:
                        "linear-gradient(90deg, a5b4fc 50%, green 7e87bf%)",
                      opacity: 1,
                      height: "6px",
                    },
                    "& .MuiSlider-mark": {
                      color: "#abacb1",
                      width: "5px",
                      height: "5px",
                    },
                  }}
                  className="positionSlider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={0}
                  max={10}
                  value={calcPositionValues()}
                  onChange={(e) => handlePositionChange(e)}
                />
              </div>
            </div>
            <div className="builderHeaderSection">
              <div className="builderHeaderTitle">Scoring Parameters</div>
              <div className="builderHeaderItems">
                {Object.keys(scoringParams).map((param, i) => {
                  return (
                    <div key={i} className="builderHeaderItem">
                      <div className="headerItemTitle">
                        {`${param} - ${
                          param === "TOV"
                            ? "(" + scoringParams[param].toFixed(1) + ")"
                            : scoringParams[param].toFixed(1)
                        }`}
                      </div>
                      <div className="slider">
                        <Slider
                          // theme={paramSliderTheme}
                          sx={{
                            color: "#a5b4fc",
                            "& .MuiSlider-thumb": {
                              borderRadius: "1px",
                              width: "8px",
                              boxShadow: "none",
                            },
                            "& .MuiSlider-thumb:hover": {
                              boxShadow: "0 0 2px 4px rgba(126, 135, 191, 0.5)",
                            },
                            "& .MuiSlider-track": {
                              color: "#a5b4fc",
                              opacity: 1,
                            },
                            "& .MuiSlider-rail": {
                              color: "#a5b4fc",
                            },
                            "& .MuiSlider-mark": {
                              color: "#abacb1",
                            },
                            "& .MuiSlider-valueLabel": {
                              backgroundColor: "#2a2b30",
                            },
                          }}
                          className="paramSlider"
                          valueLabelDisplay="auto"
                          step={0.5}
                          marks
                          min={param === "TOV" ? -5 : 1}
                          max={param === "TOV" ? -1 : 5}
                          value={scoringParams[param]}
                          onChange={(e) => handleParamChange(e, param)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
        </div>
      </div>
    </div>
  );
}
