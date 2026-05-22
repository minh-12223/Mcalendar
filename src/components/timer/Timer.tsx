interface TimerProps {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  timerMode: "pomodoro" | "shortBreak" | "longBreak";
  setTimerMode: React.Dispatch<
    React.SetStateAction<"pomodoro" | "shortBreak" | "longBreak">
  >;
  isBreak: boolean;
  setIsBreak: React.Dispatch<React.SetStateAction<boolean>>;
  pomodoroTime: number;
  setPomodoroTime: React.Dispatch<React.SetStateAction<number>>;
  breakTime: number;
  setBreakTime: React.Dispatch<React.SetStateAction<number>>;
  stopwatchSeconds: number;
  setStopwatchSeconds: React.Dispatch<React.SetStateAction<number>>;
}

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addDiamonds, incrementStreak } from "../../store/userSlice.js";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  BookOpen,
  Diamond,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Timer: React.FC<TimerProps> = ({
  timeLeft,
  setTimeLeft,
  isRunning,
  setIsRunning,
  timerMode,
  setTimerMode,
  isBreak,
  setIsBreak,
  pomodoroTime,
  setPomodoroTime,
  breakTime,
  setBreakTime,
  stopwatchSeconds,
  setStopwatchSeconds,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const dispatch = useDispatch();

  // ĐÃ XÓA useEffect chạy giây ở đây vì nó đã được chuyển lên App.tsx để chạy ngầm

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    if (timerMode === "pomodoro") {
      setTimeLeft(isBreak ? breakTime * 60 : pomodoroTime * 60);
    } else {
      setStopwatchSeconds(0);
    }
  };

  const stopStopwatch = () => {
    if (timerMode === "stopwatch" && isRunning) {
      const minutes = Math.floor(stopwatchSeconds / 60);
      const reward = Math.floor(minutes / 2);
      if (reward > 0) {
        dispatch(addDiamonds(reward));
        alert(
          `Bạn đã tập trung được ${minutes} phút và nhận được ${reward} kim cương!`,
        );
      }
      setIsRunning(false);
    }
  };

  const handleSaveSettings = () => {
    if (timerMode === "pomodoro") {
      setTimeLeft(isBreak ? breakTime * 60 : pomodoroTime * 60);
    }
    setIsRunning(false);
    setShowSettings(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex bg-amber-100/50 p-1 rounded-2xl mb-4 self-center w-fit mx-auto">
        <button
          onClick={() => {
            setTimerMode("pomodoro");
            setIsRunning(false);
          }}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${timerMode === "pomodoro" ? "bg-amber-900 text-white shadow-md" : "text-amber-700 hover:bg-amber-100"}`}
        >
          Pomodoro
        </button>
        <button
          onClick={() => {
            setTimerMode("stopwatch" as any);
            setIsRunning(false);
          }}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${timerMode === ("stopwatch" as any) ? "bg-amber-900 text-white shadow-md" : "text-amber-700 hover:bg-amber-100"}`}
        >
          Đếm giờ
        </button>
      </div>

      <div
        className={`pastel-card text-center transition-all duration-500 relative overflow-hidden ${isBreak ? "bg-emerald-50 border-emerald-100" : "bg-sky-50 border-sky-100"}`}
      >
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="absolute top-4 right-4 p-2 text-amber-700 hover:bg-amber-100 rounded-xl transition-colors"
        >
          <Settings size={20} />
        </button>

        <div className="flex justify-center mb-6">
          <div
            className={`p-4 rounded-2xl ${isBreak ? "bg-emerald-200 text-emerald-900" : "bg-sky-200 text-sky-900"}`}
          >
            {isBreak ? <Coffee size={32} /> : <BookOpen size={32} />}
          </div>
        </div>

        <h3 className="text-xl font-bold text-amber-950 mb-1">
          {isBreak ? "Giờ nghỉ giải lao" : "Thời gian tập trung"}
        </h3>
        <p className="text-amber-700/70 mb-8">
          {isBreak
            ? "Nghỉ ngơi một chút để nạp lại năng lượng nhé!"
            : "Hãy tập trung hoàn thành môn học của bạn."}
        </p>

        <div className="text-7xl font-black font-mono text-amber-950 mb-10 tracking-tighter">
          {timerMode === "pomodoro"
            ? formatTime(timeLeft)
            : formatTime(stopwatchSeconds)}
        </div>

        <div className="flex justify-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={
              timerMode === "pomodoro"
                ? toggleTimer
                : isRunning
                  ? stopStopwatch
                  : toggleTimer
            }
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
              isRunning
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-amber-950 text-white hover:bg-amber-900"
            }`}
          >
            {isRunning ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" />
            )}
            {isRunning
              ? timerMode === "pomodoro"
                ? "Tạm dừng"
                : "Kết thúc"
              : "Bắt đầu học"}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={resetTimer}
            className="p-4 bg-white text-amber-700 border border-amber-100 rounded-2xl hover:bg-amber-50 transition-colors shadow-sm"
          >
            <RotateCcw size={24} />
          </motion.button>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-sm p-6 flex flex-col justify-center gap-6"
            >
              <h4 className="text-lg font-bold text-amber-950">
                Cài đặt thời gian
              </h4>
              <div className="flex flex-col gap-4">
                <div className="text-left">
                  <label className="text-xs font-bold text-amber-700 uppercase mb-1 block">
                    Tập trung (phút)
                  </label>
                  <input
                    type="number"
                    value={pomodoroTime}
                    onChange={(e) =>
                      setPomodoroTime(parseInt(e.target.value) || 1)
                    }
                    className="w-full px-4 py-2 bg-amber-50 rounded-xl outline-none border border-amber-100 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="text-left">
                  <label className="text-xs font-bold text-amber-700 uppercase mb-1 block">
                    Nghỉ ngơi (phút)
                  </label>
                  <input
                    type="number"
                    value={breakTime}
                    onChange={(e) =>
                      setBreakTime(parseInt(e.target.value) || 1)
                    }
                    className="w-full px-4 py-2 bg-amber-50 rounded-xl outline-none border border-amber-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveSettings}
                className="btn-primary w-full py-3"
              >
                Lưu cài đặt
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 p-4 border-2 border-dashed border-amber-200 rounded-2xl flex items-center gap-4 text-amber-700">
        <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-sky-700">
          <Diamond size={20} />
        </div>
        <p className="text-sm">
          {timerMode === "pomodoro"
            ? `Hoàn thành phiên tập trung này để nhận ${Math.max(10, Math.floor(pomodoroTime / 2.5))} kim cương!`
            : "Mỗi 2 phút tập trung ở chế độ đếm giờ sẽ giúp bạn nhận được 1 kim cương!"}
        </p>
      </div>
    </div>
  );
};

export default Timer;
