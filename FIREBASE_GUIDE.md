# Hướng dẫn tích hợp Firebase Auth cho Mcalendar

Để chuyển từ Mock Auth sang Firebase Auth thật, hãy làm theo các bước sau:

## 1. Cài đặt Firebase SDK
Chạy lệnh sau trong terminal:
```bash
npm install firebase
```

## 2. Cấu hình Firebase (`src/services/firebase.ts`)
Tạo file mới và dán cấu hình từ Firebase Console của bạn:
```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## 3. Cập nhật `src/hooks/useAuth.tsx` cho Firebase
Dưới đây là các hàm mẫu sử dụng Firebase SDK:

```typescript
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase.js";

// Trong AuthProvider:

const register = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Lấy dữ liệu hiện tại từ LocalStorage
  const currentProfile = JSON.parse(localStorage.getItem('user_profile') || 'null');
  const currentSubjects = JSON.parse(localStorage.getItem('subjects') || '[]');
  const currentPet = JSON.parse(localStorage.getItem('pet_state') || 'null');

  // Lưu lên Firestore
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    userData: {
      profile: currentProfile,
      subjects: currentSubjects,
      pet: currentPet
    }
  });
};

const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Lấy dữ liệu từ Firestore về
  const docSnap = await getDoc(doc(db, "users", user.uid));
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Cập nhật LocalStorage và State
    localStorage.setItem('user_profile', JSON.stringify(data.userData.profile));
    localStorage.setItem('subjects', JSON.stringify(data.userData.subjects));
    localStorage.setItem('pet_state', JSON.stringify(data.userData.pet));
    window.location.reload();
  }
};
```

## 4. Ưu điểm của Firebase
- Bảo mật mật khẩu tuyệt đối.
- Quản lý session tự động (không cần lưu `auth_user` thủ công).
- Firestore cho phép truy vấn dữ liệu linh hoạt hơn.
