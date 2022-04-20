import React from "react";
import Share from "../share/Share";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./feed.css";
import PlayerCard from "../playerCard/PlayerCard";
import {
  Search,
  FilterList,
  Sort,
  Clear,
  CancelSharp,
} from "@material-ui/icons";

export default function Feed() {
  const [leaguePlayers, setLeaguePlayers] = useState([]);
  const [displayedPlayers, setDisplayedPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [removeFilterCount, setRemoveFilterCount] = useState([0]);
  // const [playerText, setPlayerText] = useState([""]);
  // const [playerSuggestions, setPlayerSuggestions] = useState([]);
  // const [teamText, setTeamText] = useState([""]);
  // const [teamSuggestions, setTeamSuggestions] = useState([]);

  const positions = {
    Guard: "G",
    Forward: "F",
    Center: "C",
  };

  const playerFilterRef = useRef();
  const teamFilterRef = useRef();
  const positionFilterRef = useRef();
  const sortByRef = useRef();

  //fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      const res = await axios.get("/teams/names");
      setTeams(res.data);
      console.log(res.data);
    };

    fetchTeams();
  }, []);

  //fetch league players
  useEffect(() => {
    const fetchLeaguePlayers = async () => {
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

  //set displayed players
  useEffect(() => {
    setDisplayedPlayers(leaguePlayers);
  }, [leaguePlayers]);

  function handleSearchPlayer() {
    const playerFilter = playerFilterRef.current.value;
    if (playerFilter === "") {
      return;
    }
    setDisplayedPlayers(
      displayedPlayers.filter((displayedPlayer) => {
        return displayedPlayer.name === playerFilter;
      })
    );
  }

  function handleTeamFilter() {
    const teamFilter = teamFilterRef.current.value;
    if (teamFilter === "") {
      return;
    }
    setDisplayedPlayers(
      displayedPlayers.filter((displayedPlayer) => {
        return displayedPlayer.teamId === teams[teamFilter];
      })
    );
  }

  function handlePositionFilter() {
    const positionFilter = positionFilterRef.current.value;
    if (positionFilter === "") {
      return;
    }
    setDisplayedPlayers(
      displayedPlayers.filter((displayedPlayer) => {
        return (
          displayedPlayer.pos.charAt(0) === positions[positionFilter] ||
          displayedPlayer.pos.charAt(1) === positions[positionFilter]
        );
      })
    );
  }

  function handleSortBy() {
    const sortBy = sortByRef.current.value;
    if (sortBy === "") {
      return;
    }

    var newDisplayedPlayers = [...displayedPlayers].sort((a, b) => {
      return a.stats.season[0].perGame[sortBy] >
        b.stats.season[0].perGame[sortBy]
        ? -1
        : a.stats.season[0].perGame[sortBy] < b.stats.season[0].perGame[sortBy]
        ? 1
        : 0;
    });

    setDisplayedPlayers(newDisplayedPlayers);
  }

  useEffect(() => {
    var newDisplayedPlayers = leaguePlayers;
    const playerFilter = playerFilterRef.current.value;
    const teamFilter = teamFilterRef.current.value;
    const positionFilter = positionFilterRef.current.value;
    const sortBy = sortByRef.current.value;

    newDisplayedPlayers =
      playerFilter === ""
        ? newDisplayedPlayers
        : newDisplayedPlayers.filter((displayedPlayer) => {
            return displayedPlayer.name === playerFilter;
          });

    newDisplayedPlayers =
      teamFilter === ""
        ? newDisplayedPlayers
        : newDisplayedPlayers.filter((displayedPlayer) => {
            return displayedPlayer.teamId === teams[teamFilter];
          });

    newDisplayedPlayers =
      positionFilter === ""
        ? newDisplayedPlayers
        : newDisplayedPlayers.filter((displayedPlayer) => {
            return (
              displayedPlayer.pos.charAt(0) === positions[positionFilter] ||
              displayedPlayer.pos.charAt(1) === positions[positionFilter]
            );
          });

    newDisplayedPlayers =
      sortBy === ""
        ? newDisplayedPlayers
        : (newDisplayedPlayers = [...displayedPlayers].sort((a, b) => {
            return a.stats.season[0].perGame[sortBy] >
              b.stats.season[0].perGame[sortBy]
              ? -1
              : a.stats.season[0].perGame[sortBy] <
                b.stats.season[0].perGame[sortBy]
              ? 1
              : 0;
          }));

    setDisplayedPlayers(newDisplayedPlayers);
  }, [removeFilterCount]);

  function handleClearPlayer() {
    setRemoveFilterCount(removeFilterCount + 1);
    playerFilterRef.current.value = null;
  }

  function handleClearTeam() {
    setRemoveFilterCount(removeFilterCount + 1);
    teamFilterRef.current.value = null;
  }

  function handleClearPosition() {
    setRemoveFilterCount(removeFilterCount + 1);
    positionFilterRef.current.value = null;
  }

  function handleClearSort() {
    setRemoveFilterCount(removeFilterCount + 1);
    sortByRef.current.value = null;
  }

  function handleClearAll() {
    setDisplayedPlayers(leaguePlayers);
    playerFilterRef.current = null;
    teamFilterRef.current = null;
    positionFilterRef.current = null;
    sortByRef.current = null;
  }

  // function autocompletePlayers(text) {
  //   let matches = [];
  //   if (text.length > 0) {
  //     matches = displayedPlayers.filter((player) => {
  //       const regex = new RegExp(`${text}`, "gi");
  //       return player.name.match(regex);
  //     });
  //   }
  //   setPlayerSuggestions(matches);
  //   setPlayerText(text);
  // }

  // function autocompleteTeams(text) {
  //   let matches = [];
  //   const teamNames = Object.keys(teams);
  //   if (text.length > 0) {
  //     matches = teamNames.filter((team) => {
  //       const regex = new RegExp(`${text}`, "gi");
  //       return team.match(regex);
  //     });
  //   }
  //   setTeamSuggestions(matches);
  //   setTeamText(text);
  // }

  return (
    <div className="feed">
      <div className="feedWrapper">
        <div className="playerCards">
          <div className="feedTopbar">
            <div className="feedTopbarLeft">
              <div className="playerSearchBox">
                <Search className="searchIcon" onClick={handleSearchPlayer} />
                <input
                  ref={playerFilterRef}
                  placeholder="Search for player"
                  className="searchInput"
                  // onChange={(e) => autocompletePlayers(e.target.value)}
                  // value={
                  //   playerSuggestions.length === 1
                  //     ? playerSuggestions[0].name
                  //     : playerText
                  // }
                />
                <Clear className="clearIcon" onClick={handleClearPlayer} />
              </div>
              <div className="playerSearchBox">
                <FilterList className="searchIcon" onClick={handleTeamFilter} />
                <input
                  ref={teamFilterRef}
                  placeholder="Filter by team"
                  className="searchInput"
                  // onChange={(e) => autocompleteTeams(e.target.value)}
                  // value={
                  //   teamSuggestions.length === 1 ? teamSuggestions[0] : teamText
                  // }
                />
                <Clear className="clearIcon" onClick={handleClearTeam} />
              </div>
              <div className="playerSearchBox">
                <FilterList
                  className="searchIcon"
                  onClick={handlePositionFilter}
                />
                <input
                  ref={positionFilterRef}
                  placeholder="Filter by position"
                  className="searchInput"
                />
                <Clear className="clearIcon" onClick={handleClearPosition} />
              </div>
              <div className="playerSearchBox">
                <Sort className="searchIcon" onClick={handleSortBy} />
                <input
                  ref={sortByRef}
                  placeholder="Sort by"
                  className="searchInput"
                />
                <Clear className="clearIcon" onClick={handleClearSort} />
              </div>
            </div>
            <div className="feedTopbarRight">
              <CancelSharp
                className="masterClearButton"
                onClick={handleClearAll}
              />
            </div>
          </div>
          <div className="cardGrid">
            {displayedPlayers.map((p) => (
              <PlayerCard key={p._id} player={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
