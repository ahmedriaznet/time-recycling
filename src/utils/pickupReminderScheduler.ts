import { PushNotificationService } from "./pushNotificationService";

export class PickupReminderScheduler {
  private static reminderInterval: NodeJS.Timeout | null = null;

  // Start the daily reminder service
  static startDailyReminders() {
    // Stop any existing interval
    this.stopDailyReminders();

    // Calculate time until next 8 PM
    const now = new Date();
    const next8PM = new Date();
    next8PM.setHours(20, 0, 0, 0); // 8 PM

    // If it's already past 8 PM today, schedule for tomorrow
    if (now > next8PM) {
      next8PM.setDate(next8PM.getDate() + 1);
    }

    const timeUntilNext8PM = next8PM.getTime() - now.getTime();

    console.log(
      `📅 Pickup reminders will start at ${next8PM.toLocaleString()}`,
    );

    // Set timeout for first run
    setTimeout(() => {
      // Send initial reminders
      this.sendDailyReminders();

      // Then set up daily interval (24 hours)
      this.reminderInterval = setInterval(
        () => {
          this.sendDailyReminders();
        },
        24 * 60 * 60 * 1000,
      ); // 24 hours
    }, timeUntilNext8PM);
  }

  // Stop the daily reminder service
  static stopDailyReminders() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
      console.log("📅 Daily pickup reminders stopped");
    }
  }

  // Send reminders for tomorrow's pickups
  static async sendDailyReminders() {
    try {
      console.log("📱 Running daily pickup reminder check...");
      await PushNotificationService.sendDriverPickupReminders();
      console.log("✅ Daily pickup reminders sent");
    } catch (error) {
      console.error("❌ Error sending daily reminders:", error);
    }
  }

  // Manual trigger for testing
  static async triggerRemindersNow() {
    console.log("🧪 Manually triggering pickup reminders...");
    await this.sendDailyReminders();
  }
}

// For development: Trigger reminders immediately for testing
if (__DEV__) {
  // Uncomment this line to test reminders immediately
  // PickupReminderScheduler.triggerRemindersNow();
}
