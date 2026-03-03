import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA3Uk02QjFHakR5AirMzgzaj2xtu14JoVQ",
  authDomain: "ecommerce-app-680a3.firebaseapp.com",
  projectId: "ecommerce-app-680a3",
  storageBucket: "ecommerce-app-680a3.firebasestorage.app",
  messagingSenderId: "235289853400",
  appId: "1:235289853400:web:4390f213ac90b0fa8bc6ad"
};

// Init app
const app = initializeApp(firebaseConfig);

// auth
export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });

// Firestore
export const db =
  Platform.OS === "web"
    ? getFirestore(app)
    : initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });

// Storage 
export const storage = getStorage(app);

export default app;
