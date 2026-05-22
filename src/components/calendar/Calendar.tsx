import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store/index.js";
import {
  Plus,
  X,
  Clock,
  User,
  MapPin,
  AlertCircle,
  Calendar as CalendarIcon,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Subject } from "../../types.js";

const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const hours = Array.from({ length: 24 }, (_, i) => i); // Chạy từ 0h - 23h cho đầy đủ

const ROW_HEIGHT = 80; // Chiều cao cố định của 1 ô giờ (pixel)

interface CalendarProps {
  subjects: any[];
  setSubjects: React.Dispatch<React.SetStateAction<any[]>>;
}

const Calendar: React.FC<CalendarProps> = ({ subjects, setSubjects }) => {
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({
    name: "",
    teacher: "",
    room: "",
    color: "#F87171",
    startTime: "08:00",
    endTime: "09:30",
    daysOfWeek: [0],
  });

  const colors = [
    { name: "Đỏ Pastel", value: "#F87171" },
    { name: "Xanh Dương", value: "#60A5FA" },
    { name: "Xanh Lá", value: "#34D399" },
    { name: "Vàng", value: "#FBBF24" },
    { name: "Tím", value: "#A78BFA" },
    { name: "Hồng", value: "#F472B6" },
    { name: "Cam", value: "#FB923C" },
  ];

  const addSubject = () => {
    if (!newSubject.name) return;
    const id = Math.random().toString(36).substr(2, 9);
    setSubjects([...subjects, { ...newSubject, id } as Subject]);
    setShowModal(false);
    setNewSubject({
      name: "",
      teacher: "",
      room: "",
      color: "#3B82F6",
      startTime: "08:00",
      endTime: "09:30",
      daysOfWeek: [0],
    });
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  // 🛠️ HÀM KÉO GIÃN THỜI GIAN ĐẾN TỪNG PHÚT CHÍNH XÁC
  const handleResizeStart = (
    e: React.MouseEvent,
    subjectId: string,
    currentStart: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startH = parseInt(currentStart.split(":")[0]);
    const startM = parseInt(currentStart.split(":")[1] || "00");
    const startTotalMinutes = startH * 60 + startM;

    const initialY = e.clientY;
    const currentSubject = subjects.find((s) => s.id === subjectId);
    if (!currentSubject) return;

    const endH = parseInt((currentSubject.endTime || "00:00").split(":")[0]);
    const endM = parseInt(
      (currentSubject.endTime || "00:00").split(":")[1] || "00",
    );
    const initialEndMinutes = endH * 60 + endM;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - initialY;

      // 1 tiếng = ROW_HEIGHT (80px), vậy 1px chuột di chuyển = (60 / 80) phút lẻ
      const minutesAdded = Math.round(deltaY * (60 / ROW_HEIGHT));
      let newEndMinutes = initialEndMinutes + minutesAdded;

      // Giới hạn tối thiểu là cách giờ bắt đầu 15 phút, tối đa là cuối ngày
      if (newEndMinutes <= startTotalMinutes)
        newEndMinutes = startTotalMinutes + 15;
      if (newEndMinutes > 24 * 60) newEndMinutes = 24 * 60;

      const finalH = Math.floor(newEndMinutes / 60);
      const finalM = newEndMinutes % 60;
      const formattedEnd = `${finalH.toString().padStart(2, "0")}:${finalM.toString().padStart(2, "0")}`;

      setSubjects((prev) =>
        prev.map((s) => {
          if (s.id === subjectId) {
            return { ...s, endTime: formattedEnd };
          }
          return s;
        }),
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleDragStart = (e: React.DragEvent, subjectId: string) => {
    e.dataTransfer.setData("subjectId", subjectId);
  };

  // 🛠️ HÀM THẢ MÔN HỌC (DROP) VÀO VỊ TRÍ PHÚT CHÍNH XÁC DỰA TRÊN TỌA ĐỘ CHUỘT
  const handleDrop = (e: React.DragEvent, dayIdx: number, hour: number) => {
    e.preventDefault();
    const subjectId = e.dataTransfer.getData("subjectId");

    // Tính toán xem chuột đang nằm ở vị trí pixel thứ mấy trong ô Grid 80px đó
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY = e.clientY - rect.top;

    // Đổi pixel lẻ sang số phút lẻ tương ứng (ví dụ: rơi vào giữa ô 80px thì là phút thứ 30)
    const exactMinutes = Math.round((relativeY / ROW_HEIGHT) * 60);
    const dropTotalMinutes = hour * 60 + exactMinutes;

    const updatedSubjects = subjects.map((s) => {
      if (s.id === subjectId) {
        const sH = parseInt((s.startTime || "00:00").split(":")[0]);
        const sM = parseInt((s.startTime || "00:00").split(":")[1] || "00");
        const eH = parseInt((s.endTime || "00:00").split(":")[0]);
        const eM = parseInt((s.endTime || "00:00").split(":")[1] || "00");
        const duration = eH * 60 + eM - (sH * 60 + sM); // Tính độ dài môn học bằng phút

        const newStartH = Math.floor(dropTotalMinutes / 60);
        const newStartM = dropTotalMinutes % 60;

        const newEndTotalMinutes = dropTotalMinutes + duration;
        const newEndH = Math.floor(newEndTotalMinutes / 60);
        const newEndM = newEndTotalMinutes % 60;

        return {
          ...s,
          daysOfWeek: [dayIdx],
          startTime: `${newStartH.toString().padStart(2, "0")}:${newStartM.toString().padStart(2, "0")}`,
          endTime: `${newEndH.toString().padStart(2, "0")}:${newEndM.toString().padStart(2, "0")}`,
        };
      }
      return s;
    });
    setSubjects(updatedSubjects);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-950 flex items-center gap-2">
          <CalendarIcon className="text-amber-950" />
          Thời khóa biểu tuần
        </h2>
        <div className="flex gap-2">
          <button className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-xl transition-all">
            <Download size={20} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Thêm môn học
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px] bg-white/60 backdrop-blur-xs rounded-3xl border border-emerald-800/20 shadow-sm overflow-hidden">
          {/* THANH TIÊU ĐỀ THỨ */}
          <div className="grid grid-cols-[100px_repeat(7,1fr)] bg-emerald-50/40 border-b border-emerald-800/20">
            <div className="p-4 text-xs font-bold text-emerald-900 uppercase text-center border-r border-emerald-800/20">
              Giờ
            </div>
            {days.map((day) => (
              <div
                key={day}
                className="p-4 text-xs font-bold text-emerald-900 uppercase text-center border-r border-emerald-800/20 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* KHU VỰC CÁC Ô LỊCH CHÍNH */}
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour}
                style={{ height: `${ROW_HEIGHT}px` }}
                className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-dashed border-emerald-800/15 bg-transparent"
              >
                {/* CỘT MỐC GIỜ CHẴN */}
                <div className="p-4 text-sm font-medium text-emerald-900 text-center flex items-start justify-center border-r border-emerald-800/20 bg-emerald-50/10">
                  {hour.toString().padStart(2, "0")}:00
                </div>

                {/* CÁC CỘT THỨ */}
                {days.map((_, dayIdx) => {
                  return (
                    <div
                      key={dayIdx}
                      className="border-r border-emerald-800/20 last:border-r-0 relative group hover:bg-emerald-800/5 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dayIdx, hour)}
                    >
                      {/* RENDER MÔN HỌC BẰNG LOGIC TỌA ĐỘ PHẦN TRĂM TUYỆT ĐỐI THEO PHÚT LẺ */}
                      {subjects
                        .filter((s) => {
                          const sHour = parseInt(
                            (s.startTime ?? "00:00").split(":")[0],
                          );
                          return (
                            s.daysOfWeek.includes(dayIdx) && sHour === hour
                          );
                        })
                        .map((subject) => {
                          const startM = parseInt(
                            (subject.startTime ?? "00:00").split(":")[1] ||
                              "00",
                          );
                          const startH = parseInt(
                            (subject.startTime ?? "00:00").split(":")[0],
                          );
                          const endH = parseInt(
                            (subject.endTime ?? "00:00").split(":")[0],
                          );
                          const endM = parseInt(
                            (subject.endTime ?? "00:00").split(":")[1] || "00",
                          );

                          // Tính thời lượng bằng phút
                          const totalDurationMinutes =
                            endH * 60 + endM - (startH * 60 + startM);

                          // Đổi số phút lẻ thành pixel thực tế để đẩy thẻ xuống vị trí chuẩn
                          const topOffset = (startM / 60) * ROW_HEIGHT;
                          const calculatedHeight =
                            (totalDurationMinutes / 60) * ROW_HEIGHT;

                          return (
                            <motion.div
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(e as any, subject.id)
                              }
                              layoutId={subject.id}
                              key={subject.id}
                              style={{
                                backgroundColor: `${subject.color}25`,
                                borderLeft: `4px solid ${subject.color}`,
                                top: `${topOffset}px`, // Tự thụt xuống nếu bắt đầu lúc xx giờ lẻ phút
                                height: `${calculatedHeight - 4}px`, // Chiều cao chuẩn xác tới từng phút lẻ
                              }}
                              className="absolute inset-x-1 z-10 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:brightness-95 transition-all group/item overflow-visible shadow-xs"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSubject(subject.id);
                                }}
                                className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 p-1 text-amber-700 hover:text-red-500 transition-opacity z-20"
                              >
                                <X size={14} />
                              </button>

                              <h4 className="font-bold text-xs truncate text-amber-950">
                                {subject.name}
                              </h4>
                              <div className="flex flex-col gap-0.5 mt-1">
                                {subject.room && (
                                  <div className="flex items-center gap-1 text-[10px] text-amber-700">
                                    <MapPin size={10} />
                                    <span className="truncate">
                                      {subject.room}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-[10px] text-amber-700">
                                  <Clock size={10} />
                                  <span>
                                    {subject.startTime} - {subject.endTime}
                                  </span>
                                </div>
                              </div>

                              {/* VIỀN KÉO GIÃN THỜI GIAN */}
                              <div
                                onMouseDown={(e) =>
                                  handleResizeStart(
                                    e,
                                    subject.id,
                                    subject.startTime,
                                  )
                                }
                                className="absolute bottom-0 inset-x-0 h-2 cursor-ns-resize bg-transparent hover:bg-emerald-500/20 rounded-b-lg transition-colors flex items-center justify-center group"
                              >
                                <div className="w-6 h-0.5 bg-amber-900/20 opacity-0 group-hover:opacity-100 rounded" />
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-amber-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-lg relative shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-amber-950">
                Thêm môn học mới
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-amber-700 mb-1 block">
                    Tên môn học
                  </label>
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, name: e.target.value })
                    }
                    placeholder="VD: Cấu trúc dữ liệu..."
                    className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl focus:ring-2 focus:ring-sky-500 transition-all outline-none text-amber-950"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-amber-700 mb-1 block">
                      Phòng học
                    </label>
                    <input
                      type="text"
                      value={newSubject.room}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, room: e.target.value })
                      }
                      placeholder="A101"
                      className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl outline-none text-amber-950"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-700 mb-1 block">
                      Giảng viên
                    </label>
                    <input
                      type="text"
                      value={newSubject.teacher}
                      onChange={(e) =>
                        setNewSubject({
                          ...newSubject,
                          teacher: e.target.value,
                        })
                      }
                      placeholder="TS. Nguyễn Văn A"
                      className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl outline-none text-amber-950"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-amber-700 mb-1 block">
                      Bắt đầu
                    </label>
                    <input
                      type="time"
                      value={newSubject.startTime}
                      onChange={(e) =>
                        setNewSubject({
                          ...newSubject,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl outline-none text-amber-950"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-700 mb-1 block">
                      Kết thúc
                    </label>
                    <input
                      type="time"
                      value={newSubject.endTime}
                      onChange={(e) =>
                        setNewSubject({
                          ...newSubject,
                          endTime: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl outline-none text-amber-950"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-700 mb-2 block">
                    Màu sắc
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() =>
                          setNewSubject({ ...newSubject, color: color.value })
                        }
                        className={`w-8 h-8 rounded-full transition-all border-2 ${
                          newSubject.color === color.value
                            ? "border-amber-950 scale-110 shadow-md"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-700 mb-2 block">
                    Thứ trong tuần
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {days.map((day, idx) => (
                      <button
                        key={day}
                        onClick={() => {
                          const daysList = newSubject.daysOfWeek || [];
                          if (daysList.includes(idx)) {
                            setNewSubject({
                              ...newSubject,
                              daysOfWeek: daysList.filter((d) => d !== idx),
                            });
                          } else {
                            setNewSubject({
                              ...newSubject,
                              daysOfWeek: [...daysList, idx],
                            });
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          newSubject.daysOfWeek?.includes(idx)
                            ? "bg-sky-600 text-white shadow-md shadow-sky-100"
                            : "bg-amber-50 text-amber-500 hover:bg-amber-100"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-amber-100 text-amber-600 font-bold rounded-xl hover:bg-amber-200 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={addSubject}
                  className="flex-1 py-3 bg-amber-950 text-white font-bold rounded-xl hover:bg-amber-900 shadow-lg shadow-amber-100 transition-all"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;
