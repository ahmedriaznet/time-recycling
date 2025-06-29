import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, serverTimestamp } from "../config/firebase";
import { FCMPushNotificationService } from "../utils/fcmPushNotificationService";
import { ensureAdminExists, isAdminEmail } from "../utils/adminSetup";
import EmailService from "../services/emailService";

interface UserProfile {
  uid: string;
  email: string;
  role: "vendor" | "driver" | "admin";
  name: string;
  phone?: string;
  businessName?: string; // for vendors
  vehicleInfo?: string; // for drivers
  approvalStatus?: "pending" | "approved" | "rejected"; // for drivers
  rejectionReason?: string; // for rejected drivers
  emailVerified: boolean; // email verification status
  createdAt: Date;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    role: "vendor" | "driver" | "admin",
    additionalData?: any,
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.log(
        "❌ Firebase Auth not available, cannot set up auth listener",
      );
      setLoading(false);
      return;
    }

    console.log("🔐 Setting up Firebase auth state listener");
    console.log("🔄 Auth persistence should be automatic in React Native");

    // Ensure admin account exists
    ensureAdminExists();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "🔍 Auth state changed - User:",
        firebaseUser ? `${firebaseUser.email} (${firebaseUser.uid})` : "null",
      );

      if (firebaseUser) {
        try {
          console.log("👤 User is authenticated, fetching profile...");
          // Keep loading true while we fetch user profile
          if (!db) {
            throw new Error("Firestore not available");
          }

          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              role: userData.role,
              name: userData.name,
              phone: userData.phone,
              businessName: userData.businessName,
              vehicleInfo: userData.vehicleInfo,
              approvalStatus: userData.approvalStatus,
              rejectionReason: userData.rejectionReason,
              emailVerified: firebaseUser.emailVerified, // Get from Firebase Auth
              createdAt: userData.createdAt?.toDate() || new Date(),
            };

            setUser(userProfile);
            console.log("✅ User profile loaded and state updated");

            // Update email verification status in Firestore if it changed
            const isEmailVerified = firebaseUser.emailVerified;
            if (userData.emailVerified !== isEmailVerified) {
              try {
                await updateDoc(doc(db, "users", firebaseUser.uid), {
                  emailVerified: isEmailVerified,
                });
                console.log(
                  `✅ Email verification status updated to ${isEmailVerified} in Firestore`,
                );

                // Force immediate user state update with complete profile refresh
                const updatedProfile = {
                  ...userProfile,
                  emailVerified: isEmailVerified,
                };
                setUser(updatedProfile);
                setLoading(false); // Force loading to false immediately
                console.log(
                  `✅ User state forcefully updated with emailVerified: ${isEmailVerified}, loading set to false`,
                );
              } catch (error) {
                console.warn(
                  "⚠️ Failed to update email verification status:",
                  error,
                );
              }
            }

            // Register for FCM push notifications
            if (userProfile.role) {
              FCMPushNotificationService.registerForPushNotifications(
                firebaseUser.uid,
                userProfile.role as "vendor" | "driver" | "admin",
              ).catch((error) => {
                console.log("FCM notification registration failed:", error);
              });
            }
          } else {
            console.log("❌ User profile not found in Firestore");
            setUser(null);
          }
        } catch (error) {
          console.error("❌ Error fetching user profile:", error);
          console.error("❌ This may indicate a Firestore connectivity issue");

          // Don't immediately set user to null - give Firebase a chance to restore auth
          if (firebaseUser) {
            console.log(
              "🔄 Retrying user profile fetch in case of temporary connectivity issue",
            );
            setTimeout(async () => {
              try {
                const retryUserDoc = await getDoc(
                  doc(db, "users", firebaseUser.uid),
                );
                if (retryUserDoc.exists()) {
                  const userData = retryUserDoc.data();
                  const userProfile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email!,
                    role: userData.role,
                    name: userData.name,
                    phone: userData.phone,
                    businessName: userData.businessName,
                    vehicleInfo: userData.vehicleInfo,
                    approvalStatus: userData.approvalStatus,
                    rejectionReason: userData.rejectionReason,
                    emailVerified: firebaseUser.emailVerified,
                    createdAt: userData.createdAt?.toDate() || new Date(),
                  };
                  setUser(userProfile);
                  console.log("✅ User profile loaded on retry");
                } else {
                  setUser(null);
                }
              } catch (retryError) {
                console.error("❌ Retry failed:", retryError);
                setUser(null);
              } finally {
                // Make sure loading is set to false after retry
                setLoading(false);
                console.log("⏳ Retry complete, loading set to false");
              }
            }, 2000);
          } else {
            setUser(null);
          }
        }
      } else {
        console.log("👤 No authenticated user found");
        setUser(null);
      }
      // Only set loading to false after we've completely processed the auth state
      console.log(
        "⏳ Auth state processing complete, setting loading to false",
      );
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!auth) {
      throw new Error("Firebase Auth not available");
    }

    try {
      // Check if this is admin login
      if (isAdminEmail(email)) {
        console.log("🛡️ Admin login detected");
      }

      await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ User signed in successfully");
      // Don't set loading to false here - let onAuthStateChanged handle it
      // This prevents the brief flash of onboarding screen
    } catch (error: any) {
      console.error("❌ Sign in error:", error);
      throw new Error(error.message || "Sign in failed");
    }
  };

  const signUp = async (
    email: string,
    password: string,
    role: "vendor" | "driver" | "admin",
    additionalData?: any,
  ): Promise<void> => {
    if (!auth || !db) {
      throw new Error("Firebase services not available");
    }

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Add a small delay to let Firebase Auth fully process
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create user profile in Firestore
      const userProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: role,
        name: additionalData?.name || "User",
        phone: additionalData?.phone || "",
        emailVerified: false, // Initially false, will be updated when user verifies
        ...(role === "vendor" && {
          businessName: additionalData?.businessName || "",
          businessCategory: additionalData?.businessCategory || "",
          businessLocation: additionalData?.businessLocation || "",
          approvalStatus: "pending",
        }),
        ...(role === "driver" && {
          vehicleInfo: additionalData?.vehicleInfo || "",
          approvalStatus: "pending",
        }),
        ...(role === "admin" && {
          adminLevel: additionalData?.adminLevel || "standard",
        }),
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
      console.log("✅ User profile created in Firestore");

      // Send email verification
      try {
        await sendEmailVerification(firebaseUser);
        console.log("✅ Verification email sent");
      } catch (emailError) {
        console.warn("⚠️ Failed to send verification email:", emailError);
        // Don't fail signup if verification email fails
      }

      // Force immediate user profile update to avoid loading state issues
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        role: userProfile.role,
        name: userProfile.name,
        phone: userProfile.phone,
        businessName: (userProfile as any).businessName,
        vehicleInfo: (userProfile as any).vehicleInfo,
        approvalStatus: (userProfile as any).approvalStatus,
        rejectionReason: undefined,
        emailVerified: firebaseUser.emailVerified,
        createdAt: new Date(),
      });
      console.log("✅ User state updated immediately after signup");

      // Send email notification to admin for new signups (excluding admin signups)
      if (role !== "admin") {
        await EmailService.notifyAdminNewSignup({
          name: userProfile.name,
          email: userProfile.email || "",
          role: userProfile.role,
          phone: userProfile.phone,
          businessName: (userProfile as any).businessName,
          vehicleInfo: (userProfile as any).vehicleInfo,
        });
      }

      // Send welcome email to approved drivers
      if (role === "driver") {
        // For drivers, they need approval first, so we'll send the welcome email when approved
        console.log("🚛 Driver signup complete - awaiting admin approval");
      }

      // Don't set loading to false here - let onAuthStateChanged handle it
    } catch (error: any) {
      console.error("❌ Sign up error:", error);

      // If it's "email already in use" but we just created the account,
      // it might be a timing issue - let the auth state handler process it
      if (error.code === "auth/email-already-in-use") {
        console.log(
          "⚠️ Email already in use - may be a timing issue, continuing...",
        );
        return; // Don't throw error, let auth state change handle it
      }

      throw new Error(error.message || "Sign up failed");
    }
  };

  const signOut = async (): Promise<void> => {
    if (!auth) {
      throw new Error("Firebase Auth not available");
    }

    setLoading(true);
    try {
      await firebaseSignOut(auth);
      console.log("✅ User signed out successfully");
    } catch (error: any) {
      console.error("❌ Sign out error:", error);
      throw new Error(error.message || "Sign out failed");
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
