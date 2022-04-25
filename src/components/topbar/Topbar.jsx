import React from "react";
import "./topbar.css";
import { Search, Person } from "@material-ui/icons";

export default function Topbar() {
  return (
    <div className="topbarContainer">
      <div className="topbarLeft">
        <span className="logo">Fantasy DB</span>
        <div className="searchbar">
          <Search className="searchIcon" />
          <input placeholder="Search for a player" className="searchInput" />
        </div>
      </div>
      <div className="topbarRight">
        <Person className="topbarImg" />
        <div className="loginText">Login</div>
      </div>
    </div>
  );
}
