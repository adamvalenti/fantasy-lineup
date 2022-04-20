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
              <span className="playerInfo">
                ppg:{" "}
                {(
                  Math.round(player.stats.season[0].perGame.pts * 100) / 100
                ).toFixed(1)}
              </span>
              <span className="playerInfo">
                apg:{" "}
                {(
                  Math.round(player.stats.season[0].perGame.ast * 100) / 100
                ).toFixed(1)}
              </span>
              <span className="playerInfo">
                rpg:{" "}
                {(
                  Math.round(
                    (player.stats.season[0].perGame.orb +
                      player.stats.season[0].perGame.drb) *
                      100
                  ) / 100
                ).toFixed(1)}
              </span>
              <span className="playerInfo">
                spg:{" "}
                {(
                  Math.round(player.stats.season[0].perGame.blk * 100) / 100
                ).toFixed(1)}
              </span>
              <span className="playerInfo">
                bpg:{" "}
                {(
                  Math.round(player.stats.season[0].perGame.stl * 100) / 100
                ).toFixed(1)}
              </span>
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
