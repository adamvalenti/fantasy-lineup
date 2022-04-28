import React, { useState, useEffect, useRef } from "react";
import { Add, AddToPhotosOutlined } from "@material-ui/icons";
import "./leagueParameters.css";

export default function LeagueBuilder() {
  const [lineupNumber, setLineupNumber] = useState(1);
  const [leaguePlayers, setLeaguePlayers] = useState([
    {
      teamName: "Team Name",
      username: "Username",
    },
  ]);
  const [isLocked, setIsLocked] = useState(false);

  const teamNameRef = useRef();
  const usernameRef = useRef();

  function handleTeamNameSubmit() {
    var teamName = teamNameRef.current.value;

    if (teamName === "") {
      return;
    }

    var newLeaguePlayers = [...leaguePlayers];

    newLeaguePlayers[lineupNumber - 1].teamName = teamName;

    setLeaguePlayers(newLeaguePlayers);
    teamNameRef.current.value = null;
  }

  function handleUsernameSubmit() {
    var username = usernameRef.current.value;

    if (username === "") {
      return;
    }

    var newLeaguePlayers = [...leaguePlayers];

    newLeaguePlayers[lineupNumber - 1].username = username;

    setLeaguePlayers(newLeaguePlayers);
    usernameRef.current.value = null;
  }

  function handleContentLock() {
    setIsLocked(!isLocked);
  }

  return (
    <div className="leagueParametersContent">
      <div
        className="leagueParametersSection"
        style={{
          opacity: isLocked ? 0.5 : 1,
          pointerEvents: isLocked ? "none" : "auto",
        }}
      >
        <div className="leagueParametersTitle">{`Player ${lineupNumber}`}</div>
        <div className="leagueParametersItems">
          <div className="leagueParametersItem">
            <div className="itemText">{`${
              leaguePlayers[lineupNumber - 1].teamName
            }`}</div>
            <input
              ref={teamNameRef}
              className="playerInfo"
              type="text"
              placeholder="Enter Player's Team Name"
            />
            <div className="submitButton" onClick={handleTeamNameSubmit}>
              <Add />
            </div>
          </div>
          <div className="leagueParametersItem">
            <div className="itemText">{`${
              leaguePlayers[lineupNumber - 1].username
            }`}</div>
            <input
              ref={usernameRef}
              className="playerInfo"
              type="text"
              placeholder="Enter Player's Username"
            />
            <div className="submitButton" onClick={handleUsernameSubmit}>
              <Add />
            </div>
          </div>
        </div>
      </div>
      <div className="leagueParametersTopright" onClick={handleContentLock}>
        <div className="lockParametersButton">{<AddToPhotosOutlined />}</div>
      </div>
    </div>
  );
}
