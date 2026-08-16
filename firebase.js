import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDazUxRNjxzYAM-_vIH0kfpwf_e7MN3P1g",
  authDomain: "vinhomes-data.firebaseapp.com",
  projectId: "vinhomes-data",
  storageBucket: "vinhomes-data.firebasestorage.app",
  messagingSenderId: "429430673894",
  appId: "1:429430673894:web:3058c5fe2d985ca2aa4627"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 
export const provider = new GoogleAuthProvider();