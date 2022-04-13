import React from "react";
import Post from "../post/Post";
import Share from "../share/Share";
import "./feed.css";
import { Posts } from "../../dummyData";
import { Players } from "../../dummyData";
import PlayerCard from "../playerCard/PlayerCard";

export default function Feed() {
  return (
    <div className="feed">
      <div className="feedWrapper">
        <Share />
        <div className="playerCards">
          <section className="cardGrid">
            {Players.map((p) => (
              <PlayerCard key={p._id} player={p} />
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
