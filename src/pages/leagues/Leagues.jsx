import React from "react";
import "./leagues.css";
import Topbar from "../../components/topbar/Topbar";
import Leftbar from "../../components/leftbar/Leftbar";
import BuilderParameters from "../../components/builderParameters/BuilderParameters";
import LeagueParameters from "../../components/leagueParameters/LeagueParameters";
import LineupBuilder from "../../components/lineupBuilder/LineupBuilder";
import SubmitBuilder from "../../components/submitBuilder/SubmitBuilder";

export default function leagues() {
  return (
    <>
      <Topbar />
      <div className="leaguesContainer">
        <Leftbar />
        <div className="leaguesContentWrapper">
          <div className="leagueBuilder">
            <BuilderParameters />
            <LeagueParameters />
            <LineupBuilder />
            <SubmitBuilder />
          </div>
        </div>
      </div>
    </>
  );
}
