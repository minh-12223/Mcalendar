// src/hooks/useAuth.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Thay đổi updateDoc sang setDoc an toàn hơn
import { auth, db } from "../services/firebase.js";
import type { UserProfile, PetState } from "../types.js";

interface AuthUser {
  email: string | null;
  uid: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  syncStatsToCloud: (stats: {
    streak?: number;
    diamonds?: number;
    exp?: number;
    hunger?: number;
  }) => Promise<void>;
  syncDataStructureToCloud: (
    key: "subjects" | "user_profile" | "pet_state",
    data: any,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const authUser = { email: firebaseUser.email, uid: firebaseUser.uid };
        setUser(authUser);
        localStorage.setItem("auth_user", JSON.stringify(authUser));
      } else {
        setUser(null);
        localStorage.removeItem("auth_user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      const currentProfile = JSON.parse(
        localStorage.getItem("user_profile") || "null",
      );
      const currentSubjects = JSON.parse(
        localStorage.getItem("subjects") || "[]",
      );
      const currentPet = JSON.parse(
        localStorage.getItem("pet_state") || "null",
      );

      // Đồng bộ mức kim cương ban đầu là 5000 trùng với Redux userSlice
      const initialProfile: UserProfile = currentProfile || {
        id: firebaseUser.uid,
        name: email.split("@")[0],
        email: email,
        streak: 0,
        diamonds: 5000,
        ownedItems: [],
        currentAvatar:
          "https://api.dicebear.com/7.x/avataaars/svg?seed=Student",
        ownedAvatars: [
          "https://api.dicebear.com/7.x/avataaars/svg?seed=Student",
        ],
        exp: 0,
      };

      const initialPet: PetState = currentPet || {
        name: "Monkey",
        level: 1,
        exp: 0,
        maxExp: 100,
        health: 100,
        hunger: 100,
        status: "HAPPY",
        evolutionStage: "EGG",
        petType: "slime",
      };

      // Khởi tạo document gốc trên Firestore cực kỳ an toàn
      await setDoc(doc(db, "users", firebaseUser.uid), {
        email: firebaseUser.email,
        streak: initialProfile.streak,
        diamonds: initialProfile.diamonds,
        exp: initialProfile.exp,
        hunger: initialPet.hunger,
        userData: {
          profile: initialProfile,
          subjects: currentSubjects,
          pet: initialPet,
        },
      });

      localStorage.setItem("user_profile", JSON.stringify(initialProfile));
      localStorage.setItem("subjects", JSON.stringify(currentSubjects));
      localStorage.setItem("pet_state", JSON.stringify(initialPet));
    } catch (error: any) {
      console.error("Lỗi đăng ký tài khoản:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data() as any;

        const safeEmail: string = firebaseUser.email || email || "";
        const fallbackName: string = safeEmail
          ? safeEmail.split("@")[0]
          : "Student";

        let cleanProfile = data.userData?.profile || {
          id: firebaseUser.uid,
          name: fallbackName,
          email: safeEmail,
          streak: 0,
          diamonds: 5000,
          ownedItems: [],
          currentAvatar:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=Student",
          ownedAvatars: [
            "https://api.dicebear.com/7.x/avataaars/svg?seed=Student",
          ],
          exp: 0,
        };

        // Đồng bộ các chỉ số phẳng ngoài màn hình gốc vào object profile trong máy mới
        cleanProfile.streak =
          data.streak !== undefined ? data.streak : cleanProfile.streak || 0;
        cleanProfile.diamonds =
          data.diamonds !== undefined
            ? data.diamonds
            : cleanProfile.diamonds || 5000;
        cleanProfile.exp =
          data.exp !== undefined ? data.exp : cleanProfile.exp || 0;

        if (!cleanProfile.name) cleanProfile.name = fallbackName;
        if (!cleanProfile.email) cleanProfile.email = safeEmail;

        let cleanPet = data.userData?.pet || {
          name: "Thú cưng ảo",
          level: 1,
          exp: 0,
          maxExp: 100,
          health: 100,
          hunger: 100,
          status: "HAPPY",
          evolutionStage: "EGG",
          petType: "slime",
        };
        cleanPet.hunger =
          data.hunger !== undefined ? data.hunger : cleanPet.hunger || 100;

        // Lưu toàn bộ dữ liệu kéo từ đám mây xuống LocalStorage của máy mới
        localStorage.setItem("user_profile", JSON.stringify(cleanProfile));
        localStorage.setItem("pet_state", JSON.stringify(cleanPet));
        localStorage.setItem(
          "subjects",
          JSON.stringify(data.userData?.subjects || []),
        );
        localStorage.setItem(
          "auth_user",
          JSON.stringify({ email: safeEmail, uid: firebaseUser.uid }),
        );

        // Tải lại trang để ứng dụng nhận cấu hình bộ nhớ mới
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Lỗi đăng nhập hệ thống:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("subjects");
    localStorage.removeItem("pet_state");
    window.location.reload();
  };

  // Sửa hàm đồng bộ chỉ số phẳng dùng setDoc { merge: true } chống lỗi sập luồng
  const syncStatsToCloud = async (stats: {
    streak?: number;
    diamonds?: number;
    exp?: number;
    hunger?: number;
  }) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const profile = JSON.parse(localStorage.getItem("user_profile") || "{}");
      const pet = JSON.parse(localStorage.getItem("pet_state") || "{}");

      if (stats.streak !== undefined) profile.streak = stats.streak;
      if (stats.diamonds !== undefined) profile.diamonds = stats.diamonds;
      if (stats.exp !== undefined) profile.exp = stats.exp;
      if (stats.hunger !== undefined) pet.hunger = stats.hunger;

      await setDoc(
        userRef,
        {
          ...stats,
          userData: {
            profile: profile,
            pet: pet,
          },
        },
        { merge: true },
      );
      console.log("Đã đồng bộ thành công các chỉ số lên Firebase!");
    } catch (e) {
      console.error("Lỗi đồng bộ chỉ số lên Cloud:", e);
    }
  };

  // Sửa hàm đồng bộ cấu trúc Object lớn dùng setDoc { merge: true }
  const syncDataStructureToCloud = async (
    key: "subjects" | "user_profile" | "pet_state",
    data: any,
  ) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      let updatePayload: any = { userData: {} };

      if (key === "subjects") {
        updatePayload.userData.subjects = data;
      } else if (key === "user_profile") {
        updatePayload.userData.profile = data;
        // Đẩy song song ra các trường phẳng bên ngoài để dễ quản lý trên Firebase Console
        if (data.streak !== undefined) updatePayload.streak = data.streak;
        if (data.diamonds !== undefined) updatePayload.diamonds = data.diamonds;
        if (data.exp !== undefined) updatePayload.exp = data.exp;
      } else if (key === "pet_state") {
        updatePayload.userData.pet = data;
        if (data.hunger !== undefined) updatePayload.hunger = data.hunger;
      }

      // { merge: true } bảo đảm chỉ ghi đè thuộc tính được chỉ định, giữ nguyên các thuộc tính khác
      await setDoc(userRef, updatePayload, { merge: true });
      console.log(`Đồng bộ thành công cấu trúc [${key}] lên Firebase!`);
    } catch (e) {
      console.error(`Lỗi đồng bộ cấu trúc ${key} lên Cloud:`, e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        syncStatsToCloud,
        syncDataStructureToCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
