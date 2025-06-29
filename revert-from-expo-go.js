#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔄 Reverting from Expo Go mode to development build...");

const fcmOriginal = "src/utils/fcmPushNotificationService.ts";
const fcmBackup = "src/utils/fcmPushNotificationService.backup.ts";

try {
  // Restore original FCM service
  if (fs.existsSync(fcmBackup)) {
    if (fs.existsSync(fcmOriginal)) {
      fs.unlinkSync(fcmOriginal);
    }
    fs.renameSync(fcmBackup, fcmOriginal);
    console.log("✅ Restored original FCM service");
  }

  console.log("🎉 Successfully reverted to development build mode!");
  console.log(
    '📱 You can now use "expo run:android" or build APKs with Gradle',
  );
} catch (error) {
  console.error("❌ Error reverting from Expo Go mode:", error.message);
}
