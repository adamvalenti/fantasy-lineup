import React from "react";
import "./back.css";

export default function Back({ player }) {
  return (
    <div className="playerCardBack">
      <div className="playerCardBackWrapper">
        <div className="playerCardBackBody">
          <div className="playerCardBackHeader">
            <span className="playerCardBackName">{player.name}</span>
          </div>
          <div className="playerCardBackTop">
            <div className="playerCardBackTopLeft"></div>
            <div className="playerCardBackTopRight"></div>
          </div>
        </div>
      </div>
      <div className="playerCardBackFooter"></div>
    </div>
  );
}
