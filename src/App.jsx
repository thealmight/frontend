import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import LoginPage from './pages/LoginPage';
import OperatorDashboard from './pages/OperatorDashboard';
import PlayerDashboard from './pages/PlayerDashboard';

function App() {
  return (
    <GameProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/operator" element={<OperatorDashboard />} />
          <Route path="/player" element={<PlayerDashboard />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}

export default App;
