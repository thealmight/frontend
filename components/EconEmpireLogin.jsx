import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EconEmpireLogin() {
  const navigate = useNavigate();

  const handleOperatorLogin = () => {
    navigate('/operator');
  };

  const handlePlayerLogin = () => {
    navigate('/player');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-empirePurple via-empirePink to-empireOrange text-white font-sans px-4 py-8 relative overflow-hidden">
      {/* Glowing background bubbles */}
      <div className="absolute inset-0 z-0">
        <div className="absolute w-72 h-72 bg-pink-400 opacity-30 rounded-full blur-3xl top-10 left-10 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500 opacity-20 rounded-full blur-3xl bottom-20 right-20 animate-ping"></div>
      </div>

      <div className="z-10 text-center mb-8">
        <h1 className="text-6xl font-serif font-bold drop-shadow-lg">Econ Empire</h1>
        <h2 className="text-2xl mt-2 font-light">Strategic Economic Simulation</h2>
        <p className="mt-4 text-lg font-medium">
          Master production, demand, and tariffs in real-time multiplayer gameplay
        </p>
      </div>

      <div className="z-10 bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 w-full max-w-md shadow-2xl border border-white border-opacity-20">
        <h3 className="text-2xl font-bold mb-4 text-center">Enter the Empire</h3>
        <p className="text-red-300 text-sm mb-2">Unexpected end of JSON input</p>

        <input
          type="text"
          placeholder="Username"
          defaultValue="pavan"
          className="w-full mb-3 px-4 py-2 rounded bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-empirePink"
        />
        <input
          type="password"
          placeholder="Enter password (optional)"
          className="w-full mb-4 px-4 py-2 rounded bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-empirePink"
        />
        <button className="w-full bg-empireBlue hover:bg-empirePurple text-white font-bold py-2 px-4 rounded transition duration-300 shadow-md">
          Login
        </button>

        <div className="mt-6 text-center">
          <h4 className="text-lg font-semibold mb-2">Quick Login Options:</h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleOperatorLogin}
              className="bg-empirePurple hover:bg-empirePink py-2 px-4 rounded font-bold transition duration-300"
            >
              Operator (Pavan)
            </button>
            <button
              onClick={handlePlayerLogin}
              className="bg-empirePurple hover:bg-empirePink py-2 px-4 rounded font-bold transition duration-300"
            >
              Random Player
            </button>
          </div>
        </div>
      </div>

      <div className="z-10 mt-8 text-center text-white text-sm space-y-1">
        <p>• 5 Countries: USA, China, Germany, Japan, India</p>
        <p>• 5 Products: Steel, Grain, Oil, Electronics, Textiles</p>
        <p>• Real-time multiplayer with tariff negotiations</p>
        <p>• Round-based gameplay with live chat</p>
        <p>• Need all 5 players online to start the game</p>
      </div>
    </div>
  );
}
