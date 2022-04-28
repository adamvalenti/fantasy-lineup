import React from "react";
import Home from "./pages/home/Home.jsx";
import Login from "./pages/login/Login.jsx";
import Profile from "./pages/profile/Profile.jsx";
import Register from "./pages/register/Register.jsx";
import Lineups from "./pages/lineups/Lineups.jsx";
import Leagues from "./pages/leagues/Leagues.jsx";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/login" element={<Login />} />
        <Route exact path="/Profile/:username" element={<Profile />} />
        <Route exact path="/register" element={<Register />} />
        <Route exact path="/lineups" element={<Lineups />} />
        <Route exact path="/leagues" element={<Leagues />} />
      </Routes>
    </Router>
  );
}

export default App;
