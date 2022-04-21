import React from "react";
import "./leftbar.css";
import {
  ListAlt,
  ViewModule,
  Chat,
  PlayCircleFilledOutlined,
  Group,
  Bookmark,
  HelpOutline,
  WorkOutline,
  Event,
  School,
} from "@material-ui/icons";
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
              <span className="leftbarListItemText">All Players</span>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <ViewModule className="leftbarIcon" />
              <span className="leftbarListItemText">Create Lineup</span>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <PlayCircleFilledOutlined className="leftbarIcon" />
              <span className="leftbarListItemText">Videos</span>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <Group className="leftbarIcon" />
              <span className="leftbarListItemText">Groups</span>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <Bookmark className="leftbarIcon" />
              <span className="leftbarListItemText">Bookmarks</span>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <HelpOutline className="leftbarIcon" />
              <span className="leftbarListItemText">Questions</span>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <WorkOutline className="leftbarIcon" />
              <span className="leftbarListItemText">Jobs</span>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <Event className="leftbarIcon" />
              <span className="leftbarListItemText">Events</span>
            </li>
          </Link>
          <Link to="/lineupBuilder" className="leftbarLink">
            <li className="leftbarListItem">
              <School className="leftbarIcon" />
              <span className="leftbarListItemText">Courses</span>
            </li>
          </Link>
        </ul>
        <button className="leftbarButton">Show More</button>
        <hr className="leftbarHr" />
        <ul className="leftbarFriendList">
          {Users.map((u) => (
            <CloseFriend key={u.id} user={u} />
          ))}
        </ul>
      </div>
    </div>
  );
}
