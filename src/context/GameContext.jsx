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
          return update.isOnline ? [...filtered, update] : filtered;
        });
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

  const createGame = async (totalRounds = 5) => {
    const { data, error } = await supabase
      .from('games')
      .insert([{ totalRounds }])
      .select()
      .single();

    if (error) throw error;

    setGameId(data.id);
    setRounds(totalRounds);
    setGameStatus('waiting');
    setCurrentRound(0);
    setGameEnded(false);
    setRoundsFinalized(false);

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
