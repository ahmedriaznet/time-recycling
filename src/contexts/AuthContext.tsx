import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { createSampleData } from "../utils/firebaseSetup";

interface UserProfile {
  uid: string;
  email: string;
  role: "vendor" | "driver";
  name: string;
  phone?: string;
  businessName?: string; // for vendors
  vehicleInfo?: string; // for drivers
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    role: "vendor" | "driver",
    additionalData: any,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a small delay to ensure Firebase Auth is fully initialized
    const timer = setTimeout(() => {
      if (!auth) {
        console.error("Firebase Auth not initialized");
        setLoading(false);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);

        if (user) {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } else {
          setUserProfile(null);
        }

        setLoading(false);
      });

      return unsubscribe;
    }, 100); // Small delay to ensure auth is ready

    return () => clearTimeout(timer);
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    role: "vendor" | "driver",
    additionalData: any,
  ) => {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role,
        createdAt: new Date().toISOString(),
        ...additionalData,
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
      setUserProfile(userProfile);

      // Create sample data for new users to showcase the app
      await createSampleData(user.uid, role);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
