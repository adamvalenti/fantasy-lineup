import React from "react";
import "./front.css";

export default function Front({ player }) {
  return (
    <div className="playerCardFront">
      <div className="playerCardFrontWrapper">
        <div className="playerCardFrontBody">
          <div className="playerCardFrontHeader">
            <span className="playerCardFrontName">{player.name}</span>
          </div>
          <div className="playerCardFrontTop">
            <div className="playerCardFrontTopLeft">
              <span className="playerInfo">age: {player.age} years</span>
              <span className="playerInfo">
                height: {`${player.heightFeet}-${player.heightInches}`}
              </span>
              <span className="playerInfo">weight: {player.weightPounds}</span>
              <span className="playerInfo">position: {player.pos}</span>
              <span className="playerInfo">country: {player.country}</span>
            </div>
            <div className="playerCardFrontTopRight">
              <span className="playerInfo">ppg: {player.ppg}</span>
              <span className="playerInfo">apg: {player.apg}</span>
              <span className="playerInfo">rpg: {player.rpg}</span>
              <span className="playerInfo">spg: {player.spg}</span>
              <span className="playerInfo">bpg: {player.bpg}</span>
            </div>
          </div>
          <img
            className="playerCardFrontImg"
            src={`https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player._id}.png`}
            alt=""
          />
        </div>
      </div>
      <div className="playerCardFrontFooter"></div>
    </div>
  );
}
