import React, { useState, useEffect, useRef } from "react";
import "./builder.css";
import PlayerCard from "../playerCard/PlayerCard";
import PlayerCardBox from "../playerCardBox/PlayerCardBox";
import axios from "axios";
import { Search, Clear, Add } from "@material-ui/icons";
import { CSSTransition } from "react-transition-group";

export default function Buider() {
  const [leaguePlayers, setLeaguePlayers] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [openKey, setOpenKey] = useState(-1);

  const playerFilterRef = useRef();

  const emptyLineup = [{}, {}, {}, {}, {}];

  useEffect(() => {
    const fetchLeaguePlayers = async () => {
      console.log("players");
      const res = await axios.get("/players");
      var sortedLeaguePlayers = res.data.sort((a, b) => {
        return a.stats.season[0].perGame.fp > b.stats.season[0].perGame.fp
          ? -1
          : a.stats.season[0].perGame.fp < b.stats.season[0].perGame.fp
          ? 1
          : 0;
      });
      setLeaguePlayers(sortedLeaguePlayers);
    };

    fetchLeaguePlayers();
  }, []);

  useEffect(() => {
    setLineup(emptyLineup);
  }, []);

  function handleSearchPlayer() {
    const playerFilter = playerFilterRef.current.value;
    if (playerFilter === "") {
      return;
    }

    var player = leaguePlayers.filter((leaguePlayer) => {
      return leaguePlayer.name === playerFilter;
    })[0];

    console.log(player);

    if (player === undefined) {
      console.log("No player named " + playerFilter);
      return;
    }

    var newDisplayedPlayers = [...displayedPlayers];

    var firstEmptyCard = newDisplayedPlayers.find((player) => {
      return player.name.substring(0, 6) === "Player";
    });

    var indexEmptyCard = newDisplayedPlayers.indexOf(firstEmptyCard);

    newDisplayedPlayers[indexEmptyCard] = player;

    setDisplayedPlayers(newDisplayedPlayers);

    setLeaguePlayers(
      leaguePlayers.filter((leaguePlayer) => {
        return leaguePlayer._id !== player._id;
      })
    );
  }

  function handleClearPlayer() {
    playerFilterRef.current.value = null;
  }

  return (
    <div className="builder">
      <div className="builderWrapper">
        <div className="playerCards">
          <div className="builderTopbar">
            <div className="builderTopbarLeft">
              <div className="playerSearchBox">
                <Search className="searchIcon" onClick={handleSearchPlayer} />
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
            <div className="playerCardBox">
              <div
                className="playerCardBoxButton"
                onClick={() => {
                  setOpenKey(!open);
                }}
              >
                <Add className="addPlayerIcon" />
              </div>
              <CSSTransition
                in={open}
                unmountOnExit
                timeout={500}
                classNames="searchBox-toggle"
              >
                <input
                  className="cardSearchBox"
                  placeholder="Search players..."
                />
              </CSSTransition>
            </div>
            <div className="playerCardBox">
              <div
                className="playerCardBoxButton"
                onClick={() => {
                  setOpenKey(!open);
                }}
              >
                <Add className="addPlayerIcon" />
              </div>
              <CSSTransition
                in={open}
                unmountOnExit
                timeout={500}
                classNames="searchBox-toggle"
              >
                <input
                  className="cardSearchBox"
                  placeholder="Search players..."
                />
              </CSSTransition>
            </div>
            <div className="playerCardBox">
              <div
                className="playerCardBoxButton"
                onClick={() => {
                  setOpenKey(!open);
                }}
              >
                <Add className="addPlayerIcon" />
              </div>
              <CSSTransition
                in={open}
                unmountOnExit
                timeout={500}
                classNames="searchBox-toggle"
              >
                <input
                  className="cardSearchBox"
                  placeholder="Search players..."
                />
              </CSSTransition>
              <CSSTransition
                in={open}
                unmountOnExit
                timeout={500}
                classNames="searchBox-toggle"
              >
                <input
                  className="cardSearchBox"
                  placeholder="Search players..."
                />
              </CSSTransition>
              <CSSTransition
                in={open}
                unmountOnExit
                timeout={500}
                classNames="searchBox-toggle"
              >
                <input
                  className="cardSearchBox"
                  placeholder="Search players..."
                />
              </CSSTransition>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
