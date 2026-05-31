// src/components/auth/AuthModal.tsx
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { X, Mail, Lock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { login, register, loading } = useAuth();

  // Bộ lọc dịch mã lỗi Firebase sang tiếng Việt
  const getFirebaseErrorMessage = (err: any): string => {
    const errorCode = err?.code || err?.message || "";
    if (
      errorCode.includes("user-not-found") ||
      errorCode.includes("wrong-password") ||
      errorCode.includes("invalid-credential")
    ) {
      return "Email hoặc mật khẩu không chính xác.";
    }
    if (errorCode.includes("email-already-in-use")) {
      return "Email này đã được đăng ký bởi tài khoản khác.";
    }
    if (errorCode.includes("weak-password")) {
      return "Mật khẩu quá yếu. Vui lòng nhập từ 6 ký tự trở lên.";
    }
    if (errorCode.includes("invalid-email")) {
      return "Định dạng email không hợp lệ.";
    }
    return err.message || "Có lỗi xảy ra, vui lòng thử lại.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Kiểm tra mật khẩu khớp nhau khi ĐĂNG KÝ
    if (!isLogin && password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Gọi hàm register thật của Firebase
        await register(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-amber-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold">
              {isLogin ? "Chào mừng trở lại!" : "Bắt đầu hành trình"}
            </h2>
            <p className="text-amber-100 text-sm mt-1">
              {isLogin
                ? "Đăng nhập để đồng bộ dữ liệu của bạn."
                : "Tạo tài khoản để lưu trữ lịch học và thú cưng."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-amber-900 ml-1">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400"
                  size={18}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-amber-900 ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400"
                  size={18}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-900 ml-1">
                  Nhập lại mật khẩu
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400"
                    size={18}
                  />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : isLogin ? (
                "Đăng nhập"
              ) : (
                "Đăng ký ngay"
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-amber-800/60">
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setIsLogin(!isLogin);
                  }}
                  className="ml-1 font-bold text-amber-600 hover:text-amber-700"
                >
                  {isLogin ? "Đăng ký" : "Đăng nhập"}
                </button>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
