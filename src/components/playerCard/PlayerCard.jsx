// var leBron = {
//   _id: "2544",
//   name: "LeBron James",
//   teamId: "1610612739",
//   jersey: "23",
//   pos: "F",
//   heightFeet: 6,
//   heightInches: 8,
//   weightPounds: 250,
//   age: 37,
//   country: "USA",
//   ppg: 29.9,
//   apg: 4.5,
//   rpg: 11.6,
//   spg: 0.8,
//   bpg: 1.1,
//   fpg: 51.8,
// };

//https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/2544.png

import React from "react";
import "./playerCard.css";
import { useState } from "react";
import Front from "./front/Front";
import Back from "./back/Back";
import ReactCardFlip from "react-card-flip";
import { Flip, Clear } from "@material-ui/icons";

export default function PlayerCard({ player, handleClearPlayer, lineup }) {
  const [isFlipped, setIsFlipped] = useState(false);

  function handleFlip() {
    setIsFlipped(!isFlipped);
  }

  return (
    <ReactCardFlip
      className="playerCardContainer"
      isFlipped={isFlipped}
      flipDirection="horizontal"
    >
      <div className="playerCard">
        <Front player={player} />
        <Flip className="playerCardFlipButton" onClick={handleFlip}></Flip>
        <Clear
          className="playerCardRemoveButton"
          onClick={(e) => handleClearPlayer(player._id)}
        ></Clear>
      </div>

      <div className="playerCard">
        <Back player={player} />
        <Flip className="playerCardFlipButton" onClick={handleFlip}></Flip>
      </div>
    </ReactCardFlip>
  );
}
