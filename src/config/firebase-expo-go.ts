// Temporary Firebase configuration for Expo Go compatibility
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import * as Device from "expo-device";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAf8Z-qSdOmxjdxxZ4mBHeEJUHwJLrlSz4",
  authDomain: "time-recycling-service.firebaseapp.com",
  projectId: "time-recycling-service",
  storageBucket: "time-recycling-service.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Expo Go compatible FCM service (mock for development)
export const FCMPushNotificationService = {
  setupBackgroundHandler: () => {
    console.log("📱 FCM Background handler setup (Expo Go mode)");
  },

  setupForegroundListener: () => {
    console.log("📱 FCM Foreground listener setup (Expo Go mode)");
    return () => {}; // Return cleanup function
  },

  sendTestNotification: async (userId: string, role: string) => {
    console.log("📱 Test notification sent (Expo Go mode)", { userId, role });
    return { success: true, message: "Test notification sent in Expo Go mode" };
  },

  registerForPushNotifications: async (userId: string) => {
    console.log("📱 Push notification registration (Expo Go mode)", userId);
    return "expo-go-mock-token";
  },
};

export default app;
