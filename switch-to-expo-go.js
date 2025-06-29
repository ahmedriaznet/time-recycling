#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔄 Switching to Expo Go compatible mode...");

// Backup and replace FCM service
const fcmOriginal = "src/utils/fcmPushNotificationService.ts";
const fcmBackup = "src/utils/fcmPushNotificationService.backup.ts";
const fcmExpoGo = "src/utils/fcmPushNotificationService-expo-go.ts";

try {
  // Backup original FCM service
  if (fs.existsSync(fcmOriginal) && !fs.existsSync(fcmBackup)) {
    fs.renameSync(fcmOriginal, fcmBackup);
    console.log("✅ Backed up original FCM service");
  }

  // Copy Expo Go compatible version
  fs.copyFileSync(fcmExpoGo, fcmOriginal);
  console.log("✅ Switched to Expo Go compatible FCM service");

  // Update imports in key files that use FCM
  const filesToUpdate = ["App.tsx", "src/screens/NotificationScreen.tsx"];

  filesToUpdate.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, "utf8");

      // Replace React Native Firebase imports with web SDK
      content = content.replace(
        /import.*@react-native-firebase.*\n/g,
        "// React Native Firebase imports disabled for Expo Go\n",
      );

      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${filePath} for Expo Go compatibility`);
    }
  });

  console.log("🎉 Successfully switched to Expo Go mode!");
  console.log("📱 You can now scan the QR code with Expo Go app");
  console.log("⚠️  Note: Some native features may be limited in Expo Go");
} catch (error) {
  console.error("❌ Error switching to Expo Go mode:", error.message);
}
