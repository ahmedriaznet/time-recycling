import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useUnifiedAuth } from "../hooks/useUnifiedAuth";
import { FCMPushNotificationService } from "../utils/fcmPushNotificationService";
import { useNotification } from "../contexts/NotificationContext";

interface InAppNotification {
  id: string;
  recipientId: string;
  recipientRole: "vendor" | "driver" | "admin";
  type: string;
  title: string;
  message: string;
  pickupId?: string;
  isRead: boolean;
  deleted?: boolean;
  createdAt: any;
}

export const NotificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useUnifiedAuth();
  const { showNotification } = useNotification();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    if (!user) return;

    console.log(
      "🔔 Setting up notifications listener for user:",
      user.uid,
      "role:",
      user.role,
    );

    // Listen to notifications for current user
    // For admin, check both specific admin ID and "admin" recipientId
    let q;
    if (user.role === "admin") {
      // Query for admin notifications - only signup-related notifications
      q = query(
        collection(db, "notifications"),
        where("recipientRole", "==", "admin"),
        where("type", "in", ["user_signup", "driver_signup", "vendor_signup"]),
        orderBy("createdAt", "desc"),
      );
    } else {
      // Query for regular user notifications
      q = query(
        collection(db, "notifications"),
        where("recipientId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allNotifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as InAppNotification[];

        // Filter out deleted notifications on client side
        const notificationData = allNotifications.filter(
          (notification) => !notification.deleted,
        );

        console.log(`📱 Loaded ${notificationData.length} notifications`);
        setNotifications(notificationData);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error loading notifications:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        isRead: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      const unreadNotifications = notifications.filter((n) => !n.isRead);

      for (const notification of unreadNotifications) {
        await updateDoc(doc(db, "notifications", notification.id), {
          isRead: true,
        });
      }

      // Visual feedback without blocking alert
      showNotification({
        type: "success",
        title: "Marked as Read",
        message: `${unreadNotifications.length} notifications marked as read`,
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to mark notifications as read",
      });
    } finally {
      setMarkingAllRead(false);
    }
  };

  const clearAllNotifications = async () => {
    try {
      setClearingAll(true);
      const notificationCount = notifications.length;

      // Delete all notifications for this user
      for (const notification of notifications) {
        await updateDoc(doc(db, "notifications", notification.id), {
          deleted: true,
        });
      }

      // Visual feedback without blocking alert
      showNotification({
        type: "success",
        title: "Cleared",
        message: `${notificationCount} notifications cleared`,
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to clear notifications",
      });
    } finally {
      setClearingAll(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // The listener will automatically update when data changes
    setTimeout(() => setRefreshing(false), 1000);
  };

  const sendTestNotification = async () => {
    if (!user) return;

    setTestingNotification(true);
    try {
      const result = await FCMPushNotificationService.sendTestNotification(
        user.uid,
        user.role,
      );

      if (result.success) {
        Alert.alert(
          "Test Sent! 🎉",
          "Check your notification panel in a few seconds. You should receive a push notification and see it appear in this list.",
          [{ text: "OK" }],
        );
      } else {
        Alert.alert("Test Failed ❌", result.message, [{ text: "OK" }]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to send test notification. Check console for details.",
        [{ text: "OK" }],
      );
    } finally {
      setTestingNotification(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "pickup_accepted":
        return "checkmark-circle";
      case "pickup_completed":
        return "checkmark-done-circle";
      case "pickup_cancelled":
        return "close-circle";
      case "pickup_scheduled":
        return "calendar";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "pickup_accepted":
        return "#10B981";
      case "pickup_completed":
        return "#059669";
      case "pickup_cancelled":
        return "#EF4444";
      case "pickup_scheduled":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={sendTestNotification}
              disabled={testingNotification}
              style={[
                styles.testButton,
                { opacity: testingNotification ? 0.6 : 1 },
              ]}
            >
              <Text style={styles.testButtonText}>
                {testingNotification ? "Sending..." : "Test FCM"}
              </Text>
            </TouchableOpacity>

            {notifications.length > 0 && (
              <TouchableOpacity
                onPress={clearAllNotifications}
                style={[
                  styles.clearAllButton,
                  clearingAll && styles.buttonDisabled,
                ]}
                disabled={clearingAll}
              >
                <Text style={styles.clearAllText}>
                  {clearingAll ? "Clearing..." : "Clear All"}
                </Text>
              </TouchableOpacity>
            )}

            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                style={[
                  styles.markAllButton,
                  markingAllRead && styles.buttonDisabled,
                ]}
                disabled={markingAllRead}
              >
                <Text style={styles.markAllText}>
                  {markingAllRead ? "Marking..." : "Mark All Read"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="notifications-outline"
                size={64}
                color="rgba(255,255,255,0.5)"
              />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubText}>
                You'll receive notifications about pickup updates here
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.isRead && styles.unreadCard,
                ]}
                onPress={() => markAsRead(notification.id)}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: getNotificationColor(notification.type),
                    },
                  ]}
                >
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={20}
                    color="white"
                  />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatDate(notification.createdAt)}
                  </Text>
                </View>

                {!notification.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    width: 60,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 160,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  markAllText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    borderRadius: 12,
  },
  clearAllText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(16, 185, 129, 0.8)",
    borderRadius: 12,
  },
  testButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
  notificationCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  unreadCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationMessage: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginLeft: 8,
    marginTop: 4,
  },
});
