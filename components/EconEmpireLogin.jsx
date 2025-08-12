import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/lib/supabaseClient';

export default function EconEmpireLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Attempt to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Call our backend login endpoint to create/get user profile
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to login');
      }

      // Store user data in localStorage
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Redirect based on role
      if (result.user.role === 'operator') {
        navigate('/operator');
      } else {
        navigate('/player');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // For demo purposes, we'll use a fixed email/password for operator
      // In a real application, users would have their own accounts
      const email = 'pavan@example.com';
      const pwd = 'password123';

      // Attempt to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });

      if (error) {
        // If user doesn't exist, create them
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: pwd,
          options: {
            data: {
              username: 'pavan',
            },
          },
        });

        if (signUpError) throw signUpError;

        // Try to sign in again
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: pwd,
        });

        if (signInError) throw signInError;
        data.session = signInData.session;
      }

      // Call our backend login endpoint to create/get user profile
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ email, password: pwd }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to login');
      }

      // Store user data in localStorage
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Redirect to operator dashboard
      navigate('/operator');
    } catch (err) {
      console.error('Operator login error:', err);
      setError(err.message || 'Failed to login as operator. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // For demo purposes, we'll use a random email/password for player
      // In a real application, users would have their own accounts
      const email = `player${Math.floor(Math.random() * 10000)}@example.com`;
      const pwd = 'password123';

      // Attempt to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });

      if (error) {
        // If user doesn't exist, create them
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: pwd,
          options: {
            data: {
              username: email.split('@')[0],
            },
          },
        });

        if (signUpError) throw signUpError;

        // Try to sign in again
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: pwd,
        });

        if (signInError) throw signInError;
        data.session = signInData.session;
      }

      // Call our backend login endpoint to create/get user profile
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ email, password: pwd }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to login');
      }

      // Store user data in localStorage
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Redirect to player dashboard
      navigate('/player');
    } catch (err) {
      console.error('Player login error:', err);
      setError(err.message || 'Failed to login as player. Please try again.');
    } finally {
      setLoading(false);
    }
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
      
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-3 px-4 py-2 rounded bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-empirePink"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 px-4 py-2 rounded bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-empirePink"
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-empireBlue hover:bg-empirePurple text-white font-bold py-2 px-4 rounded transition duration-300 shadow-md disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <h4 className="text-lg font-semibold mb-2">Quick Login Options:</h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleOperatorLogin}
              disabled={loading}
              className="bg-empirePurple hover:bg-empirePink py-2 px-4 rounded font-bold transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Operator (Pavan)'}
            </button>
            <button
              onClick={handlePlayerLogin}
              disabled={loading}
              className="bg-empirePurple hover:bg-empirePink py-2 px-4 rounded font-bold transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Random Player'}
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
