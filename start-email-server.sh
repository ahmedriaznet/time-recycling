#!/bin/bash

echo "🚀 Starting EcoBottle Email Server..."
echo "📧 Gmail SMTP: visech.websites@gmail.com"
echo "🔑 Using app password: zuxt****"
echo ""

# Start the email server
node src/services/emailServer.js
