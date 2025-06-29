const nodemailer = require("nodemailer");

// Gmail SMTP configuration
const emailConfig = {
  service: "gmail",
  auth: {
    user: "visech.websites@gmail.com",
    pass: "zuxt zzli zyim rvyp", // App password
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Email service error:", error);
  } else {
    console.log("✅ Email service ready");
  }
});

// Email sending function
async function sendEmail(to, subject, html, text = "") {
  try {
    const mailOptions = {
      from: {
        name: "EcoBottle Service",
        address: "visech.websites@gmail.com",
      },
      to: to,
      subject: subject,
      html: html,
      text: text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };
