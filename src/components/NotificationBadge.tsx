import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useUnifiedAuth } from "../hooks/useUnifiedAuth";

interface NotificationBadgeProps {
  color?: string;
  size?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  color = "white",
  size = 24,
}) => {
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    try {
      // Listen to unread notifications for current user
      // Simplified query to avoid Firestore limitations with multiple where conditions
      let q;
      if (user.role === "admin") {
        // Match the same filtering as NotificationScreen for admin
        q = query(
          collection(db, "notifications"),
          where("recipientRole", "==", "admin"),
          where("type", "in", [
            "user_signup",
            "driver_signup",
            "vendor_signup",
          ]),
          where("isRead", "==", false),
          orderBy("createdAt", "desc"),
        );
      } else {
        q = query(
          collection(db, "notifications"),
          where("recipientId", "==", user.uid),
          where("isRead", "==", false),
          orderBy("createdAt", "desc"),
        );
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // Filter out deleted notifications on the client side
          const validNotifications = snapshot.docs.filter((doc) => {
            const data = doc.data();
            return !data.deleted;
          });
          setUnreadCount(validNotifications.length);
        },
        (error) => {
          console.error("Error loading notification count:", error);
          setUnreadCount(0);
        },
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up notification listener:", error);
      setUnreadCount(0);
    }
  }, [user]);

  const handlePress = () => {
    navigation.navigate("Notifications" as never);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});
