import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, serverTimestamp } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFunctions, Functions } from "firebase/functions";
import Constants from "expo-constants";

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Live Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXJWq6ppJFwONemNv61kIiJGNgXKNW2WU",
  authDomain: "time-recycling-center.firebaseapp.com",
  projectId: "time-recycling-center",
  storageBucket: "time-recycling-center.firebasestorage.app",
  messagingSenderId: "927725060450",
  appId: "1:927725060450:web:c21b66f1b18753fcc56c3b",
};

// Firebase services
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

try {
  // Initialize Firebase app
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase app initialized with live config");
  } else {
    app = getApps()[0];
    console.log("✅ Using existing Firebase app");
  }

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);

  // Note: React Native Firebase automatically handles auth persistence
  console.log("✅ All Firebase services initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
  throw error;
}

// Test Firebase connection
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    if (!auth || !db) {
      console.error("❌ Firebase services not initialized");
      return false;
    }

    // Add a simple timeout test
    const connectionTest = new Promise<boolean>((resolve) => {
      // Simple test - just check if services exist
      const isReady = auth.app && db.app;
      console.log("✅ Firebase services are ready:", isReady);
      resolve(isReady);
    });

    const timeout = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error("Connection test timeout")), 3000),
    );

    return await Promise.race([connectionTest, timeout]);
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error);
    return false;
  }
};

// Export Firebase services
export { auth, db, storage, functions, serverTimestamp };

// Default export
export default app;
