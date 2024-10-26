import React, { useCallback, useEffect, useState } from "react";

const Timer = ({ startTime, endTime }) => {
  const [countDownTime, setCountDownTime] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const getTimeDifference = (targetTime) => {
    const currentTime = new Date().getTime();
    const timeDifference = targetTime - currentTime;
    
    if (timeDifference < 0) {
      setCountDownTime({
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      });
      return;
    }

    const days = Math.floor(timeDifference / (24 * 60 * 60 * 1000)).toString().padStart(2, '0');
    const hours = Math.floor((timeDifference % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((timeDifference % (60 * 60 * 1000)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((timeDifference % (60 * 1000)) / 1000).toString().padStart(2, '0');
    
    setCountDownTime({
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
    });
  };

  const startCountDown = useCallback(() => {
    const currentTime = new Date().getTime();
    const countDownTarget = currentTime < new Date(startTime).getTime() ? new Date(startTime).getTime() : new Date(endTime).getTime();
    
    const interval = setInterval(() => {
      getTimeDifference(countDownTarget);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  useEffect(() => {
    startCountDown();
  }, [startCountDown]);

  return (
    <div className="flex justify-center gap-2 xl:gap-4">
      <div className="flex flex-col justify-center items-center gap-1 relative">
        <div className="h-8 w-8 flex justify-center items-center bg-safemoon-dark dark:bg-white rounded-2xl">
          <span className="text-xs lg:text-sm font-semibold text-white dark:text-black">
            {countDownTime?.days}
          </span>
        </div>
        <span className="text-safemoon-dark dark:text-white text-xs text-center">
          {countDownTime?.days == 1 ? "day" : "days"}
        </span>
      </div>
      <div className="flex flex-col justify-center items-center gap-1 relative">
        <div className="h-8 w-8 flex justify-center items-center bg-safemoon-dark dark:bg-white rounded-2xl">
          <span className="text-xs lg:text-sm font-semibold text-white dark:text-black">
            {countDownTime?.hours}
          </span>
        </div>
        <span className="text-safemoon-dark dark:text-white text-xs text-center">
          {countDownTime?.hours == 1 ? "hour" : "hours"}
        </span>
      </div>
      <div className="flex flex-col justify-center items-center gap-1 relative">
        <div className="h-8 w-8 flex justify-center items-center bg-safemoon-dark dark:bg-white rounded-2xl">
          <span className="text-xs lg:text-sm font-semibold text-white dark:text-black">
            {countDownTime?.minutes}
          </span>
        </div>
        <span className="text-safemoon-dark dark:text-white text-xs text-center">
          mins.
        </span>
      </div>
      <div className="flex flex-col justify-center items-center gap-1 relative">
        <div className="h-8 w-8 flex justify-center items-center bg-safemoon-dark dark:bg-white rounded-2xl">
          <span className="text-xs lg:text-sm font-semibold text-white dark:text-black">
            {countDownTime?.seconds}
          </span>
        </div>
        <span className="text-safemoon-dark dark:text-white text-xs text-center">
          secs.
        </span>
      </div>
    </div>
  );
};

export default Timer;
