import React from "react";
import "./leftbar.css";
import { ListAlt, ViewModule, Group, EmojiEvents } from "@material-ui/icons";
import { Users } from "../../dummyData";
import CloseFriend from "../closeFriend/CloseFriend";
import { Link } from "react-router-dom";

export default function leftbar() {
  return (
    <div className="leftbar">
      <div className="leftbarWrapper">
        <ul className="leftbarList">
          <Link to="/" className="leftbarLink">
            <li className="leftbarListItem">
              <ListAlt className="leftbarIcon" />
              <div className="leftbarItemLabel">
                <div className="labelArrow"></div>
                <div className="labelBox">
                  <span className="labelText">Players</span>
                </div>
              </div>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <ViewModule className="leftbarIcon" />
              <div className="leftbarItemLabel">
                <div className="labelArrow"></div>
                <div className="labelBox">
                  <span className="labelText">Lineups</span>
                </div>
              </div>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <EmojiEvents className="leftbarIcon" />
              <div className="leftbarItemLabel">
                <div className="labelArrow"></div>
                <div className="labelBox">
                  <span className="labelText">Leagues</span>
                </div>
              </div>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <Group className="leftbarIcon" />
              <div className="leftbarItemLabel">
                <div className="labelArrow"></div>
                <div className="labelBox">
                  <span className="labelText">Friends</span>
                </div>
              </div>
            </li>
          </Link>
        </ul>
        {/* <ul className="leftbarFriendList">
          {Users.map((u) => (
            <CloseFriend key={u.id} user={u} />
          ))}
        </ul> */}
      </div>
    </div>
  );
}
