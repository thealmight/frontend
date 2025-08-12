import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import EconEmpireLogin from '../components/EconEmpireLogin';
import OperatorDashboard from './pages/OperatorDashboard';
import PlayerDashboard from './pages/PlayerDashboard';

function App() {
  return (
    <GameProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* 🎨 Colorful login screen at root */}
          <Route path="/" element={<EconEmpireLogin />} />

          {/* 🧭 Dashboards */}
          <Route path="/operator" element={<OperatorDashboard />} />
          <Route path="/player" element={<PlayerDashboard />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}

export default App;
