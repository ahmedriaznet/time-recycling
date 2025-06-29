// EmailJS service configured with your Gmail account
interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

class EmailJSService {
  private static instance: EmailJSService;

  // EmailJS configuration for your Gmail account
  private readonly config = {
    publicKey: "Zw1n8TRnl_YJ-Fqwp", // Your EmailJS public key
    serviceId: "service_visech", // Gmail service ID
    templateId: "template_ecobottle", // Template ID
  };

  public static getInstance(): EmailJSService {
    if (!EmailJSService.instance) {
      EmailJSService.instance = new EmailJSService();
    }
    return EmailJSService.instance;
  }

  async sendEmail(emailRequest: EmailRequest): Promise<boolean> {
    console.log("📧 Sending email via EmailJS with Gmail:", {
      to: emailRequest.to,
      subject: emailRequest.subject,
      from: "visech.websites@gmail.com",
      service: "Gmail SMTP",
      timestamp: new Date().toISOString(),
    });

    try {
      // Send email using EmailJS API
      const response = await fetch(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_id: this.config.serviceId,
            template_id: this.config.templateId,
            user_id: this.config.publicKey,
            template_params: {
              // Template variables that EmailJS will use
              to_email: emailRequest.to,
              to_name: emailRequest.to.split("@")[0], // Extract name from email
              from_name: "EcoBottle Service",
              from_email: "visech.websites@gmail.com",
              subject: emailRequest.subject,
              message: this.htmlToText(emailRequest.html), // Plain text version
              html_message: emailRequest.html, // HTML version
              reply_to: "visech.websites@gmail.com",
            },
          }),
        },
      );

      const responseText = await response.text();
      console.log("EmailJS Response:", response.status, responseText);

      if (response.ok && responseText === "OK") {
        console.log("✅ Email sent successfully via EmailJS!");
        console.log("📧 Gmail SMTP used: visech.websites@gmail.com");
        return true;
      } else {
        console.log("❌ EmailJS failed:", response.status, responseText);
        return await this.fallbackEmailMethod(emailRequest);
      }
    } catch (error) {
      console.error("❌ EmailJS error:", error);
      return await this.fallbackEmailMethod(emailRequest);
    }
  }

  // Convert HTML to plain text for email clients that don't support HTML
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, "")
      .replace(/<script[^>]*>.*?<\/script>/gs, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Fallback method using Web3Forms
  private async fallbackEmailMethod(
    emailRequest: EmailRequest,
  ): Promise<boolean> {
    try {
      console.log("📧 Using fallback email method...");

      const fallbackResponse = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_key: "8b8f7c6d-5e4f-3a2b-1c9d-8e7f6a5b4c3d", // Web3Forms access key
          from_name: "EcoBottle Service",
          from_email: "visech.websites@gmail.com",
          to: emailRequest.to,
          subject: emailRequest.subject,
          message: `
${this.htmlToText(emailRequest.html)}

---
This email was sent from EcoBottle App
Gmail: visech.websites@gmail.com
Time: ${new Date().toLocaleString()}
          `,
          html: emailRequest.html,
        }),
      });

      if (fallbackResponse.ok) {
        const result = await fallbackResponse.json();
        if (result.success) {
          console.log("✅ Email sent via fallback method!");
          return true;
        }
      }
    } catch (error) {
      console.log("Fallback method failed:", error);
    }

    console.log("❌ All email methods failed");
    return false;
  }

  // Method to test the email configuration
  async testEmailSetup(): Promise<boolean> {
    const testEmail = {
      to: "visech.websites@gmail.com", // Send test to your own email
      subject: "🧪 EmailJS Test - EcoBottle App",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
            <h2>🧪 EmailJS Test Successful!</h2>
          </div>
          <div style="padding: 20px; background: #f8fafc;">
            <h3>Configuration Test:</h3>
            <p><strong>✅ Gmail SMTP:</strong> Working</p>
            <p><strong>✅ Service:</strong> EmailJS</p>
            <p><strong>✅ Account:</strong> visech.websites@gmail.com</p>
            <p><strong>✅ Time:</strong> ${new Date().toLocaleString()}</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <h4>✅ Email System Ready!</h4>
              <p>The EcoBottle app can now send real emails for:</p>
              <ul>
                <li>Pickup notifications to drivers</li>
                <li>Confirmation emails to vendors</li>
                <li>Admin notifications</li>
                <li>Monthly reports</li>
              </ul>
            </div>
          </div>
        </div>
      `,
    };

    return await this.sendEmail(testEmail);
  }
}

export default EmailJSService.getInstance();
