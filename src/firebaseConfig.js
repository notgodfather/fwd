// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyAEpZ56WrFO3ZI0aDiPixBr-tpyXTTthXc",
  authDomain: "recipeapp-72f2e.firebaseapp.com",
  projectId: "recipeapp-72f2e",
  storageBucket: "recipeapp-72f2e.firebasestorage.app",
  messagingSenderId: "48790073044",
  appId: "1:48790073044:web:f7c6e91e987865b73a5541"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
export const storage = getStorage(app);
