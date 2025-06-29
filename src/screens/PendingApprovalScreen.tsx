import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useUnifiedAuth } from "../hooks/useUnifiedAuth";

export const PendingApprovalScreen: React.FC = () => {
  const { user, signOut } = useUnifiedAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isRejected = user?.approvalStatus === "rejected";

  return (
    <LinearGradient
      colors={isRejected ? ["#ef4444", "#dc2626"] : ["#f59e0b", "#d97706"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 48 }}>
            <View
              style={{
                width: 120,
                height: 120,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 60,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
              }}
            >
              <Ionicons
                name={isRejected ? "close-circle-outline" : "time-outline"}
                size={64}
                color="white"
              />
            </View>

            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "white",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {isRejected ? "Application Rejected" : "Approval Pending"}
            </Text>

            <Text
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.9)",
                textAlign: "center",
                lineHeight: 28,
                marginBottom: 32,
              }}
            >
              {isRejected
                ? `Unfortunately, your ${user?.role || "driver"} application has been rejected.`
                : `Your ${user?.role || "driver"} application is currently under review. We'll notify you once a decision has been made.`}
            </Text>

            {isRejected && user?.rejectionReason && (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 32,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "white",
                    marginBottom: 8,
                  }}
                >
                  Reason for Rejection:
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: "rgba(255,255,255,0.9)",
                    lineHeight: 24,
                  }}
                >
                  {user.rejectionReason}
                </Text>
              </View>
            )}

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 20,
                marginBottom: 32,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
                width: "100%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color="white"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "white",
                  }}
                >
                  Application Details
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row" }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.7)",
                      width: 100,
                    }}
                  >
                    Name:
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "white",
                      fontWeight: "500",
                      flex: 1,
                    }}
                  >
                    {user?.name}
                  </Text>
                </View>
                <View style={{ flexDirection: "row" }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.7)",
                      width: 100,
                    }}
                  >
                    Email:
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "white",
                      fontWeight: "500",
                      flex: 1,
                    }}
                  >
                    {user?.email}
                  </Text>
                </View>
                {user?.role === "driver" && (
                  <View style={{ flexDirection: "row" }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.7)",
                        width: 100,
                      }}
                    >
                      Vehicle:
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "white",
                        fontWeight: "500",
                        flex: 1,
                      }}
                    >
                      {user?.vehicleInfo || "Not provided"}
                    </Text>
                  </View>
                )}
                {user?.role === "vendor" && (
                  <View style={{ flexDirection: "row" }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.7)",
                        width: 100,
                      }}
                    >
                      Business:
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "white",
                        fontWeight: "500",
                        flex: 1,
                      }}
                    >
                      {user?.businessName || "Not provided"}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: "row" }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.7)",
                      width: 100,
                    }}
                  >
                    Applied:
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "white",
                      fontWeight: "500",
                      flex: 1,
                    }}
                  >
                    {user?.createdAt?.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            {!isRejected && (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 32,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.2)",
                  width: "100%",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.9)",
                    textAlign: "center",
                    lineHeight: 20,
                  }}
                >
                  💡 Tip: The approval process typically takes 1-3 business
                  days. You'll receive an email notification once your
                  application is reviewed.
                </Text>
              </View>
            )}

            <View style={{ gap: 16, width: "100%" }}>
              {isRejected && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "white",
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      color: "#ef4444",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Contact Support
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSignOut}
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderWidth: 2,
                  borderColor: "white",
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "600" }}
                >
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};
