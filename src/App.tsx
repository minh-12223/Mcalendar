import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "./store/index.js";
import { setDiamonds, incrementStreak, checkAndResetStreak } from "./store/userSlice.js";
import Calendar from "./components/calendar/Calendar.js";
import Timer from "./components/timer/Timer.js";
import Shop from "./components/shop/Shop.js";
import PetTab from "./components/pet/PetTab.js";
import AIAssistant from "./components/ai/AIAssistant.js";
import {
  Book,
  Calendar as CalendarIcon,
  Timer as TimerIcon,
  ShoppingBag,
  Flame,
  Diamond,
  PawPrint,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Subject } from "./types.js";
import { useAuth } from "./hooks/useAuth.js";
import AuthModal from "./components/auth/AuthModal.js";
import AvatarHeader from "./components/auth/AvatarHeader.js";

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { streak, diamonds, name: reduxName } = useSelector(
    (state: RootState) => state.user,
  );
  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [activeTab, setActiveTab] = React.useState<
    "calendar" | "timer" | "pet" | "shop"
  >("calendar");

  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 phút mặc định (tính theo giây)
  const [isRunning, setIsRunning] = useState(false);  // Trạng thái đang chạy hay dừng
  const [timerMode, setTimerMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [fontSizeClass, setFontSizeClass] = useState("text-xl");

  const tabs = [
    { id: "calendar", label: "Lịch học", icon: CalendarIcon },
    { id: "timer", label: "Tập trung", icon: TimerIcon },
    { id: "pet", label: "Thú nuôi", icon: PawPrint },
    { id: "shop", label: "Cửa hàng", icon: ShoppingBag },
  ];

  React.useEffect(() => {
    dispatch(checkAndResetStreak());
  }, [dispatch]);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isRunning) {
      if (timerMode === "pomodoro") {
        if (timeLeft > 0) {
          timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
        } else {
          setIsRunning(false);
          if (!isBreak) {
            setIsBreak(true);
            setTimeLeft(breakTime * 60);
            dispatch(incrementStreak()); // Hoàn thành 1 phiên Pomodoro (25p > 10p) -> tăng streak
            alert("Chúc mừng! Bạn đã hoàn thành phiên tập trung! 🎉");
          } else {
            setIsBreak(false);
            setTimeLeft(pomodoroTime * 60);
            alert("Hết giờ nghỉ giải lao, bắt đầu phiên học mới thôi nào! 📚");
          }
        }
      } else if (timerMode === "stopwatch") {
        timer = setTimeout(() => {
          setStopwatchSeconds((prev) => {
            const nextSeconds = prev + 1;
            if (nextSeconds > 0 && nextSeconds % 600 === 0) {
              dispatch(incrementStreak());
            }
            return nextSeconds;
          });
        }, 1000);
      }
    }
    
    return () => clearTimeout(timer);
  }, [isRunning, timeLeft, timerMode, stopwatchSeconds, isBreak, pomodoroTime, breakTime, dispatch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Chào buổi sáng, ${reduxName || "bạn"}! ☀️`;
    if (hour < 18) return `Chúc buổi chiều năng suất, ${reduxName || "bạn"}! 📚`;
    return `Chào buổi tối, ${reduxName || "bạn"}! 🌙`;
  };

  const [text, setText] = useState(getGreeting());

  React.useEffect(() => {
    const motivations = [
      '"Đừng để nỗi sợ hãi về những gì có thể xảy ra ngăn cản bạn hành động."-Tony Robbins',
      '"Tương lai thuộc về những ai tin vào vẻ đẹp trong những giấc mơ của họ."-Eleanor Roosevelt',
      '"Bạn không bao giờ là quá già để đặt ra một mục tiêu mới hay mơ một giấc mơ mới."-C.S. Lewis',
      '"Cách duy nhất để làm những việc tuyệt vời là yêu những gì bạn làm."-Steve Jobs',
      '"Khó khăn không phải là rào cản, mà là những viên đá lót đường để bạn bước tới thành công."-Khuyết danh',
      '"Thành công không phải là chìa khóa của hạnh phúc. Hạnh phúc mới là chìa khóa của thành công."-Albert Schweitzer',
      '"Đừng đợi cơ hội đến, hãy tự tạo ra nó."-Christopher Reeve',
      '"Hãy hướng về phía mặt trời, bạn sẽ không bao giờ nhìn thấy bóng tối."-Helen Keller',
      '"Sự khác biệt giữa người thành công và những người khác không phải là sự thiếu sức mạnh, thiếu kiến thức, mà là thiếu ý chí."-Vince Lombardi',
      '"Hãy làm những gì bạn có thể, với những gì bạn có, ngay tại nơi bạn đang đứng."-Theodore Roosevelt',
      '"Thành công là kết quả của việc chuẩn bị kỹ lưỡng, làm việc chăm chỉ và học hỏi từ thất bại."-Colin Powell',
      '"Khó khăn lớn nhất là vượt qua chính bản thân mình."-Marcus Tullius Cicero',
      '"Mọi vĩ nhân đều bắt đầu từ những ước mơ nhỏ bé nhưng đầy quyết tâm."-Khuyết danh',
      '"Đừng bao giờ để thất bại làm bạn nhụt chí, hãy để nó trở thành bài học cho tương lai."-Khuyết danh',
      '"Tự tin là bước đầu tiên để tiến tới thành công."-Ralph Waldo Emerson',
      '"Sức mạnh không đến từ những gì bạn có thể làm, nó đến từ việc vượt qua những điều bạn từng nghĩ mình không thể làm."-Rikki Rogers',
      '"Cách tốt nhất để dự đoán tương lai là tự mình tạo ra nó."-Abraham Lincoln',
      '"Càng nỗ lực, bạn sẽ càng cảm thấy mình thật may mắn."-Gary Player',
      '"Đừng đợi cơ hội đến, hãy tự tạo ra nó bằng chính bàn tay mình."-Khuyết danh',
      '"Mỗi bước đi, dù nhỏ đến đâu, cũng đang đưa bạn đến gần hơn với mục tiêu của mình."-Khuyết danh',
      '"Thất bại chỉ đơn giản là cơ hội để bắt đầu lại một cách thông minh hơn."-Henry Ford',
      '"Hãy là phiên bản hạng nhất của chính bạn, thay vì là phiên bản hạng hai của người khác."-Judy Garland',
      '"Sự kiên trì là con đường ngắn nhất dẫn đến thành công vang dội."-Khuyết danh',
      '"Đừng bao giờ từ bỏ ước mơ chỉ vì thời gian cần để thực hiện nó quá lâu."-Earl Nightingale',
      '"Hành trình vạn dặm bắt đầu bằng một bước chân nhỏ bé."-Lão Tử',
      '"Hãy nhìn lên những vì sao và đừng nhìn xuống đôi chân của mình."-Stephen Hawking',
      '"Sự thay đổi không bao giờ là đau đớn, chỉ có sự chống lại thay đổi mới là đau đớn."-Buddha',
      '"Cuộc sống không phải là đi tìm chính mình, mà là tự tạo ra chính mình."-George Bernard Shaw',
      '"Mọi thành tựu vĩ đại đều đòi hỏi sự kiên nhẫn và thời gian."-Maya Angelou',
      '"Đừng đếm những ngày trôi qua, hãy làm cho những ngày đó có ý nghĩa."-Muhammad Ali',
    ];
    const interval = setInterval(() => {
      setText((currentText) => {
        const remainingMotivations = motivations.filter(m => m !== currentText);
        if (remainingMotivations.length === 0) return motivations[0];
        const randomMotivation = remainingMotivations[Math.floor(Math.random() * remainingMotivations.length)];
        return randomMotivation;
      });
    }, 1000 * 60);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="min-h-screen bg-amber-50/30 flex flex-col md:flex-row antialiased font-sans selection:bg-amber-200">
      {/* Avatar Header - Top Right */}
      <AvatarHeader onOpenAuth={() => setIsAuthModalOpen(true)} />

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
        <AnimatePresence mode="wait">
          {activeTab === "calendar" && (
            <motion.header
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 flex justify-between items-center text-amber-600"
            >
              <div>
                <h2 className="font-bold text-amber-950 w-full flex items-center">
                  <div className={`h-[2rem] flex items-center overflow-hidden w-full transition-all duration-500`}>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={text}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`block w-full truncate tracking-tight select-none ${text.length > 120 ? 'text-sm' : 'text-xl'}`}
                      >
                        {text}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </h2>
                <p className="mt-1 text-amber-700">
                  Hôm nay bạn có{" "}
                  {subjects.filter((s) => s.daysOfWeek.includes((new Date().getDay() + 6) % 7)).length}{" "}
                  môn học. Hãy cố gắng nhé!
                </p>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

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
                timerMode={timerMode as any}
                setTimerMode={setTimerMode as any}
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
            {activeTab === "pet" && (
              <PetTab
                diamonds={diamonds}
                onUpdateDiamonds={(newAmount: number) => {
                  dispatch(setDiamonds(newAmount));
                }}
              />
            )}
            {activeTab === "shop" && <Shop />}
          </motion.div>
        </AnimatePresence>
      </main>
      <AIAssistant
        subjects={subjects}
        setSubjects={setSubjects}
        name={reduxName}
        streak={streak}
        diamonds={diamonds}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </nav>
  );
};

export default App;
