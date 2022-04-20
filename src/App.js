import React from "react";
import Home from "./pages/home/Home.jsx";
import Login from "./pages/login/Login.jsx";
import Profile from "./pages/profile/Profile.jsx";
import Register from "./pages/register/Register.jsx";
import LineupBuilder from "./pages/lineupBuilder/LineupBuilder.jsx";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/login" element={<Login />} />
        <Route exact path="/Profile/:username" element={<Profile />} />
        <Route exact path="/register" element={<Register />} />
        <Route exact path="/lineupbuilder" element={<LineupBuilder />} />
      </Routes>
    </Router>
  );
}

export default App;
