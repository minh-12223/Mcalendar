// src/components/auth/AvatarHeader.tsx
import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/index.js";
import { useAuth } from "../../hooks/useAuth.js";
import { LogOut, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarHeaderProps {
  onOpenAuth: () => void;
}

const AvatarHeader: React.FC<AvatarHeaderProps> = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { currentAvatar } = useSelector((state: RootState) => state.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi nhấp ra ngoài vùng chọn
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-4 right-8 z-50" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden hover:scale-105 transition-transform bg-amber-100"
      >
        <img
          src={
            currentAvatar ||
            "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest"
          }
          alt="User Avatar"
          className="w-full h-full object-cover"
        />
      </button>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-amber-50 overflow-hidden"
          >
            <div className="p-2">
              {!isAuthenticated ? (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-amber-900 hover:bg-amber-50 rounded-xl transition-colors"
                >
                  <LogIn size={18} className="text-amber-600" />
                  Đăng nhập / Đăng ký
                </button>
              ) : (
                <>
                  <div className="px-4 py-3 border-b border-amber-50 mb-1">
                    <p className="text-xs font-bold text-amber-900 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      alert("Tính năng Đổi avatar đang được phát triển!");
                    }}
                    className="w-full flex flex-col items-start px-4 py-2 hover:bg-amber-50 rounded-xl transition-colors"
                  >
                    <span className="text-sm font-bold text-amber-900">
                      Avatar của tôi
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">
                      Đổi ảnh đại diện
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1"
                  >
                    <LogOut size={18} />
                    Đăng xuất
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvatarHeader;
