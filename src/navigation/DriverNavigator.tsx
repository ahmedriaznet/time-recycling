import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

// Import screens
import { DriverDashboard } from "../screens/driver/DriverDashboard";
import { DriverPickupsScreen } from "../screens/driver/DriverPickupsScreen";
import { DriverHistoryScreen } from "../screens/driver/DriverHistoryScreen";
import { DriverProfileScreen } from "../screens/driver/DriverProfileScreen";
import { CompletePickupScreen } from "../screens/driver/CompletePickupScreen";
import { PickupDetailsScreen } from "../screens/driver/PickupDetailsScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DriverDashboard} />
    <Stack.Screen name="PickupDetails" component={PickupDetailsScreen} />
    <Stack.Screen name="CompletePickup" component={CompletePickupScreen} />
  </Stack.Navigator>
);

// Pickups Stack
const PickupsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Pickups" component={DriverPickupsScreen} />
    <Stack.Screen name="PickupDetails" component={PickupDetailsScreen} />
    <Stack.Screen name="CompletePickup" component={CompletePickupScreen} />
  </Stack.Navigator>
);

// History Stack
const HistoryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="History" component={DriverHistoryScreen} />
    <Stack.Screen name="PickupDetails" component={PickupDetailsScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={DriverProfileScreen} />
  </Stack.Navigator>
);

export const DriverNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case "DashboardTab":
              iconName = focused ? "car" : "car-outline";
              break;
            case "PickupsTab":
              iconName = focused ? "list" : "list-outline";
              break;
            case "HistoryTab":
              iconName = focused ? "time" : "time-outline";
              break;
            case "ProfileTab":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "help-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: "#e5e7eb",
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{ tabBarLabel: "Dashboard" }}
      />
      <Tab.Screen
        name="PickupsTab"
        component={PickupsStack}
        options={{ tabBarLabel: "Pickups" }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStack}
        options={{ tabBarLabel: "History" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
};
