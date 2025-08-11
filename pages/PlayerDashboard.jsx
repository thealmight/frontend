import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import useCountdown from '../hooks/useCountdown';

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const {
    socket,
    isConnected,
    authUser,
    gameId,
    rounds,
    currentRound,
    isRoundsFinalized,
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
    chatMessages,
    submitTariffs,
    loadGameData,
    sendChatMessage,
    logout,
    apiCall,
    setProduction,
    setDemand,
    setTariffRates
  } = useGame();

  const [tariffInputs, setTariffInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatType, setChatType] = useState('group');
  const [recipientCountry, setRecipientCountry] = useState('');
  const [playerTariffStatus, setPlayerTariffStatus] = useState(null);

  // Authentication check & redirect
  useEffect(() => {
    if (!authUser) {
      navigate('/');
      return;
    }
    if (authUser.role !== 'player') {
      navigate('/operator');
      return;
    }
  }, [authUser, navigate]);

  // Subscribe to gameDataUpdated socket event safely
  useEffect(() => {
    if (!socket) return;

    const handler = ({ production, demand, tariffRates }) => {
      setProduction(production);
      setDemand(demand);
      setTariffRates(tariffRates);
    };

    socket.on('gameDataUpdated', handler);
    return () => {
      socket.off('gameDataUpdated', handler);
    };
  }, [socket, setProduction, setDemand, setTariffRates]);

  // Load game data and player tariff status on gameId or round change
  useEffect(() => {
    if (gameId && currentRound > 0) {
      loadGameData();
      loadPlayerTariffStatus();
    }
  }, [gameId, currentRound]);

  // Initialize tariff inputs for player's country production
  useEffect(() => {
    if (!authUser?.country) return;

    if (production.length > 0 && demand.length > 0) {
      const inputs = {};

      production.forEach(prod => {
        const demandingCountries = demand
          .filter(d => d.product === prod.product && d.country !== authUser.country)
          .map(d => d.country);

        demandingCountries.forEach(country => {
          const key = `${prod.product}-${country}`;
          const existingTariff = tariffRates.find(t =>
            t.product === prod.product &&
            t.fromCountry === authUser.country &&
            t.toCountry === country &&
            t.roundNumber === currentRound
          );
          inputs[key] = existingTariff ? existingTariff.rate.toString() : '';
        });
      });

      setTariffInputs(inputs);
    }
  }, [production, demand, tariffRates, authUser?.country, currentRound]);

  // Countdown timer
  useCountdown(timeLeft, setTimeLeft, gameStatus === 'active' && !isGameEnded);

  const loadPlayerTariffStatus = async () => {
    if (!gameId || currentRound === 0) return;
    try {
      const data = await apiCall(`/game/${gameId}/tariffs/player-status/${currentRound}`);
      setPlayerTariffStatus(data);
    } catch (error) {
      console.error('Load player tariff status error:', error);
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleTariffInputChange = (key, value) => {
    const numValue = parseFloat(value);
    if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
      return;
    }
    setTariffInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitTariffs = async () => {
    if (!authUser?.country || currentRound === 0) {
      setError('Cannot submit tariffs at this time');
      return;
    }

    const tariffChanges = [];
    Object.entries(tariffInputs).forEach(([key, value]) => {
      if (value !== '') {
        const [product, toCountry] = key.split('-');
        tariffChanges.push({
          product,
          toCountry,
          rate: parseFloat(value)
        });
      }
    });

    if (tariffChanges.length === 0) {
      setError('Please enter at least one tariff rate');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await submitTariffs(tariffChanges);

      const errors = result.results.filter(r => r.error);
      const successes = result.results.filter(r => r.success);

      if (errors.length > 0) {
        setError(`Some tariffs failed: ${errors.map(e => e.error).join(', ')}`);
      }

      if (successes.length > 0) {
        setSuccess(`Successfully updated ${successes.length} tariff rate(s)`);
        await loadPlayerTariffStatus();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    sendChatMessage(
      chatInput.trim(),
      chatType,
      chatType === 'private' ? recipientCountry : null
    );
    setChatInput('');
  };

  const getProductionForCountry = (country) => production.filter(p => p.country === country);
  const getDemandForCountry = (country) => demand.filter(d => d.country === country);

  const playerCountry = authUser?.country || '';
  const playerProduction = getProductionForCountry(playerCountry);
  const playerDemand = getDemandForCountry(playerCountry);
  const onlinePlayers = onlineUsers.filter(user => user.role === 'player');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Player Dashboard</h1>
            <p className="text-gray-600">
              Welcome, {authUser?.username} - Representing {playerCountry}
            </p>
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

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Game Status */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Game Status</h3>
              <p className="text-lg font-semibold capitalize text-blue-600">{gameStatus}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Current Round</h3>
              <p className="text-lg font-semibold">{currentRound} of {rounds}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Time Remaining</h3>
              <p className="text-lg font-semibold text-indigo-600">
                {gameStatus === 'active' && !isGameEnded ? formatTime(timeLeft) : 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Online Players</h3>
              <p className="text-lg font-semibold">{onlinePlayers.length}/5</p>
            </div>
          </div>

          {gameStatus === 'waiting' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800">
                Waiting for operator to start the game. Need all 5 players online.
              </p>
            </div>
          )}

          {isGameEnded && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">
                Game has ended. Thank you for participating!
              </p>
            </div>
          )}
        </div>

        {/* Production and Demand */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Production */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Production ({playerCountry})</h2>
            {playerProduction.length > 0 ? (
              <div className="space-y-3">
                {playerProduction.map(prod => (
                  <div key={prod.product} className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-medium">{prod.product}</span>
                    <span className="text-lg font-bold text-green-600">{prod.quantity} units</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No production data available</p>
            )}
          </div>

          {/* Demand */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Demand ({playerCountry})</h2>
            {playerDemand.length > 0 ? (
              <div className="space-y-3">
                {playerDemand.map(dem => (
                  <div key={dem.product} className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-medium">{dem.product}</span>
                    <span className="text-lg font-bold text-blue-600">{dem.quantity} units</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No demand data available</p>
            )}
          </div>
        </div>

        {/* Tariff Management */}
        {gameStatus === 'active' && !isGameEnded && currentRound > 0 && playerProduction.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Manage Tariff Rates (Round {currentRound})</h2>

            {timeLeft === 0 ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded mb-4">
                <p className="text-red-800 font-medium">
                  Time's up! Tariff submissions are closed for this round.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Set tariff rates for products your country produces. Rates must be between 0-100%.
                </p>

                <div className="space-y-4 mb-6">
                  {playerProduction.map(prod => {
                    const demandingCountries = demand
                      .filter(d => d.product === prod.product && d.country !== playerCountry)
                      .map(d => d.country);

                    if (demandingCountries.length === 0) return null;

                    return (
                      <div key={prod.product} className="border rounded-lg p-4">
                        <h3 className="font-medium text-lg mb-3">{prod.product} (You produce {prod.quantity} units)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {demandingCountries.map(country => {
                            const key = `${prod.product}-${country}`;
                            const demandQuantity = demand.find(d => d.product === prod.product && d.country === country)?.quantity;

                            return (
                              <div key={country} className="border rounded p-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  To {country} (demands {demandQuantity} units)
                                </label>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={tariffInputs[key] || ''}
                                    onChange={(e) => handleTariffInputChange(key, e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="0-100"
                                  />
                                  <span className="ml-2 text-gray-500">%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleSubmitTariffs}
                  disabled={loading || timeLeft === 0}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : `Submit Tariffs for Round ${currentRound}`}
                </button>
              </>
            )}
          </div>
        )}

        {/* Current Tariff Rates */}
        {playerDemand.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Tariff Rates for Your Imports</h2>
            <p className="text-gray-600 mb-4">
              These are the tariff rates other countries charge for products you need.
            </p>

            <div className="space-y-4">
              {playerDemand.map(dem => {
                const producingCountries = production
                  .filter(p => p.product === dem.product && p.country !== playerCountry)
                  .map(p => ({ country: p.country, quantity: p.quantity }));

                if (producingCountries.length === 0) return null;

                return (
                  <div key={dem.product} className="border rounded-lg p-4">
                    <h3 className="font-medium text-lg mb-3">
                      {dem.product} (You need {dem.quantity} units)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {producingCountries.map(({ country, quantity }) => {
                        const currentTariff = tariffRates.find(t =>
                          t.product === dem.product &&
                          t.fromCountry === country &&
                          t.toCountry === playerCountry &&
                          t.roundNumber <= currentRound
                        );

                        return (
                          <div key={country} className="border rounded p-3 bg-gray-50">
                            <div className="font-medium">{country}</div>
                            <div className="text-sm text-gray-600">Produces {quantity} units</div>
                            <div className="text-lg font-bold text-red-600">
                              Tariff: {currentTariff ? `${currentTariff.rate}%` : 'Not set'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Game Chat</h2>

          {/* Chat Messages */}
          <div className="border rounded-lg mb-4 h-64 overflow-y-auto p-4 bg-gray-50">
            {chatMessages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet...</p>
            ) : (
              chatMessages.map((message, idx) => (
                <div key={message.id || idx} className="mb-2">
                  <span className="font-medium text-blue-600">
                    {message.senderCountry}
                    {message.messageType === 'private' && message.recipientCountry && (
                      <span className="text-xs text-gray-500"> → {message.recipientCountry}</span>
                    )}:
                  </span>
                  <span className="ml-2">{message.content}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(message.sentAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="group"
                  checked={chatType === 'group'}
                  onChange={(e) => setChatType(e.target.value)}
                  className="mr-2"
                />
                Group Chat
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="private"
                  checked={chatType === 'private'}
                  onChange={(e) => setChatType(e.target.value)}
                  className="mr-2"
                />
                Private Message
              </label>
            </div>

            {chatType === 'private' && (
              <select
                value={recipientCountry}
                onChange={(e) => setRecipientCountry(e.target.value)}
                className="p-2 border rounded"
                required
              >
                <option value="">Select recipient country</option>
                {countries.filter(c => c !== playerCountry).map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={chatType === 'group' ? 'Type a message to all players...' : 'Type a private message...'}
                className="flex-1 p-2 border rounded"
                required
              />
              <button
                type="submit"
                disabled={chatType === 'private' && !recipientCountry}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
