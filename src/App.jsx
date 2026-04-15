import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PickFashion from "./assets/Logo/PickFashion.jpeg";
import Home from "./components/Home";
import Kids from "./components/nav/Kids";
import Women from "./components/nav/Women";
import Men from "./components/nav/Men";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kids" element={<Kids />} />
        <Route path="/women" element={<Women />} />
        <Route path="/men" element={<Men />} />
      </Routes>
    </Router>
  );
}

export default App;
