const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

// Initialize Firebase Admin
initializeApp();

/**
 * Cloud Function to delete a user from both Firestore and Firebase Auth
 * Only callable by authenticated admin users
 */
exports.deleteUser = onCall(async (request) => {
  const { uid, email } = request.data;
  const context = request.auth;

  // Verify the caller is authenticated
  if (!context) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }

  try {
    // Get the caller's user record to verify admin status
    const callerRecord = await getAuth().getUser(context.uid);
    const callerDoc = await getFirestore()
      .collection("users")
      .doc(context.uid)
      .get();

    // Verify the caller is an admin
    if (!callerDoc.exists || callerDoc.data().role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only admin users can delete other users.",
      );
    }

    logger.info(`Admin ${callerRecord.email} deleting user ${email} (${uid})`);

    // Delete from Firestore first
    await getFirestore().collection("users").doc(uid).delete();
    logger.info(`Deleted user ${uid} from Firestore`);

    // Delete from Firebase Authentication
    await getAuth().deleteUser(uid);
    logger.info(`Deleted user ${uid} from Firebase Auth`);

    // Return success
    return {
      success: true,
      message: `User ${email} successfully deleted from both Firestore and Authentication`,
      deletedUid: uid,
      deletedEmail: email,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error deleting user:", error);

    // Handle specific errors
    if (error.code === "auth/user-not-found") {
      // User doesn't exist in Auth, just delete from Firestore
      try {
        await getFirestore().collection("users").doc(uid).delete();
        return {
          success: true,
          message: `User ${email} deleted from Firestore (was not in Authentication)`,
          deletedUid: uid,
          deletedEmail: email,
          timestamp: new Date().toISOString(),
        };
      } catch (firestoreError) {
        throw new HttpsError(
          "internal",
          `Failed to delete from Firestore: ${firestoreError.message}`,
        );
      }
    }

    throw new HttpsError("internal", `Failed to delete user: ${error.message}`);
  }
});

/**
 * Cloud Function to get user information (for verification)
 */
exports.getUserInfo = onCall(async (request) => {
  const { uid } = request.data;
  const context = request.auth;

  if (!context) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }

  try {
    // Verify admin status
    const callerDoc = await getFirestore()
      .collection("users")
      .doc(context.uid)
      .get();
    if (!callerDoc.exists || callerDoc.data().role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only admin users can access user information.",
      );
    }

    // Get user from Auth
    const userRecord = await getAuth().getUser(uid);

    // Get user from Firestore
    const userDoc = await getFirestore().collection("users").doc(uid).get();

    return {
      auth: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
      firestore: userDoc.exists ? userDoc.data() : null,
    };
  } catch (error) {
    logger.error("Error getting user info:", error);
    throw new HttpsError(
      "internal",
      `Failed to get user info: ${error.message}`,
    );
  }
});
