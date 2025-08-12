import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EconEmpireLogin() {
  const navigate = useNavigate();

  const handleOperatorLogin = () => {
    // TODO: Add Supabase or Socket.IO login logic here
    navigate('/operator');
  };

  const handlePlayerLogin = () => {
    // TODO: Add Supabase or Socket.IO login logic here
    navigate('/player');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-pink-600 to-orange-500 text-white font-sans px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-serif font-bold">Econ Empire</h1>
        <h2 className="text-xl mt-2">Strategic Economic Simulation</h2>
        <p className="mt-4 text-lg">
          Master production, demand, and tariffs in real-time multiplayer gameplay
        </p>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 w-full max-w-md shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-center">Enter the Empire</h3>
        <p className="text-red-300 text-sm mb-2">Unexpected end of JSON input</p>

        <input
          type="text"
          placeholder="Username"
          defaultValue="pavan"
          className="w-full mb-3 px-4 py-2 rounded bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <input
          type="password"
          placeholder="Enter password (optional)"
          className="w-full mb-4 px-4 py-2 rounded bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition">
          Login
        </button>

        <div className="mt-6 text-center">
          <h4 className="text-lg font-semibold mb-2">Quick Login Options:</h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleOperatorLogin}
              className="bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded font-bold"
            >
              Operator (Pavan)
            </button>
            <button
              onClick={handlePlayerLogin}
              className="bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded font-bold"
            >
              Random Player
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-white text-sm space-y-1">
        <p>• 5 Countries: USA, China, Germany, Japan, India</p>
        <p>• 5 Products: Steel, Grain, Oil, Electronics, Textiles</p>
        <p>• Real-time multiplayer with tariff negotiations</p>
        <p>• Round-based gameplay with live chat</p>
        <p>• Need all 5 players online to start the game</p>
      </div>
    </div>
  );
}
