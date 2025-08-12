import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useGame } from '../context/GameContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuthUser } = useGame();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

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

      // Update context state
      setAuthUser(result.user);

      // Navigate based on role
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

  // Quick login with auto-submit
  const handleQuickLogin = async (userType) => {
    setLoading(true);
    setError('');

    try {
      let email, pwd;
      if (userType === 'operator') {
        email = 'pavan@example.com';
        pwd = 'password123';
      } else {
        email = `player${Math.floor(Math.random() * 10000)}@example.com`;
        pwd = 'password123';
      }

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
              username: userType === 'operator' ? 'pavan' : email.split('@')[0],
            },
          },
        });

        if (signUpError) {
          // If sign up fails, try to sign in again (user might already exist)
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: pwd,
          });

          if (signInError) throw signInError;
          data.session = signInData.session;
        } else {
          // Wait a bit for the user to be created in the database
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to sign in again
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: pwd,
          });

          if (signInError) throw signInError;
          data.session = signInData.session;
        }
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

      // Update context state
      setAuthUser(result.user);

      // Navigate based on role
      if (result.user.role === 'operator') {
        navigate('/operator');
      } else {
        navigate('/player');
      }
    } catch (err) {
      console.error('Quick login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black bg-opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Econ Empire</h1>
          <p className="text-xl text-blue-200 mb-2">Strategic Economic Simulation</p>
          <p className="text-sm text-blue-300">
            Master production, demand, and tariffs in real-time multiplayer gameplay
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Enter the Empire</h2>

          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-100 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter your email"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Quick Login Options */}
          <div className="mt-6 pt-6 border-t border-white border-opacity-20">
            <p className="text-sm text-blue-200 text-center mb-4">Quick Login Options:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickLogin('operator')}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200 disabled:opacity-50"
              >
                Operator (Pavan)
              </button>
              <button
                onClick={() => handleQuickLogin('player')}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium py-2 px-4 rounded-lg hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 disabled:opacity-50"
              >
                Random Player
              </button>
            </div>
          </div>

          {/* Game Info */}
          <div className="mt-6 pt-6 border-t border-white border-opacity-20">
            <div className="text-xs text-blue-300 space-y-1">
              <p>• 5 Countries: USA, China, Germany, Japan, India</p>
              <p>• 5 Products: Steel, Grain, Oil, Electronics, Textiles</p>
              <p>• Real-time multiplayer with tariff negotiations</p>
              <p>• Round-based gameplay with live chat</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-blue-300">Need all 5 players online to start the game</p>
        </div>
      </div>
    </div>
  );
}
