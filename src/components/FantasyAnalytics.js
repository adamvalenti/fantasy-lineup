import React from "react";
import Player from "./Player";

export default function FantasyAnalytics({ players, viewPlayerCard }) {
  return players.map((player) => {
    return (
      <Player key={player.id} viewPlayerCard={viewPlayerCard} player={player} />
    );
  });
}
