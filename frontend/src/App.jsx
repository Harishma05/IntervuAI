import InterviewSession from "./pages/InterviewSession";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import InterviewSetup from "./pages/InterviewSetup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/interview"
          element={<InterviewSetup />}
        />
        <Route
    path="/session"
    element={<InterviewSession />}
  />
      </Routes>
    </BrowserRouter>
  );
}

export default App;