import React, { useState, useEffect, useRef } from "react";
import "./builder.css";
import PlayerCard from "../playerCard/PlayerCard";
import axios from "axios";
import { Add, KeyboardArrowDown } from "@material-ui/icons";
import { CSSTransition } from "react-transition-group";
import { Slider } from "@mui/material";

export default function Buider() {
  const [availablePlayers, setavailablePlayers] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [openKeySearch, setOpenKeySearch] = useState([-1]);
  const [openKeyFilter, setOpenKeyFilter] = useState([-1]);
  const [openKeyScoring, setOpenKeyScoring] = useState([-1]);
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [playerText, setPlayerText] = useState([""]);
  const [positionRequirements, setPositionRequirements] = useState([]);
  const [scoringParams, setScoringParams] = useState([]);

  const emptyLineup = [{}, {}, {}, {}, {}];
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
    setPositionRequirements(startingRequirements);
  }, []);

  useEffect(() => {
    setScoringParams(startingParams);
  }, []);

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

  function handleParamChange(newValue, param) {
    var newScoringParams = scoringParams;
    newScoringParams[param] = newValue;
    setScoringParams(newScoringParams);
  }

  function displayParamChange(param) {
    return scoringParams[param];
  }

  return (
    <div className="builder">
      <div className="builderWrapper">
        <div className="playerCards">
          <div className="builderHeader">
            <div className="builderHeaderSection">
              <div className="builderHeaderTitle">Roster Requirements</div>
              <div className="builderHeaderItems">
                {Object.keys(positionRequirements).map((position, i) => {
                  return (
                    <div key={i} className="builderHeaderItem">
                      <div className="headerItemTitle">{`${position} - ${positionRequirements[position]}`}</div>
                      <CSSTransition
                        in={openKeyFilter === i}
                        unmountOnExit
                        timeout={150}
                        classNames="headerItemToggle"
                      >
                        <>
                          <input
                            className="searchText"
                            type="text"
                            placeholder="New requirement"
                          />
                        </>
                      </CSSTransition>
                      <div
                        className="enterButton"
                        onClick={() => {
                          openKeyFilter === i
                            ? setOpenKeyFilter(-1)
                            : setOpenKeyFilter(i);
                        }}
                      >
                        <KeyboardArrowDown />
                      </div>
                    </div>
                  );
                })}
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
                      <CSSTransition
                        in={openKeyScoring === i}
                        unmountOnExit
                        timeout={1000}
                        classNames="headerItemToggle"
                      >
                        <div className="paramSlider">
                          <Slider
                            valueLabelDisplay="auto"
                            step={0.5}
                            marks
                            min={param === "TOV" ? -5 : 1}
                            max={param === "TOV" ? -1 : 5}
                            value={displayParamChange()}
                            onChange={(e) =>
                              handleParamChange(e.target.value, param)
                            }
                          />
                        </div>
                      </CSSTransition>
                      <div
                        className="enterButton"
                        onClick={() => {
                          openKeyScoring === i
                            ? setOpenKeyScoring(-1)
                            : setOpenKeyScoring(i);
                        }}
                      >
                        <KeyboardArrowDown />
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
