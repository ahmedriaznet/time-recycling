import AsyncStorage from "@react-native-async-storage/async-storage";
import EmailJSService from "./emailJSService";

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Send email using cloud service that works with Expo
  private async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      console.log("📧 Sending real email:", {
        to: template.to,
        subject: template.subject,
        timestamp: new Date().toISOString(),
      });

      // Use a webhook service that can send emails
      // This uses Webhook.site as a relay (replace with your actual webhook)
      const webhookUrl = "https://webhook.site/unique-id"; // You'd replace this with a real email webhook

      const emailData = {
        gmail_user: "visech.websites@gmail.com",
        gmail_password: "zuxt zzli zyim rvyp",
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text || template.subject,
        timestamp: new Date().toISOString(),
      };

      // Send REAL email using EmailJS with Gmail
      const emailSent = await EmailJSService.sendEmail({
        to: template.to,
        subject: template.subject,
        html: template.html,
      });

      if (emailSent) {
        console.log("✅ REAL EMAIL SENT successfully:", {
          to: template.to,
          subject: template.subject,
          service: "Gmail SMTP via visech.websites@gmail.com",
        });

        // Store email in log for tracking
        const emailLog = {
          id: Date.now().toString(),
          ...template,
          sentAt: new Date().toISOString(),
          status: "sent",
          method: "gmail_smtp_real",
        };

        const existingEmails = await AsyncStorage.getItem("email_log");
        const emails = existingEmails ? JSON.parse(existingEmails) : [];
        emails.push(emailLog);
        await AsyncStorage.setItem("email_log", JSON.stringify(emails));

        return true;
      } else {
        console.log("❌ Failed to send real email");
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }
  }

  // 1. New pickup scheduled - notify drivers
  async notifyDriverNewPickup(
    driverEmail: string,
    pickupDetails: {
      pickupId: string;
      vendorName: string;
      address: string;
      bottleCount: number;
      scheduledDate: string;
      notes?: string;
    },
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: driverEmail,
      subject: `🚛 New Pickup Available - ${pickupDetails.vendorName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Pickup Available</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🚛 New Pickup Available</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A vendor has scheduled a pickup in your area</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px; background: #f8fafc;">
              <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0;">Pickup Details</h2>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Vendor:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${pickupDetails.vendorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Location:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${pickupDetails.address}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Bottles:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${pickupDetails.bottleCount} bottles</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Scheduled:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${new Date(
                      pickupDetails.scheduledDate,
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</td>
                  </tr>
                </table>

                ${
                  pickupDetails.notes
                    ? `
                  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <strong style="color: #374151;">Special Notes:</strong><br>
                    <span style="color: #1f2937;">${pickupDetails.notes}</span>
                  </div>
                `
                    : ""
                }

                <div style="text-align: center; margin-top: 25px;">
                  <p style="color: #6b7280; margin-bottom: 15px;">Open the EcoBottle Driver app to accept this pickup</p>
                  <div style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Pickup ID: #${pickupDetails.pickupId}
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 20px; background: #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">EcoBottle Driver - Sustainable Bottle Collection Service</p>
              <p style="margin: 5px 0 0 0;">📧 Automated notification from Gmail: visech.websites@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return this.sendEmail(template);
  }

  // 2. Pickup accepted - notify vendor
  async notifyVendorPickupAccepted(
    vendorEmail: string,
    pickupDetails: {
      pickupId: string;
      driverName: string;
      driverPhone?: string;
      scheduledDate: string;
      address: string;
      bottleCount: number;
    },
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: vendorEmail,
      subject: `✅ Pickup Confirmed - Driver Assigned (#${pickupDetails.pickupId})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Pickup Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">✅ Pickup Confirmed</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A driver has been assigned to your pickup</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px; background: #f8fafc;">
              <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0;">Driver Information</h2>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Driver:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${pickupDetails.driverName}</td>
                  </tr>
                  ${
                    pickupDetails.driverPhone
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Phone:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${pickupDetails.driverPhone}</td>
                  </tr>
                  `
                      : ""
                  }
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Pickup Date:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${new Date(
                      pickupDetails.scheduledDate,
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</td>
                  </tr>
                </table>

                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #166534; margin-top: 0;">Pickup Summary</h3>
                  <table style="width: 100%;">
                    <tr>
                      <td style="color: #374151; font-weight: bold;">Location:</td>
                      <td style="color: #1f2937;">${pickupDetails.address}</td>
                    </tr>
                    <tr>
                      <td style="color: #374151; font-weight: bold;">Bottles:</td>
                      <td style="color: #1f2937;">${pickupDetails.bottleCount} bottles</td>
                    </tr>
                    <tr>
                      <td style="color: #374151; font-weight: bold;">Pickup ID:</td>
                      <td style="color: #1f2937;">#${pickupDetails.pickupId}</td>
                    </tr>
                  </table>
                </div>

                <div style="background: #eff6ff; padding: 15px; border-radius: 8px;">
                  <h4 style="color: #1e40af; margin-top: 0;">What's Next?</h4>
                  <ul style="color: #374151; margin: 0; padding-left: 20px;">
                    <li>The driver will arrive at the scheduled time</li>
                    <li>Have your bottles ready for collection</li>
                    <li>You'll receive a confirmation once pickup is complete</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 20px; background: #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">EcoBottle Vendor - Sustainable Bottle Collection Service</p>
              <p style="margin: 5px 0 0 0;">📧 Automated notification from Gmail: visech.websites@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return this.sendEmail(template);
  }

  // 3. New signup awaiting approval - notify admin
  async notifyAdminNewSignup(userDetails: {
    name: string;
    email: string;
    role: string;
    phone?: string;
    businessName?: string;
    vehicleInfo?: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: "visech.websites@gmail.com", // Your admin email
      subject: `⚠️ New ${userDetails.role.toUpperCase()} Registration - Approval Required`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Registration</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">⚠️ New Registration</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A new ${userDetails.role} is awaiting approval</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px; background: #f8fafc;">
              <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0;">User Details</h2>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Name:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${userDetails.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${userDetails.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Role:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${userDetails.role.charAt(0).toUpperCase() + userDetails.role.slice(1)}</td>
                  </tr>
                  ${
                    userDetails.phone
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Phone:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${userDetails.phone}</td>
                  </tr>
                  `
                      : ""
                  }
                  ${
                    userDetails.businessName
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Business:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${userDetails.businessName}</td>
                  </tr>
                  `
                      : ""
                  }
                </table>

                ${
                  userDetails.vehicleInfo
                    ? `
                  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <strong style="color: #374151;">Vehicle Information:</strong><br>
                    <span style="color: #1f2937;">${userDetails.vehicleInfo}</span>
                  </div>
                `
                    : ""
                }

                <div style="text-align: center; margin-top: 25px;">
                  <p style="color: #6b7280; margin-bottom: 15px;">Review and approve this registration in the admin panel</p>
                  <div style="background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Action Required: Admin Approval
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 20px; background: #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">EcoBottle Admin - User Management System</p>
              <p style="margin: 5px 0 0 0;">📧 Automated notification from Gmail: visech.websites@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return this.sendEmail(template);
  }

  // Pickup completed - notify vendor
  async notifyVendorPickupCompleted(
    vendorEmail: string,
    pickupDetails: {
      pickupId: string;
      driverName: string;
      completedAt: string;
      bottleCount: number;
      proofImages?: string[];
    },
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: vendorEmail,
      subject: `🎉 Pickup Completed - #${pickupDetails.pickupId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Pickup Completed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Pickup Completed</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your bottles have been successfully collected</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px; background: #f8fafc;">
              <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0;">Completion Details</h2>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Driver:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${pickupDetails.driverName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Bottles Collected:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${pickupDetails.bottleCount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Completed:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${new Date(
                      pickupDetails.completedAt,
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Pickup ID:</td>
                    <td style="padding: 8px 0; color: #1f2937;">#${pickupDetails.pickupId}</td>
                  </tr>
                </table>

                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p style="color: #166534; margin: 0; font-weight: bold;">✅ Thank you for using EcoBottle! Your contribution helps create a more sustainable future.</p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 20px; background: #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">EcoBottle Vendor - Pickup Completion Notification</p>
              <p style="margin: 5px 0 0 0;">📧 Automated notification from Gmail: visech.websites@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return this.sendEmail(template);
  }

  // Pickup cancelled - notify vendor
  async notifyVendorPickupCancelled(
    vendorEmail: string,
    pickupDetails: {
      pickupId: string;
      driverName: string;
      reason: string;
      reschedulable: boolean;
    },
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: vendorEmail,
      subject: `❌ Pickup Cancelled - #${pickupDetails.pickupId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Pickup Cancelled</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">❌ Pickup Cancelled</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your scheduled pickup has been cancelled</p>
            </div>

            <div style="padding: 30px; background: #f8fafc;">
              <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0;">Cancellation Details</h2>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Driver:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${pickupDetails.driverName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Reason:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${pickupDetails.reason}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Pickup ID:</td>
                    <td style="padding: 8px 0; color: #1f2937;">#${pickupDetails.pickupId}</td>
                  </tr>
                </table>

                ${
                  pickupDetails.reschedulable
                    ? `
                  <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="color: #1e40af; margin: 0;">💡 You can reschedule this pickup or it will automatically be made available to other drivers.</p>
                  </div>
                `
                    : `
                  <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="color: #dc2626; margin: 0;">⚠️ This pickup has been made available to other drivers in your area.</p>
                  </div>
                `
                }
              </div>
            </div>

            <div style="padding: 20px; background: #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">EcoBottle Vendor - Pickup Cancellation Notice</p>
              <p style="margin: 5px 0 0 0;">📧 Automated notification from Gmail: visech.websites@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return this.sendEmail(template);
  }

  // Driver approved - notify driver
  async notifyDriverApproved(
    driverEmail: string,
    driverName: string,
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: driverEmail,
      subject: `🎉 Welcome to EcoBottle - Account Approved!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Account Approved</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to EcoBottle!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your driver account has been approved</p>
            </div>

            <div style="padding: 30px; background: #f8fafc;">
              <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${driverName}!</h2>

                <p style="color: #374151; margin-bottom: 20px;">
                  Congratulations! Your EcoBottle driver account has been approved and you can now start accepting pickup requests.
                </p>

                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #166534; margin-top: 0;">Getting Started:</h3>
                  <ul style="color: #374151; margin: 0; padding-left: 20px;">
                    <li>Update your availability status in the app</li>
                    <li>Complete your vehicle information</li>
                    <li>Browse available pickups in your area</li>
                    <li>Start earning while helping the environment!</li>
                  </ul>
                </div>

                <div style="text-align: center;">
                  <p style="color: #6b7280; margin-bottom: 15px;">Ready to make a difference?</p>
                  <div style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Open EcoBottle Driver App
                  </div>
                </div>
              </div>
            </div>

            <div style="padding: 20px; background: #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">EcoBottle Driver - Account Approval Notification</p>
              <p style="margin: 5px 0 0 0;">📧 Automated notification from Gmail: visech.websites@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return this.sendEmail(template);
  }

  // Utility methods
  async getEmailLog(): Promise<any[]> {
    try {
      const emailLog = await AsyncStorage.getItem("email_log");
      return emailLog ? JSON.parse(emailLog) : [];
    } catch (error) {
      console.error("Error getting email log:", error);
      return [];
    }
  }

  async clearEmailLog(): Promise<void> {
    try {
      await AsyncStorage.removeItem("email_log");
      console.log("Email log cleared");
    } catch (error) {
      console.error("Error clearing email log:", error);
    }
  }
}

export default EmailService.getInstance();
