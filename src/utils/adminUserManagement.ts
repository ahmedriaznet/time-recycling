/**
 * Admin User Management Utilities
 *
 * Note: Firebase Authentication user deletion requires server-side admin privileges.
 * This file provides utilities and workarounds for user management.
 */

export interface DeleteUserResult {
  firestoreDeleted: boolean;
  authDeleted: boolean;
  message: string;
  requiresManualCleanup: boolean;
  email?: string;
}

/**
 * Delete user from Firestore and Firebase Auth using Cloud Function
 */
export const deleteUserCompletely = async (
  userId: string,
  userEmail: string,
): Promise<DeleteUserResult> => {
  const result: DeleteUserResult = {
    firestoreDeleted: false,
    authDeleted: false,
    message: "",
    requiresManualCleanup: false,
    email: userEmail,
  };

  try {
    // Import Firebase Functions
    const { getFunctions, httpsCallable } = await import("firebase/functions");
    const { auth } = await import("../config/firebase");

    // Get current user (admin)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Admin must be authenticated to delete users");
    }

    // Initialize functions
    const functions = getFunctions();
    const deleteUser = httpsCallable(functions, "deleteUser");

    console.log(`🔄 Deleting user ${userEmail} via Cloud Function...`);

    // Call the Cloud Function
    const response = await deleteUser({
      uid: userId,
      email: userEmail,
    });

    const responseData = response.data as any;

    if (responseData.success) {
      result.firestoreDeleted = true;
      result.authDeleted = true;
      result.requiresManualCleanup = false;
      result.message = responseData.message;

      console.log(
        `✅ User ${userEmail} successfully deleted from both Firestore and Auth`,
      );
      console.log(`📝 Deletion timestamp: ${responseData.timestamp}`);

      return result;
    } else {
      throw new Error(responseData.message || "Unknown error occurred");
    }
  } catch (error) {
    console.error("Cloud Function deletion failed:", error);

    // Fallback to manual process
    try {
      const { deleteDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");

      // At least delete from Firestore
      await deleteDoc(doc(db, "users", userId));
      result.firestoreDeleted = true;
      result.authDeleted = false;
      result.requiresManualCleanup = true;
      result.message = `Firestore deletion successful. Auth deletion failed: ${error.message}. Manual cleanup required.`;

      console.log(
        `⚠️ FALLBACK: Deleted from Firestore only. Manual Firebase Auth cleanup needed.`,
      );

      return result;
    } catch (fallbackError) {
      result.message = `Complete deletion failed: ${error.message}`;
      return result;
    }
  }
};

/**
 * Instructions for manual Firebase Auth cleanup
 */
export const getManualCleanupInstructions = (email: string): string => {
  return `
🛠️ MANUAL CLEANUP REQUIRED:

To allow ${email} to sign up again:

1. Open Firebase Console (console.firebase.google.com)
2. Go to Authentication → Users
3. Search for: ${email}
4. Click the user and select "Delete"
5. Confirm deletion

This removes the email from Firebase Auth and allows re-registration.

⚠️ Alternative: Ask the user to use "Forgot Password" to reset their account instead of re-registering.
  `;
};

/**
 * Check if an email is available for registration
 */
export const checkEmailAvailability = async (
  email: string,
): Promise<boolean> => {
  try {
    // This would need to be implemented with admin privileges
    // For now, we can only suggest manual checking
    console.log(
      `🔍 To check if ${email} is available, check Firebase Auth Console`,
    );
    return false; // Assume not available without admin check
  } catch (error) {
    return false;
  }
};
