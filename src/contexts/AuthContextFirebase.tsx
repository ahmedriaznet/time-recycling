import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

interface UserProfile {
  uid: string;
  email: string;
  role: "vendor" | "driver";
  name: string;
  phone?: string;
  businessName?: string; // for vendors
  vehicleInfo?: string; // for drivers
  createdAt: Date;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    role: "vendor" | "driver",
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Keep loading true while we fetch user profile
          if (!db) {
            throw new Error("Firestore not available");
          }

          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              role: userData.role,
              name: userData.name,
              phone: userData.phone,
              businessName: userData.businessName,
              vehicleInfo: userData.vehicleInfo,
              createdAt: userData.createdAt?.toDate() || new Date(),
            });
          } else {
            console.log("❌ User profile not found in Firestore");
            setUser(null);
          }
        } catch (error) {
          console.error("❌ Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      // Only set loading to false after we've completely processed the auth state
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
    role: "vendor" | "driver",
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

      // Create user profile in Firestore
      const userProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: role,
        name: additionalData?.name || "User",
        phone: additionalData?.phone || "",
        ...(role === "vendor" && {
          businessName: additionalData?.businessName || "",
          businessCategory: additionalData?.businessCategory || "",
          businessLocation: additionalData?.businessLocation || "",
        }),
        ...(role === "driver" && {
          vehicleInfo: additionalData?.vehicleInfo || "",
        }),
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
      console.log("✅ User profile created in Firestore");
      // Don't set loading to false here - let onAuthStateChanged handle it
    } catch (error: any) {
      console.error("❌ Sign up error:", error);
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
