import { useEffect, useRef } from 'react';

const useCountdown = (timeLeft, setTimeLeft, isActive) => {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive && intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, setTimeLeft]);
};

export default useCountdown;
