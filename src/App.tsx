import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "./store/index";
import Calendar from "./components/calendar/Calendar";
import Timer from "./components/timer/Timer";
import Shop from "./components/shop/Shop";
import AIAssistant from "./components/ai/AIAssistant";
import {
  Book,
  Calendar as CalendarIcon,
  Timer as TimerIcon,
  ShoppingBag,
  Flame,
  Diamond,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Subject } from "./types.js";

const App: React.FC = () => {
  const { streak, diamonds, name } = useSelector(
    (state: RootState) => state.user,
  );
  const [activeTab, setActiveTab] = React.useState<
    "calendar" | "timer" | "shop"
  >("calendar");

  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 phút mặc định (tính theo giây)
  const [isRunning, setIsRunning] = useState(false);  // Trạng thái đang chạy hay dừng
  const [timerMode, setTimerMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const tabs = [
    { id: "calendar", label: "Lịch học", icon: CalendarIcon },
    { id: "timer", label: "Tập trung", icon: TimerIcon },
    { id: "shop", label: "Cửa hàng", icon: ShoppingBag },
  ];

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isRunning) {
      if (timerMode === "pomodoro") {
        // Luồng xử lý Pomodoro (Đếm ngược)
        if (timeLeft > 0) {
          timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
        } else {
          setIsRunning(false);
          if (!isBreak) {
            setIsBreak(true);
            setTimeLeft(breakTime * 60);
            alert("Chúc mừng! Bạn đã hoàn thành phiên tập trung! 🎉 Thao tác quay lại tab Tập trung để nhận kim cương.");
          } else {
            setIsBreak(false);
            setTimeLeft(pomodoroTime * 60);
            alert("Hết giờ nghỉ giải lao, bắt đầu phiên học mới thôi nào! 📚");
          }
        }
      } else if (timerMode === "stopwatch") {
        // Luồng xử lý Đếm giờ (Đếm tiến) - Đã sửa lỗi đóng băng
        timer = setTimeout(() => setStopwatchSeconds((prev) => prev + 1), 1000);
      }
    }
    
    return () => clearTimeout(timer);
  }, [isRunning, timeLeft, timerMode, stopwatchSeconds, isBreak, pomodoroTime, breakTime]);

  return (
    <nav className="min-h-screen bg-amber-50/30 flex flex-col md:flex-row antialiased font-sans selection:bg-amber-200">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-amber-100 p-6 flex flex-col justify-between hidden md:flex z-20">
        <div>
          {/* 1. Phần Logo */}
          <div className="flex items-center gap-3 mb-6 text-amber-950">
            <Book className="text-amber-700" size={28} />
            <h1
              className="text-2xl font-bold tracking-wide"
              style={{ fontFamily: "cursive" }}
            >
              Mcalendar
            </h1>
          </div>
          <div className="flex flex-row items-center justify-center gap-2 mb-6 w-full">
            {/* Chỉ số Streak */}
            <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-xl border border-orange-100 shadow-xs flex-1 justify-center">
              <Flame size={30} className="fill-orange-600" />
              <span className="text-xs font-bold">{streak}</span>
            </div>
            <div className="flex items-center gap-2 bg-sky-50 text-sky-600 px-3 py-2 rounded-xl border border-sky-100 shadow-xs flex-1 justify-center">
              <Diamond size={30} className="fill-sky-600" />
              <span className="text-xs font-bold">{diamonds}</span>
            </div>
          </div>
          {/* 3. Danh sách các Tab */}
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-amber-950 text-white shadow-lg shadow-amber-950/10"
                      : "text-amber-800/70 hover:bg-amber-50 hover:text-amber-950"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10">
        <header className="mb-8 flex justify-between items-center text-amber-600">
          <div>
            <h2 className="text-3xl font-bold text-amber-950">
              Chào buổi sáng! 👋
            </h2>
            <p className="mt-1 text-amber-700">
              Hôm nay bạn có{" "}
              {
                subjects.filter((s) =>
                  s.daysOfWeek.includes((new Date().getDay() + 6) % 7),
                ).length
              }{" "}
              môn học. Hãy cố gắng nhé!
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "calendar" && (
              <Calendar subjects={subjects} setSubjects={setSubjects} />
            )}
            {activeTab === "timer" && (
              <Timer
                timeLeft={timeLeft}
                setTimeLeft={setTimeLeft}
                isRunning={isRunning}
                setIsRunning={setIsRunning}
                timerMode={timerMode}
                setTimerMode={setTimerMode}
                isBreak={isBreak}
                setIsBreak={setIsBreak}
                pomodoroTime={pomodoroTime}
                setPomodoroTime={setPomodoroTime}
                breakTime={breakTime}
                setBreakTime={setBreakTime}
                stopwatchSeconds={stopwatchSeconds}
                setStopwatchSeconds={setStopwatchSeconds}
              />
            )}
            {activeTab === "shop" && <Shop />}
          </motion.div>
        </AnimatePresence>
      </main>
      <AIAssistant
        subjects={subjects}
        setSubjects={setSubjects}
        name={name}
        streak={streak}
        diamonds={diamonds}
      />
    </nav>
  );
};

export default App;
