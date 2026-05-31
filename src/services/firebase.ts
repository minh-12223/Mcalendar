import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIt9cqRMhczyfXaXI285xR_cD2pHjTd5s",
  authDomain: "gen-lang-client-0759155502.firebaseapp.com",
  databaseURL:
    "https://gen-lang-client-0759155502-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gen-lang-client-0759155502",
  storageBucket: "gen-lang-client-0759155502.firebasestorage.app",
  messagingSenderId: "938090210509",
  appId: "1:938090210509:web:e8f93a2a7f0891b9ba7584",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
