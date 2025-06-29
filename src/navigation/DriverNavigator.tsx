import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

// Import screens
import { DriverDashboard } from "../screens/driver/DriverDashboard";
import { DriverPickupsScreen } from "../screens/driver/DriverPickupsScreen";
import { DriverProfileScreen } from "../screens/driver/DriverProfileScreen";
import { CompletePickupScreen } from "../screens/driver/CompletePickupScreen";
import { PickupDetailsScreen } from "../screens/driver/PickupDetailsScreen";
import { AvailablePickupsScreen } from "../screens/driver/AvailablePickupsScreen";
import { CompletePickupWithProofScreen } from "../screens/driver/CompletePickupWithProofScreen";
import { CancelPickupScreen } from "../screens/driver/CancelPickupScreen";
import { NotificationScreen } from "../screens/NotificationScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DriverDashboard} />
    <Stack.Screen name="PickupDetails" component={PickupDetailsScreen} />
    <Stack.Screen name="CompletePickup" component={CompletePickupScreen} />
    <Stack.Screen
      name="CompletePickupWithProof"
      component={CompletePickupWithProofScreen}
    />
    <Stack.Screen name="AvailablePickups" component={AvailablePickupsScreen} />
    <Stack.Screen name="CancelPickup" component={CancelPickupScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
  </Stack.Navigator>
);

// My Pickups Stack - Primary pickup management
const MyPickupsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyPickups" component={DriverPickupsScreen} />
    <Stack.Screen name="PickupDetails" component={PickupDetailsScreen} />
    <Stack.Screen name="CompletePickup" component={CompletePickupScreen} />
    <Stack.Screen
      name="CompletePickupWithProof"
      component={CompletePickupWithProofScreen}
    />
    <Stack.Screen name="CancelPickup" component={CancelPickupScreen} />
  </Stack.Navigator>
);

// Available Pickups Stack
const AvailablePickupsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AvailablePickups" component={AvailablePickupsScreen} />
    <Stack.Screen name="PickupDetails" component={PickupDetailsScreen} />
    <Stack.Screen name="CompletePickup" component={CompletePickupScreen} />
    <Stack.Screen
      name="CompletePickupWithProof"
      component={CompletePickupWithProofScreen}
    />
    <Stack.Screen name="CancelPickup" component={CancelPickupScreen} />
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
            case "MyPickupsTab":
              iconName = focused ? "clipboard" : "clipboard-outline";
              break;
            case "AvailableTab":
              iconName = focused ? "cube" : "cube-outline";
              break;
            case "DashboardTab":
              iconName = focused ? "home" : "home-outline";
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
        name="MyPickupsTab"
        component={MyPickupsStack}
        options={{
          tabBarLabel: "My Pickups",
          tabBarBadge: undefined, // TODO: Add pickup count badge
        }}
      />
      <Tab.Screen
        name="AvailableTab"
        component={AvailablePickupsStack}
        options={{ tabBarLabel: "Available" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
};
