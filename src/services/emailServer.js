const express = require("express");
const cors = require("cors");
const { sendEmail } = require("./backendEmailService");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "Email service is running",
    timestamp: new Date().toISOString(),
  });
});

// Send email endpoint
app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: to, subject, html",
      });
    }

    console.log(`📧 Sending email to: ${to}`);
    console.log(`📋 Subject: ${subject}`);

    const result = await sendEmail(to, subject, html, text);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: "Email sent successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Email API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Bulk email endpoint for notifications
app.post("/send-bulk-email", async (req, res) => {
  try {
    const { emails } = req.body; // Array of email objects

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({
        success: false,
        error: "emails array is required",
      });
    }

    console.log(`📧 Sending ${emails.length} emails`);

    const results = [];
    for (const emailData of emails) {
      const { to, subject, html, text } = emailData;
      const result = await sendEmail(to, subject, html, text);
      results.push({
        to,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    res.json({
      success: true,
      results,
      summary: { successful, failed, total: emails.length },
    });
  } catch (error) {
    console.error("❌ Bulk email API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Email server running on port ${PORT}`);
  console.log(`📧 Gmail SMTP configured for: visech.websites@gmail.com`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
