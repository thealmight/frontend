// src/context/GameContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { io } from 'socket.io-client';
import { supabase } from '../lib/supabaseClient';
// const socket = io(import.meta.env.VITE_SOCKET_URL);
const GameContext = createContext();

export const GameProvider = ({ children }) => {
  // Game state
  const [gameId, setGameId] = useState(null);
  const [rounds, setRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(0);
  const [isRoundsFinalized, setRoundsFinalized] = useState(false);
  const [isGameEnded, setGameEnded] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [timeLeft, setTimeLeft] = useState(900);

  // User state
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Game data
  const [countries] = useState(['USA', 'China', 'Germany', 'Japan', 'India']);
  
  // Function to assign a country to a player
  const assignCountryToPlayer = useCallback((playerId) => {
    // Find the player in onlineUsers
    const player = onlineUsers.find(user => user.id === playerId);
    if (!player) return null;
    
    // If player already has a country assigned, return it
    if (player.country) return player.country;
    
    // Find countries that are not yet assigned
    const assignedCountries = onlineUsers
      .filter(user => user.country)
      .map(user => user.country);
    
    const availableCountries = countries.filter(country =>
      !assignedCountries.includes(country)
    );
    
    // If no countries are available, return null
    if (availableCountries.length === 0) return null;
    
    // Assign a random available country
    const assignedCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)];
    
    return assignedCountry;
  }, [onlineUsers, countries]);
  const [products] = useState(['Steel', 'Grain', 'Oil', 'Electronics', 'Textiles']);
  const [production, setProduction] = useState([]);
  const [demand, setDemand] = useState([]);
  const [tariffRates, setTariffRates] = useState([]);
  const [tariffHistory, setTariffHistory] = useState([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);

  // Socket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !authUser) {
        if (socket) socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        return;
      }

      if (socket) socket.disconnect();

      const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token: session.access_token },
        withCredentials: true,
        autoConnect: true,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => setIsConnected(true));
      newSocket.on('disconnect', () => setIsConnected(false));
      newSocket.on('onlineUsers', setOnlineUsers);
      newSocket.on('userStatusUpdate', (update) => {
        setOnlineUsers((prev) => {
          const filtered = prev.filter((u) => u.id !== update.userId);
          // If user is coming online and doesn't have a country assigned, assign one
          if (update.isOnline && !update.country) {
            const assignedCountry = assignCountryToPlayer(update.userId);
            if (assignedCountry) {
              update.country = assignedCountry;
              // Emit event to notify other clients of country assignment
              if (socket) {
                socket.emit('countryAssigned', { userId: update.userId, country: assignedCountry });
              }
            }
          }
          return update.isOnline ? [...filtered, update] : filtered;
        });
      });
      
      // Handle request for country assignment
      newSocket.on('requestCountryAssignment', (data) => {
        const assignedCountry = assignCountryToPlayer(data.userId);
        if (assignedCountry) {
          // Emit event to notify client of country assignment
          newSocket.emit('countryAssigned', { userId: data.userId, country: assignedCountry });
          
          // Update onlineUsers to reflect the country assignment
          setOnlineUsers((prev) =>
            prev.map(user =>
              user.id === data.userId ? { ...user, country: assignedCountry } : user
            )
          );
        }
      });

      newSocket.on('gameStateChanged', (data) => {
        if (data.gameId) {
          setGameId(data.gameId);
          localStorage.setItem('gameId', data.gameId);
        }
        if (data.currentRound !== undefined) {
          setCurrentRound(data.currentRound);
          localStorage.setItem('currentRound', data.currentRound);
        }
        if (data.status) setGameStatus(data.status);
        if (data.totalRounds) setRounds(data.totalRounds);
        if (data.isEnded !== undefined) setGameEnded(data.isEnded);
      });

      newSocket.on('roundTimerUpdated', (data) => {
        setTimeLeft(data.timeRemaining);
        setCurrentRound(data.currentRound);
        localStorage.setItem('currentRound', data.currentRound);
      });

      newSocket.on('tariffUpdated', (data) => {
        setTariffRates((prev) => {
          const filtered = prev.filter(
            (t) =>
              !(
                t.product === data.product &&
                t.fromCountry === data.fromCountry &&
                t.toCountry === data.toCountry &&
                t.roundNumber === data.roundNumber
              )
          );
          return [...filtered, data];
        });

        setTariffHistory((prev) => [
          ...prev,
          {
            round: data.roundNumber,
            player: data.updatedBy,
            country: data.fromCountry,
            tariffs: { [data.product]: data.rate },
            submittedAt: data.updatedAt,
          },
        ]);
      });

      newSocket.on('newMessage', (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      newSocket.on('gameDataUpdated', (data) => {
        if (data.production) setProduction(data.production);
        if (data.demand) setDemand(data.demand);
        if (data.tariffRates) setTariffRates(data.tariffRates);
      });

      setSocket(newSocket);
    };

    initSocket();
    return () => socket?.disconnect();
  }, [authUser]);

  // Helper function to generate production and demand data with constraints
  const generateProductionDemandData = () => {
    const countries = ['USA', 'China', 'Germany', 'Japan', 'India'];
    const products = ['Steel', 'Grain', 'Oil', 'Electronics', 'Textiles'];
    
    // Initialize production and demand arrays
    const production = [];
    const demand = [];
    
    // Track which products each country produces
    const countryProductions = {};
    countries.forEach(country => {
      countryProductions[country] = [];
    });
    
    // Assign 2-3 products to each country for production
    products.forEach(product => {
      // Shuffle countries to randomize assignment
      const shuffledCountries = [...countries].sort(() => Math.random() - 0.5);
      
      // Each product is produced by 2-3 countries (to ensure total production can reach 100)
      const numProducers = Math.floor(Math.random() * 2) + 2; // 2 or 3
      const producingCountries = shuffledCountries.slice(0, numProducers);
      
      // Distribute 100 units of production among producing countries
      let remainingProduction = 100;
      producingCountries.forEach((country, index) => {
        // For the last country, assign all remaining production
        const quantity = (index === producingCountries.length - 1) 
          ? remainingProduction 
          : Math.floor(Math.random() * (remainingProduction - (producingCountries.length - index - 1))) + 1;
        
        production.push({
          country,
          product,
          quantity
        });
        
        countryProductions[country].push(product);
        remainingProduction -= quantity;
      });
    });
    
    // Assign demand for each product to countries that don't produce it
    products.forEach(product => {
      // Find countries that don't produce this product
      const nonProducingCountries = countries.filter(country => 
        !countryProductions[country].includes(product)
      );
      
      // Distribute 100 units of demand among non-producing countries
      let remainingDemand = 100;
      nonProducingCountries.forEach((country, index) => {
        // For the last country, assign all remaining demand
        const quantity = (index === nonProducingCountries.length - 1) 
          ? remainingDemand 
          : Math.floor(Math.random() * (remainingDemand - (nonProducingCountries.length - index - 1))) + 1;
        
        demand.push({
          country,
          product,
          quantity
        });
        
        remainingDemand -= quantity;
      });
    });
    
    return { production, demand };
  };

  const createGame = async (totalRounds = 5) => {
    // Generate production and demand data with constraints
    const { production, demand } = generateProductionDemandData();
    
    const { data, error } = await supabase
      .from('games')
      .insert([{ 
        totalRounds,
        production,
        demand,
        tariffRates: [] // Initialize with empty tariff rates
      }])
      .select()
      .single();

    if (error) throw error;

    setGameId(data.id);
    setRounds(totalRounds);
    setGameStatus('waiting');
    setCurrentRound(0);
    setGameEnded(false);
    setRoundsFinalized(false);
    setProduction(production);
    setDemand(demand);

    return data;
  };

  const startGame = async () => {
    if (!gameId) throw new Error('No game ID');

    const { error } = await supabase
      .from('games')
      .update({ status: 'active', currentRound: 1 })
      .eq('id', gameId);

    if (error) throw error;

    setGameStatus('active');
    setCurrentRound(1);
    setRoundsFinalized(true);
    setTimeLeft(900);

    socket?.emit('gameStateUpdate', {
      gameId,
      status: 'active',
      currentRound: 1,
      isStarted: true,
    });
  };

  const startNextRound = async () => {
    if (!gameId) throw new Error('No game ID');

    const nextRound = currentRound + 1;

    const { error } = await supabase
      .from('games')
      .update({ currentRound: nextRound })
      .eq('id', gameId);

    if (error) throw error;

    setCurrentRound(nextRound);
    setTimeLeft(900);

    socket?.emit('gameStateUpdate', {
      gameId,
      currentRound: nextRound,
      timeRemaining: 900,
    });
  };

  const endGame = async () => {
    if (!gameId) throw new Error('No game ID');

    const { error } = await supabase
      .from('games')
      .update({ status: 'ended', isEnded: true })
      .eq('id', gameId);

    if (error) throw error;

    setGameStatus('ended');
    setGameEnded(true);

    socket?.emit('gameStateUpdate', {
      gameId,
      status: 'ended',
      isEnded: true,
    });
  };

  const submitTariffs = async (tariffChanges) => {
    if (!gameId || !authUser) throw new Error('Missing game or user');

    const payload = tariffChanges.map((change) => ({
      gameId,
      roundNumber: currentRound,
      product: change.product,
      fromCountry: authUser.country,
      toCountry: change.toCountry,
      rate: change.rate,
      updatedBy: authUser.id,
    }));

    const { error } = await supabase.from('tariffs').insert(payload);

    if (error) throw error;

    payload.forEach((change) => {
      socket?.emit('tariffUpdate', change);
    });
  };

  const loadGameData = useCallback(async () => {
    if (!gameId) return;

    try {
      let data;
      if (authUser?.role === 'operator') {
        const res = await supabase
          .from('games')
          .select('production, demand, tariffRates')
          .eq('id', gameId)
          .single();
        data = res.data;
      } else {
        const res = await supabase
          .rpc('get_player_data', { game_id: gameId, round: currentRound });
        data = res.data;
      }

      setProduction(data?.production || []);
      setDemand(data?.demand || []);
      setTariffRates(data?.tariffRates || []);
      setCurrentRound(parseInt(localStorage.getItem('currentRound')) || 0);
    } catch (error) {
      console.error('Load game data error:', error);
    }
  }, [gameId, currentRound, authUser]);

  const logout = async () => {
    await supabase.auth.signOut();

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('gameId');
    localStorage.removeItem('currentRound');

    if (socket) {
      socket.disconnect();
    }

    setAuthUser(null);
    setSocket(null);
    setIsConnected(false);

    // Reset all game state
    setGameId(null);
    setCurrentRound(0);
    setGameStatus('waiting');
    setRoundsFinalized(false);
    setGameEnded(false);
    setProduction([]);
    setDemand([]);
    setTariffRates([]);
    setTariffHistory([]);
    setChatMessages([]);
    setOnlineUsers([]);
  };

  // Generic API call function
  const apiCall = async (endpoint, options = {}) => {
    const url = `${import.meta.env.VITE_API_URL || ''}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  };

  // Provide all state & actions via context
  const value = {
    // Game state
    gameId,
    setGameId,
    rounds,
    setRounds,
    currentRound,
    setCurrentRound,
    isRoundsFinalized,
    setRoundsFinalized,
    isGameEnded,
    setGameEnded,
    gameStatus,
    timeLeft,
    setTimeLeft,

    // User state
    authUser,
    setAuthUser,
    onlineUsers,

    // Game data
    countries,
    products,
    production,
    setProduction,
    demand,
    setDemand,
    tariffRates,
    setTariffRates,
    tariffHistory,

    // Chat
    chatMessages,
    sendChatMessage: (content, messageType = 'group', recipientCountry = null) => {
      if (!socket || !gameId) return;

      socket.emit('sendMessage', {
        gameId,
        content,
        messageType,
        recipientCountry,
      });
    },

    // Socket
    socket,
    isConnected,

    // Actions
    createGame,
    startGame,
    startNextRound,
    endGame,
    submitTariffs,
    loadGameData,
    logout,
    
    // Country assignment
    assignCountryToPlayer,
    
    // API call function
    apiCall,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
