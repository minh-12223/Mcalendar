import React, { useState, useEffect, useRef } from "react";
import type { AIChatMessage, Subject } from "../../types.js";
import { Send, Bot, User, Sparkles, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Sử dụng phương thức truy cập an toàn để tránh lỗi biên dịch của môi trường
const apiKey = import.meta.env.VITE_GEMINI_KEY || "";

const genAI = new GoogleGenerativeAI(apiKey);

interface AIAssistantProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  name?: string;
  streak?: number;
  diamonds?: number;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  subjects,
  setSubjects,
  name = "Bạn",
  streak = 0,
  diamonds = 0,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: "assistant",
      content: `Chào ${name}! Mình đã chuyển sang bộ não siêu tốc Gemini. Phản hồi sẽ nhanh như chớp, hỗ trợ phân loại lịch học chuẩn xác và giải đáp mọi thắc mắc của bạn ngay lập tức!`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: AIChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const systemInstruction = `
        Bạn là Trợ lý Học tập AI thông minh, nhanh nhẹn của người dùng tên là ${name}.
        Nhiệm vụ của bạn là đọc hiểu tin nhắn tự nhiên của người dùng và chuyển đổi sang cấu trúc dữ liệu JSON chính xác.

        Đây là thời khóa biểu hiện tại dưới dạng JSON:
        ${JSON.stringify(subjects)}

        Quy ước thứ trong tuần (day): 0=Thứ 2, 1=Thứ 3, 2=Thứ 4, 3=Thứ 5, 4=Thứ 6, 5=Thứ 7, 6=Chủ Nhật.

        QUY TẮC PHÂN LOẠI HÀNH ĐỘNG (action):
        1. THÊM LỊCH (VD: "thêm lịch học toán 8h sáng mai"): Đặt action = "ADD", tự suy luận scheduleData. Nếu thiếu giờ kết thúc, tự cộng thêm 1 tiếng 30 phút.
        2. XÓA LỊCH (VD: "bỏ tiết lý đi"): Đặt action = "DELETE", tìm đúng targetId của môn đó trong danh sách subjects.
        3. CHAT/HỎI BÀI (VD: "giải toán", "viết code C++", "hello"): Đặt action = "CHAT".

        BẮT BUỘC: Mọi lời giải bài tập, câu trả lời trò chuyện PHẢI viết chi tiết bằng Markdown vào trường 'replyText'.
      `;

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction,
      });

      const jsonSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["ADD", "DELETE", "CHAT"],
            description: "Hành động phân loại: ADD, DELETE hoặc CHAT",
          },
          replyText: {
            type: "string",
            description:
              "Lời giải bài tập hoặc câu trả lời chi tiết bằng định dạng Markdown",
          },
          scheduleData: {
            type: "object",
            properties: {
              name: { type: "string" },
              day: {
                type: "number",
                description:
                  "Thứ trong tuần dưới dạng số: 0=Thứ 2, 1=Thứ 3, ..., 6=Chủ Nhật",
              },
              startTime: { type: "string" },
              endTime: { type: "string" },
            },
          },
          targetId: {
            type: "string",
            description: "ID môn học cần xóa",
          },
        },
        required: ["action", "replyText"],
      };

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: currentInput }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: jsonSchema as any,
          temperature: 0.3,
        },
      });

      const responseData = JSON.parse(result.response.text());

      if (responseData.action === "ADD" && responseData.scheduleData) {
        const {
          name: subName,
          day,
          startTime,
          endTime,
        } = responseData.scheduleData;
        const newId = Math.random().toString(36).substr(2, 9);
        const newSub: Subject = {
          id: newId,
          name: subName || "Môn học mới",
          startTime: startTime || "08:00",
          endTime: endTime || "09:30",
          daysOfWeek: [day !== undefined ? day : 0],
          color: "#60A5FA",
          room: "",
          teacher: "",
        };
        setSubjects((prev) => [...prev, newSub]);
      } else if (responseData.action === "DELETE" && responseData.targetId) {
        setSubjects((prev) =>
          prev.filter((s) => s.id !== responseData.targetId),
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            responseData.replyText ||
            "Mình chưa hiểu ý bạn lắm, bạn nói rõ hơn được không?",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Lỗi Gemini:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Không thể kết nối với trí tuệ nhân tạo, hãy kiểm tra lại kết nối hoặc API Key nhé!",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 sm:w-96 h-[500px] bg-white rounded-3xl border border-amber-100 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-amber-950 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Trợ lý AI Gemini</h3>
                  <div className="flex items-center gap-1.5 text-[9px] opacity-80 uppercase tracking-wider font-bold">
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                    Bản nâng cấp siêu tốc
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-amber-50/50">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`flex gap-2 max-w-[85%] ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        msg.role === "assistant"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <Bot size={16} />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        msg.role === "assistant"
                          ? "bg-white text-amber-950 rounded-tl-none border border-amber-100"
                          : "bg-sky-600 text-white rounded-tr-none shadow-sky-100"
                      }`}
                    >
                      <span className="whitespace-pre-line">{msg.content}</span>
                      <div
                        className={`text-[9px] mt-1 opacity-50 ${msg.role === "assistant" ? "text-amber-600" : "text-white"}`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 bg-white p-3 rounded-2xl rounded-tl-none border border-amber-100 shadow-sm">
                    <Loader2 size={16} className="text-sky-600 animate-spin" />
                    <span className="text-xs text-amber-700 font-medium">
                      AI đang xử lý cực nhanh...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-amber-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Yêu cầu AI Flash xếp lịch học..."
                  className="w-full pl-3 pr-10 py-3 bg-amber-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm text-amber-950"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-1.5 p-1.5 rounded-lg transition-all ${
                    input.trim() && !isLoading
                      ? "bg-sky-600 text-white shadow-lg shadow-sky-100"
                      : "text-amber-300"
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[8px] text-center text-amber-600 mt-2 flex items-center justify-center gap-1">
                <Sparkles size={8} /> Vận hành bằng công nghệ siêu tốc Gemini
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-amber-950 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:bg-amber-900 transition-all border-4 border-white"
      >
        <Bot size={28} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce" />
      </motion.button>
    </div>
  );
};

export default AIAssistant;
