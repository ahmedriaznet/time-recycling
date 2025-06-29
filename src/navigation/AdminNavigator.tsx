import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { AdminDashboard } from "../screens/admin/AdminDashboard";
import { ApprovalManagementScreen } from "../screens/admin/ApprovalManagementScreen";
import { UserDetailScreen } from "../screens/admin/UserDetailScreen";
import { AdminProfileScreen } from "../screens/admin/AdminProfileScreen";
import { DriverDetailsScreen } from "../screens/admin/DriverDetailsScreen";

import { DriverAvailabilityScreen } from "../screens/admin/DriverAvailabilityScreen";
import { PickupManagementScreen } from "../screens/admin/PickupManagementScreen";
import { NotificationScreen } from "../screens/NotificationScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#f8fafc" },
      }}
    >
      <Stack.Screen name="Dashboard" component={AdminDashboard} />
      <Stack.Screen
        name="DriverAvailability"
        component={DriverAvailabilityScreen}
      />
      <Stack.Screen
        name="PickupManagement"
        component={PickupManagementScreen}
      />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
    </Stack.Navigator>
  );
};

const ApprovalStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#f8fafc" },
      }}
    >
      <Stack.Screen
        name="ApprovalManagement"
        component={ApprovalManagementScreen}
      />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      <Stack.Screen name="DriverDetails" component={DriverDetailsScreen} />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#f8fafc" },
      }}
    >
      <Stack.Screen name="Profile" component={AdminProfileScreen} />
      <Stack.Screen
        name="ApprovalManagement"
        component={ApprovalManagementScreen}
      />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      <Stack.Screen name="DriverDetails" component={DriverDetailsScreen} />
    </Stack.Navigator>
  );
};

export const AdminNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "DashboardTab") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "DriverApprovalTab") {
            iconName = focused ? "car" : "car-outline";
          } else if (route.name === "VendorApprovalTab") {
            iconName = focused ? "storefront" : "storefront-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "home-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          tabBarLabel: "Dashboard",
        }}
      />
      <Tab.Screen
        name="DriverApprovalTab"
        component={ApprovalStack}
        options={{
          tabBarLabel: "Drivers",
        }}
        initialParams={{
          screen: "ApprovalManagement",
          params: { tab: "drivers" },
        }}
      />
      <Tab.Screen
        name="VendorApprovalTab"
        component={ApprovalStack}
        options={{
          tabBarLabel: "Vendors",
        }}
        initialParams={{
          screen: "ApprovalManagement",
          params: { tab: "vendors" },
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
};
