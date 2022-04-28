import React from "react";
import "./lineups.css";
import Topbar from "../../components/topbar/Topbar";
import Leftbar from "../../components/leftbar/Leftbar";
import BuilderParameters from "../../components/builderParameters/BuilderParameters";
import LineupBuilder from "../../components/lineupBuilder/LineupBuilder";

export default function Lineups() {
  return (
    <>
      <Topbar />
      <div className="lineupsContainer">
        <Leftbar />
        <div className="lineupsContentWrapper">
          <div className="lineupBuilder">
            <BuilderParameters />
            <LineupBuilder />
          </div>
        </div>
      </div>
    </>
  );
}
