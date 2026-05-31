import React, { useState } from "react";
import {
  Plus,
  X,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  Download,
  Flame,
  Snowflake,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Subject } from "../../types.js";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/index.js";

const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const hours = Array.from({ length: 24 }, (_, i) => i);
const ROW_HEIGHT = 40;

interface CalendarProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
}

const Calendar: React.FC<CalendarProps> = ({ subjects, setSubjects }) => {
  // Lấy dữ liệu streak và ngày học từ Redux để tính toán đóng băng hay phát lửa
  const { streak, lastStudyDate } = useSelector(
    (state: RootState) => state.user,
  );

  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({
    name: "",
    teacher: "",
    room: "",
    description: "",
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

  // --- LOGIC XỬ LÝ DỮ LIỆU NGÀY THÁNG ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Hàm lấy chuỗi định danh Tuần hiện tại (Ví dụ: "2026-W22")
  const getWeekIdentifier = (date: Date = new Date()) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${d.getUTCFullYear()}-W${weekNo}`;
  };

  // Tìm ngày đầu tiên của tháng và số lượng ngày trong tháng
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = CN, 1 = T2...
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Chuyển đổi định dạng GetDay của hệ thống (CN=0, T2=1) sang mảng index của bạn (T2=0...CN=6)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Tạo danh sách các ô hiển thị trong Lịch Tháng
  const monthCells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    monthCells.push(null); // Các ô trống đầu tháng trước
  }
  for (let i = 1; i <= totalDaysInMonth; i++) {
    monthCells.push(i);
  }

  // Hàm chuyển đổi giờ "HH:MM" sang số phút để so sánh sắp xếp môn học
  const getMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  // --- HÀM TÍNH TOÁN TRẠNG THÁI Ô NGÀY CHO LỊCH THÁNG ---
  const getDateStatus = (dayNum: number) => {
    if (!lastStudyDate) return { border: "border-zinc-200", flame: "none" };

    const cellDate = new Date(year, month, dayNum);
    const lastDate = new Date(lastStudyDate);
    const today = new Date();

    // Xóa giờ giấc để so sánh chuẩn xác ngày
    cellDate.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffWithLastStudy = Math.floor(
      (cellDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // 1. Ngày đó chính là ngày đã học hoặc nằm trong chuỗi streak đang có
    if (cellDate.getTime() === lastDate.getTime()) {
      return { border: "border-orange-400 border-2", flame: "active" };
    }

    // 2. Chưa quá 3 ngày không học kể từ ngày học cuối cùng -> Đóng băng ngọn lửa
    if (diffWithLastStudy > 0 && diffWithLastStudy < 3 && cellDate <= today) {
      return {
        border: "border-cyan-300 border-2 bg-cyan-50/10",
        flame: "frozen",
      };
    }

    // 3. Quá 3 ngày không học hoặc không có hoạt động học nào trước đó
    return { border: "border-zinc-200 bg-zinc-50/40", flame: "none" };
  };

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN MÔN HỌC GIỮ NGUYÊN ---
  const saveSubject = () => {
    if (!newSubject.name) return;
    if (editingId) {
      setSubjects(
        subjects.map((s) =>
          s.id === editingId ? ({ ...s, ...newSubject } as Subject) : s,
        ),
      );
    } else {
      const id = Math.random().toString(36).substr(2, 9);
      setSubjects([...subjects, { ...newSubject, id } as Subject]);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewSubject({
      name: "",
      teacher: "",
      room: "",
      description: "",
      color: "#F87171",
      startTime: "08:00",
      endTime: "09:30",
      daysOfWeek: [0],
      isRecurring: true,
      weekIdentifier: getWeekIdentifier(currentDate),
    });
  };

  const openEditModal = (subject: Subject) => {
    setNewSubject({
      isRecurring: true, // Giá trị mặc định cho môn học cũ
      ...subject
    });
    setEditingId(subject.id);
    setShowModal(true);
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

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
      const minutesAdded = Math.round(deltaY * (60 / ROW_HEIGHT));
      let newEndMinutes = initialEndMinutes + minutesAdded;
      if (newEndMinutes <= startTotalMinutes)
        newEndMinutes = startTotalMinutes + 15;
      if (newEndMinutes > 24 * 60) newEndMinutes = 24 * 60;

      const finalH = Math.floor(newEndMinutes / 60);
      const finalM = newEndMinutes % 60;
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                endTime: `${finalH.toString().padStart(2, "0")}:${finalM.toString().padStart(2, "0")}`,
              }
            : s,
        ),
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

  const handleDrop = (e: React.DragEvent, dayIdx: number, hour: number) => {
    e.preventDefault();
    const subjectId = e.dataTransfer.getData("subjectId");
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const exactMinutes = Math.round((relativeY / ROW_HEIGHT) * 60);
    const dropTotalMinutes = hour * 60 + exactMinutes;

    const updatedSubjects = subjects.map((s) => {
      if (s.id === subjectId) {
        const sH = parseInt((s.startTime || "00:00").split(":")[0]);
        const sM = parseInt((s.startTime || "00:00").split(":")[1] || "00");
        const eH = parseInt((s.endTime || "00:00").split(":")[0]);
        const eM = parseInt((s.endTime || "00:00").split(":")[1] || "00");
        const duration = eH * 60 + eM - (sH * 60 + sM);

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

  return (
    <div className="flex flex-col gap-6">
      {/* THANH ĐIỀU HƯỚNG TIÊU ĐỀ & CHUYỂN TAB CHỨC NĂNG */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-950 flex items-center gap-2">
            <CalendarIcon className="text-amber-950" />
            {viewMode === "week"
              ? "Thời khóa biểu tuần"
              : `Lịch học tháng ${month + 1} / ${year}`}
          </h2>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Bộ điều khiển chuyển đổi tuần / tháng */}
          <div className="bg-amber-100/80 p-1 rounded-xl flex border border-amber-200">
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "week" ? "bg-amber-950 text-white shadow-xs" : "text-amber-800 hover:bg-amber-200/50"}`}
            >
              Tuần
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "month" ? "bg-amber-950 text-white shadow-xs" : "text-amber-800 hover:bg-amber-200/50"}`}
            >
              Tháng
            </button>
          </div>

          {/* Nút lật tháng (chỉ hiển thị khi chọn chế độ Xem Tháng) */}
          {viewMode === "month" && (
            <div className="flex items-center bg-white border border-amber-200 rounded-xl overflow-hidden shadow-xs">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-2 hover:bg-amber-50 text-amber-950 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-2 hover:bg-amber-50 border-l border-amber-200 text-amber-950 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-xl transition-all">
              <Download size={20} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-amber-950 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-amber-900 transition-all text-xs"
            >
              <Plus size={16} />
              Thêm môn học
            </button>
          </div>
        </div>
      </div>

      {/* ================= GIAO DIỆN HIỂN THỊ TUẦN (MÃ CŨ CỦA BẠN) ================= */}
      {viewMode === "week" && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px] bg-white/60 backdrop-blur-xs rounded-3xl border border-emerald-800/20 shadow-sm overflow-hidden">
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
            <div className="relative">
              {hours.map((hour) => (
                <div
                  key={hour}
                  style={{ height: `${ROW_HEIGHT}px` }}
                  className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-dashed border-emerald-800/15 bg-transparent"
                >
                  <div className="py-2 px-1 text-xs font-semibold text-emerald-900/80 text-center flex items-center justify-center border-r border-emerald-800/20 bg-emerald-50/10">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {days.map((_, dayIdx) => (
                    <div
                      key={dayIdx}
                      className="border-r border-emerald-800/20 last:border-r-0 relative group hover:bg-emerald-800/5 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, dayIdx, hour)}
                    >
                      {subjects
  .filter((s) => {
    const sHour = parseInt((s.startTime ?? "00:00").split(":")[0]); //[cite: 2]
    const isRightDayAndHour = s.daysOfWeek.includes(dayIdx) && sHour === hour; //[cite: 2]
    
    if (!isRightDayAndHour) return false;

    // KIỂM TRA ĐIỀU KIỆN CHẾ ĐỘ TUẦN:
    const currentWeekId = getWeekIdentifier(currentDate);
    
    // Thỏa mãn nếu: Thuộc Chế độ 2 (Tất cả các tuần) HOẶC Thuộc Chế độ 1 nhưng phải đúng tuần này
    return s.isRecurring !== false || s.weekIdentifier === currentWeekId;
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
                          const totalDurationMinutes =
                            endH * 60 + endM - (startH * 60 + startM);
                          const topOffset = (startM / 60) * ROW_HEIGHT;
                          const calculatedHeight =
                            (totalDurationMinutes / 60) * ROW_HEIGHT;
                          return (
                            <motion.div
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(e, subject.id)
                              }
                              onClick={() => openEditModal(subject)}
                              layoutId={subject.id}
                              key={subject.id}
                              style={{
                                backgroundColor: `${subject.color}25`,
                                borderLeft: `4px solid ${subject.color}`,
                                top: `${topOffset}px`,
                                height: `${calculatedHeight - 4}px`,
                              }}
                              className="absolute inset-x-1 z-10 p-2 rounded-lg cursor-pointer active:cursor-grabbing hover:brightness-95 transition-all overflow-visible shadow-xs"
                            >
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
                                <div className="flex items-center gap-0.5 text-[9px] opacity-85 font-semibold whitespace-nowrap">
                                  <Clock size={9} className="shrink-0" />
                                  <span>
                                    {subject.startTime} - {subject.endTime}
                                  </span>
                                </div>
                              </div>
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
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= GIAO DIỆN HIỂN THỊ THÁNG (MỚI THEO YÊU CẦU) ================= */}
      {viewMode === "month" && (
        <div className="bg-white/70 backdrop-blur-md border border-amber-200 shadow-xl rounded-3xl overflow-hidden p-6">
          {/* Header hiển thị Thứ trong lịch tháng */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-black text-amber-950 uppercase tracking-wider">
            {days.map((d) => (
              <div key={d} className="py-2 bg-amber-100/50 rounded-xl">
                {d}
              </div>
            ))}
          </div>

          {/* Ô Ngày tháng lồng ghép các môn học lặp lại */}
          <div className="grid grid-cols-7 gap-2">
            {monthCells.map((day, cellIdx) => {
              if (day === null)
                return (
                  <div
                    key={`empty-${cellIdx}`}
                    className="bg-zinc-50/20 rounded-2xl h-32 border border-dashed border-zinc-200/50 opacity-40"
                  />
                );

              // Lấy ngày trong tuần của ô này (0=Thứ 2... 6=Chủ Nhật)
              const dayOfWeekIndex = cellIdx % 7;

              // Tính toán trạng thái Ngọn lửa, Viền cam, Viền đóng băng của ô
              const status = getDateStatus(day);

              // Tìm các môn học thuộc thứ này, sắp xếp theo thời gian sớm trước muộn sau
              const sortedSubjectsForDay = subjects
                .filter((s) => s.daysOfWeek.includes(dayOfWeekIndex))
                .sort(
                  (a, b) =>
                    getMinutes(a.startTime || "00:00") -
                    getMinutes(b.startTime || "00:00"),
                );

              return (
                <div
                  key={`day-${day}`}
                  className={`h-32 p-2 rounded-2xl transition-all relative flex flex-col justify-between overflow-hidden bg-white ${status.border} shadow-xs hover:shadow-md group`}
                >
                  {/* Dòng đỉnh ô: Số ngày và Biểu tượng lửa */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 bg-amber-50 w-6 h-6 flex items-center justify-center rounded-full border border-amber-100 shadow-inner">
                      {day}
                    </span>

                    {/* Hiển thị ngọn lửa dựa trên trạng thái học tập */}
                    {status.flame === "active" && (
                      <div
                        className="flex items-center gap-0.5 text-orange-500 animate-pulse"
                        title="Chuỗi học tập rực lửa"
                      >
                        <Flame size={14} className="fill-orange-500" />
                        <span className="text-[10px] font-black">{streak}</span>
                      </div>
                    )}
                    {status.flame === "frozen" && (
                      <div
                        className="flex items-center gap-0.5 text-cyan-500"
                        title="Đang trong thời gian bảo lưu (Dưới 3 ngày)"
                      >
                        <Snowflake
                          size={14}
                          className="animate-spin-slow text-cyan-400"
                        />
                        <Flame
                          size={14}
                          className="fill-cyan-200 text-cyan-400 opacity-60"
                        />
                      </div>
                    )}
                  </div>

                  {/* Vùng thân ô ngày: Danh sách môn học (Cuộn nếu quá tải môn) */}
                  <div className="flex-1 mt-1.5 space-y-1 overflow-y-auto pr-0.5 max-h-[72px] scrollbar-none">
                    {sortedSubjectsForDay.length > 0 ? (
                      sortedSubjectsForDay.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => openEditModal(sub)}
                          style={{ borderColor: sub.color }}
                          className="px-1.5 py-0.5 border-l-2 bg-amber-50/30 hover:bg-amber-50/80 rounded-md transition-all cursor-pointer flex flex-col"
                        >
                          <span className="text-[10px] font-extrabold text-zinc-950 truncate leading-none">
                            {sub.name}
                          </span>
                          <span className="text-[8px] font-medium text-zinc-500 scale-90 origin-left mt-0.5">
                            {sub.startTime}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[9px] text-zinc-400 italic text-center pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        Trống
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL THÊM / SỬA MÔN HỌC GIỮ NGUYÊN CỦA BẠN ================= */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-amber-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl relative shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-amber-950">
                {editingId ? "Chỉnh sửa môn học" : "Thêm môn học mới"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
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
                      className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl focus:ring-2 focus:ring-sky-500 transition-all outline-none text-amber-950 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-700 mb-1 block">
                      Nội dung môn học
                    </label>
                    <textarea
                      value={newSubject.description || ""}
                      onChange={(e) =>
                        setNewSubject({
                          ...newSubject,
                          description: e.target.value,
                        })
                      }
                      placeholder="VD: Làm bài tập chương 2, mang theo laptop..."
                      rows={4}
                      className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl focus:ring-2 focus:ring-sky-500 transition-all outline-none text-amber-950 resize-none text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
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
                        className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl outline-none text-amber-950 text-sm"
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
                        className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl outline-none text-amber-950 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
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
                        className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl outline-none text-amber-950 text-sm"
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
                        className="w-full px-4 py-3 bg-amber-50 border-none rounded-xl outline-none text-amber-950 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-700 mb-2 block">
                      Màu sắc
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {colors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() =>
                            setNewSubject({ ...newSubject, color: color.value })
                          }
                          className={`w-7 h-7 rounded-full transition-all border-2 ${newSubject.color === color.value ? "border-amber-950 scale-110 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"}`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
  <label className="text-sm font-medium text-amber-700 mb-2 block">
    Chế độ áp dụng thời gian
  </label>
  <div className="grid grid-cols-2 gap-2 p-1 bg-amber-50 rounded-xl border border-amber-200">
    <button
      type="button"
      onClick={() =>
        setNewSubject({
          ...newSubject,
          isRecurring: false,
          weekIdentifier: getWeekIdentifier(currentDate),
        })
      }
      className={`py-2 text-xs font-bold rounded-lg transition-all ${
        newSubject.isRecurring === false
          ? "bg-amber-950 text-white shadow-md shadow-amber-950/20"
          : "text-amber-800 hover:bg-amber-100"
      }`}
    >
      Chỉ tuần này
    </button>
    <button
      type="button"
      onClick={() =>
        setNewSubject({
          ...newSubject,
          isRecurring: true,
          weekIdentifier: undefined,
        })
      }
      className={`py-2 text-xs font-bold rounded-lg transition-all ${
        newSubject.isRecurring !== false
          ? "bg-amber-950 text-white shadow-md shadow-amber-950/20"
          : "text-amber-800 hover:bg-amber-100"
      }`}
    >
      Tất cả các tuần 
    </button>
  </div>
</div>
                  <div>
                    <label className="text-sm font-medium text-amber-700 mb-2 block">
                      Thứ trong tuần
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {days.map((day, idx) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const daysList = newSubject.daysOfWeek || [];
                            setNewSubject({
                              ...newSubject,
                              daysOfWeek: daysList.includes(idx)
                                ? daysList.filter((d) => d !== idx)
                                : [...daysList, idx],
                            });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${newSubject.daysOfWeek?.includes(idx) ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/10" : "bg-amber-50 text-amber-500 hover:bg-amber-100"}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                {editingId && (
                  <button
                    onClick={() => {
                      deleteSubject(editingId);
                      closeModal();
                    }}
                    className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all"
                  >
                    Xóa
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-amber-100 text-amber-600 font-bold rounded-xl hover:bg-amber-200 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={saveSubject}
                  className="flex-1 py-3 bg-amber-950 text-white font-bold rounded-xl hover:bg-amber-900 shadow-lg shadow-amber-100 transition-all"
                >
                  {editingId ? "Lưu thay đổi" : "Xác nhận"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};;

export default Calendar;
