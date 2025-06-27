import { Alert } from "react-native";
import * as Haptics from "expo-haptics";

export const showSuccessMessage = (title: string, message: string) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  Alert.alert(title, message);
};

export const showErrorMessage = (title: string, message: string) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  Alert.alert(title, message);
};

export const showFirebaseIntegrationSuccess = () => {
  showSuccessMessage(
    "🔥 Firebase Integration Complete!",
    "Time Recycling Service is now fully connected to Firebase with:\n\n" +
      "✅ Real-time Authentication\n" +
      "✅ Live Firestore Database\n" +
      "✅ Automatic Data Sync\n" +
      "✅ Photo Upload Ready\n" +
      "✅ Push Notifications Setup\n\n" +
      "You can now create accounts, schedule pickups, and use all features live!",
  );
};
