import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDazUxRNjxzYAM-_vIH0kfpwf_e7MN3P1g",
  authDomain: "vinhomes-data.firebaseapp.com",
  projectId: "vinhomes-data",
  storageBucket: "vinhomes-data.firebasestorage.app",
  messagingSenderId: "429430673894",
  appId: "1:429430673894:web:3058c5fe2d985ca2aa4627"
};

// Khởi tạo Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const storage = getStorage(app);