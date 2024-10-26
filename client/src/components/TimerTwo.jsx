import { useCallback, useEffect, useState } from "react";
const Timer = ({startTime, endTime}) => {
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
    <div className="py-2 px-6 w-full text-center text-xs lg:text-sm font-semibold text-safemoon-dark dark:text-white border border-safemoon-dark dark:border-white rounded-2xl">
      {countDownTime?.days} : {countDownTime?.hours} : {countDownTime?.minutes}{" "}
      : {countDownTime?.seconds}
    </div>
  );
};
export default Timer;
