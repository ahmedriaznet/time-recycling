const { sendEmail } = require("./src/services/backendEmailService");

async function testEmail() {
  console.log("🧪 Testing email service...");

  const result = await sendEmail(
    "visech.websites@gmail.com", // Send to yourself for testing
    "🧪 EcoBottle Email Test",
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🧪 Email Test</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">EcoBottle email service is working!</p>
      </div>
      <div style="padding: 30px; background: #f8fafc;">
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Test Results</h2>
          <p>✅ Gmail SMTP connection successful</p>
          <p>✅ Email templates working</p>
          <p>✅ Ready to send real notifications!</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
    `,
    "EcoBottle email service test - Success!",
  );

  if (result.success) {
    console.log("✅ Test email sent successfully!");
    console.log("📧 Check your email at visech.websites@gmail.com");
  } else {
    console.log("❌ Test email failed:", result.error);
  }
}

testEmail();
