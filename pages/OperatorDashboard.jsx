import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import useCountdown from '../hooks/useCountdown';

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const {
    socket,
    isConnected,
    authUser,
    gameId,
    rounds,
    setRounds,
    currentRound,
    isRoundsFinalized,
    setRoundsFinalized,
    isGameEnded,
    gameStatus,
    timeLeft,
    setTimeLeft,
    onlineUsers,
    countries,
    products,
    production,
    demand,
    tariffRates,
    tariffHistory,
    chatMessages,
    createGame,
    startGame,
    startNextRound,
    endGame,
    loadGameData,
    sendChatMessage,
    logout,
    apiCall
  } = useGame();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [tariffMatrix, setTariffMatrix] = useState({});
  const [chatInput, setChatInput] = useState('');

  // Redirect non-auth or non-operator users
  useEffect(() => {
    if (!authUser) {
      navigate('/');
      return;
    }
    if (authUser.role !== 'operator') {
      navigate('/player');
      return;
    }
  }, [authUser, navigate]);

  // Load game data on gameId or currentRound change
  useEffect(() => {
    if (gameId) {
      loadGameData();
    }
  }, [gameId, currentRound]);

  // Countdown timer hook
  useCountdown(timeLeft, setTimeLeft, gameStatus === 'active' && !isGameEnded);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleCreateGame = async () => {
    setLoading(true);
    setError('');
    try {
      await createGame(rounds);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    const onlinePlayers = onlineUsers.filter(user => user.role === 'player').length;
    if (onlinePlayers < 5) {
      setError(`Cannot start game. Need 5 players online, currently have ${onlinePlayers}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await startGame();
      setRoundsFinalized(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    setLoading(true);
    setError('');
    try {
      await startNextRound();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndGame = async () => {
    setLoading(true);
    setError('');
    try {
      await endGame();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetGame = async () => {
    if (!gameId) return;
    setLoading(true);
    setError('');
    try {
      await apiCall(`/game/${gameId}/reset`, { method: 'POST' });
      await loadGameData();
      setRoundsFinalized(false);
      setGameEnded(false);
      setCurrentRound(0);
      setGameStatus('waiting');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTariffMatrix = async (product) => {
    if (!gameId || !product) return;
    try {
      const data = await apiCall(`/game/${gameId}/tariffs/matrix/${product}?roundNumber=${currentRound}`);
      setTariffMatrix(prev => ({ ...prev, [product]: data.matrix }));
    } catch (error) {
      console.error('Load tariff matrix error:', error);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const exportTariffHistory = () => {
    if (tariffHistory.length === 0) return;

    const csv = [
      ['Round', 'Country', 'Player', 'Product', 'Rate', 'Submitted At'].join(','),
      ...tariffHistory.flatMap(entry =>
        Object.entries(entry.tariffs).map(([product, rate]) => [
          entry.round,
          entry.country,
          entry.player || entry.submitter?.username || 'Unknown',
          product,
          rate,
          new Date(entry.submittedAt).toLocaleString()
        ].join(','))
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tariff_history_round${currentRound}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onlinePlayers = onlineUsers.filter(user => user.role === 'player');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Operator Dashboard</h1>
            <p className="text-gray-600">Welcome, {authUser?.username}</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Online Players Status */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Online Players ({onlinePlayers.length}/5)</h2>
          <div className="grid grid-cols-5 gap-4">
            {countries.map(country => {
              const player = onlinePlayers.find(p => p.country === country);
              return (
                <div
                  key={country}
                  className={`p-3 rounded-lg border-2 ${
                    player
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{country}</div>
                  <div className="text-sm text-gray-600">
                    {player ? player.username : 'Waiting...'}
                  </div>
                  <div className={`text-xs ${player ? 'text-green-600' : 'text-red-600'}`}>
                    {player ? '● Online' : '○ Offline'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Game Control</h2>

          {!gameId ? (
            <div>
              <label className="block mb-2 font-medium">Set Number of Rounds</label>
              <input
                type="number"
                value={rounds}
                onChange={e => setRounds(Number(e.target.value))}
                min="1"
                max="20"
                className="w-full p-2 border rounded mb-4"
              />
              <button
                onClick={handleCreateGame}
                disabled={loading}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          ) : gameStatus === 'waiting' ? (
            <div>
              <p className="text-green-700 font-medium mb-4">Game Created - ID: {gameId}</p>
              <p className="text-gray-700 mb-4">Total Rounds: {rounds}</p>
              <button
                onClick={handleStartGame}
                disabled={loading || onlinePlayers.length < 5}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition disabled:opacity-50 mr-3"
              >
                {loading ? 'Starting...' : 'Start Game'}
              </button>
              <button
                onClick={handleResetGame}
                disabled={loading}
                className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition disabled:opacity-50"
              >
                Reset Game
              </button>
            </div>
          ) : gameStatus === 'active' && !isGameEnded ? (
            <div>
              <p className="text-blue-700 font-medium mb-2">Game Active</p>
              <p className="text-gray-700 mb-2">Round {currentRound} of {rounds}</p>
              <p className="text-lg font-medium text-indigo-600 mb-4">
                Time Remaining: {formatTime(timeLeft)}
              </p>
              <div className="flex gap-3">
                {currentRound < rounds && (
                  <button
                    onClick={handleNextRound}
                    disabled={loading}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {timeLeft === 0 ? 'Start Next Round' : 'Finish Round Early'}
                  </button>
                )}
                <button
                  onClick={handleEndGame}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
                >
                  End Game
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-red-700 font-medium mb-4">Game Ended</p>
              <button
                onClick={handleResetGame}
                disabled={loading}
                className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition disabled:opacity-50 mr-3"
              >
                Reset Game
              </button>
              <button
                onClick={exportTariffHistory}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Export Tariff History
              </button>
            </div>
          )}
        </div>

        {/* Production and Demand Tables */}
        {gameId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Production Table */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Production Table</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left">Country</th>
                      {products.map(product => (
                        <th key={product} className="px-3 py-2 text-center">{product}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {countries.map(country => (
                      <tr key={country} className="border-t">
                        <td className="px-3 py-2 font-medium">{country}</td>
                        {products.map(product => {
                          const prod = production.find(p => p.country === country && p.product === product);
                          return (
                            <td key={product} className="px-3 py-2 text-center">
                              {prod ? prod.quantity : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Demand Table */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Demand Table</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left">Country</th>
                      {products.map(product => (
                        <th key={product} className="px-3 py-2 text-center">{product}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {countries.map(country => (
                      <tr key={country} className="border-t">
                        <td className="px-3 py-2 font-medium">{country}</td>
                        {products.map(product => {
                          const dem = demand.find(d => d.country === country && d.product === product);
                          return (
                            <td key={product} className="px-3 py-2 text-center">
                              {dem ? dem.quantity : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tariff Matrix */}
        {gameId && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Tariff Matrix</h2>
            <div className="mb-4">
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  if (e.target.value) {
                    loadTariffMatrix(e.target.value);
                  }
                }}
                className="p-2 border rounded"
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>

            {selectedProduct && tariffMatrix[selectedProduct] && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2">From \ To</th>
                      {countries.map(country => (
                        <th key={country} className="px-3 py-2 text-center">{country}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tariffMatrix[selectedProduct]).map(([fromCountry, rates]) => (
                      <tr key={fromCountry} className="border-t">
                        <td className="px-3 py-2 font-medium">{fromCountry}</td>
                        {countries.map(toCountry => (
                          <td key={toCountry} className="px-3 py-2 text-center">
                            {rates && rates[toCountry] ? `${rates[toCountry].rate}%` : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tariff History */}
        {tariffHistory.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tariff Submission History</h2>
              <button
                onClick={exportTariffHistory}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Round</th>
                    <th className="px-3 py-2 text-left">Country</th>
                    <th className="px-3 py-2 text-left">Player</th>
                    <th className="px-3 py-2 text-left">Time</th>
                    {products.map(product => (
                      <th key={product} className="px-3 py-2 text-center">{product}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tariffHistory.map((entry, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{entry.round}</td>
                      <td className="px-3 py-2">{entry.country}</td>
                      <td className="px-3 py-2">{entry.player || entry.submitter?.username || 'Unknown'}</td>
                      <td className="px-3 py-2 text-xs">
                        {new Date(entry.submittedAt).toLocaleTimeString()}
                      </td>
                      {products.map(product => (
                        <td key={product} className="px-3 py-2 text-center">
                          {entry.tariffs[product] !== undefined ? `${entry.tariffs[product]}%` : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Game Chat</h2>
          <div className="border rounded-lg mb-4 h-64 overflow-y-auto p-4 bg-gray-50">
            {chatMessages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet...</p>
            ) : (
              chatMessages.map((message, idx) => (
                <div key={message.id || idx} className="mb-2">
                  <span className="font-medium text-blue-600">{message.senderCountry}:</span>
                  <span className="ml-2">{message.content}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(message.sentAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
