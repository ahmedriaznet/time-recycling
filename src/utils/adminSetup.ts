import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, serverTimestamp } from "../config/firebase";

const ADMIN_EMAIL = "admin@time-recycling.com";
const ADMIN_PASSWORD = "Pass1234#";

export const createAdminAccount = async (): Promise<boolean> => {
  if (!auth || !db) {
    console.log("❌ Firebase services not available");
    return false;
  }

  try {
    console.log("🔧 Checking if admin account exists...");

    // Check if admin user already exists in Firestore
    const adminDoc = await getDoc(doc(db, "adminUsers", "admin"));
    if (adminDoc.exists()) {
      console.log("✅ Admin account already exists");
      return true;
    }

    console.log("🔧 Creating admin account...");

    // Create admin user in Firebase Auth
    let adminUser;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      );
      adminUser = userCredential.user;
      console.log("✅ Admin user created in Firebase Auth");
    } catch (authError: any) {
      if (authError.code === "auth/email-already-in-use") {
        console.log("ℹ️ Admin email already exists in Firebase Auth");
        // Continue to create the profile document
      } else {
        throw authError;
      }
    }

    // Create admin profile in Firestore (in users collection)
    const adminProfile = {
      uid: adminUser?.uid || "admin_hardcoded", // Fallback ID if auth creation failed
      email: ADMIN_EMAIL,
      role: "admin",
      name: "System Administrator",
      phone: "+1 555-ADMIN",
      adminLevel: "super",
      createdAt: serverTimestamp(),
      isHardcoded: true, // Flag to identify this as the hardcoded admin
    };

    // Store in both users collection and adminUsers collection for tracking
    if (adminUser?.uid) {
      await setDoc(doc(db, "users", adminUser.uid), adminProfile);
    }
    await setDoc(doc(db, "adminUsers", "admin"), adminProfile);

    console.log("✅ Admin profile created in Firestore");
    return true;
  } catch (error) {
    console.error("❌ Error creating admin account:", error);
    return false;
  }
};

export const getAdminCredentials = () => {
  return {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  };
};

export const isAdminEmail = (email: string): boolean => {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

// Function to ensure admin exists (call this on app startup)
export const ensureAdminExists = async (): Promise<void> => {
  try {
    const created = await createAdminAccount();
    if (created) {
      console.log("🛡️ Admin account ready");
    }
  } catch (error) {
    console.error("❌ Failed to ensure admin exists:", error);
  }
};
