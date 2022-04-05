import React from "react";

export default function Player({ player, viewPlayerCard }) {
  function handlePlayerClick() {
    viewPlayerCard(player.id);
  }
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={player.viewing}
          onChange={handlePlayerClick}
        />
        {player.name}
      </label>
    </div>
  );
}
