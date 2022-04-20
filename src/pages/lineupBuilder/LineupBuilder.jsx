import React from "react";
import "./lineupBuilder.css";
import Topbar from "../../components/topbar/Topbar";
import Leftbar from "../../components/leftbar/Leftbar";
import Builder from "../../components/builder/Buider";

export default function LineupBuilder() {
  return (
    <>
      <Topbar />
      <div className="lineupBuilderContainer">
        <Leftbar />
        <Builder />
      </div>
    </>
  );
}
