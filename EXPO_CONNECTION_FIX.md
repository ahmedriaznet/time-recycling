# 🔧 Expo "Could not connect to the server" - Fix Guide

## 🎯 Problem

Expo Go shows "Unknown Error: Could not connect to the server" - this is a **network connectivity issue**.

## ✅ Metro Bundler Status: WORKING

- ✅ Server running on port 8081
- ✅ iOS bundle completed successfully (683 modules)
- ✅ App code is ready to serve

## 🔍 Troubleshooting Steps (Try in Order)

### 1. **Check Network Connection** ⭐ MOST COMMON

- **Ensure phone and computer are on the SAME WiFi network**
- Turn off mobile data on your phone
- Both devices must be on the same network (not guest network)

### 2. **Try Different Connection Methods**

#### Method A: Use Tunnel Mode (Recommended)

```bash
# Stop current server and restart with tunnel
expo start --tunnel
```

This routes through Expo servers and bypasses network issues.

#### Method B: Use LAN Mode

```bash
# Restart with LAN mode
expo start --lan
```

#### Method C: Use Development Build URL

- Look for the URL in terminal (should show `exp://192.168.x.x:8081`)
- Copy this URL manually into Expo Go

### 3. **Check Firewall/Security**

- **macOS**: System Preferences > Security & Privacy > Firewall
  - Allow "Node.js" or "Metro Bundler" through firewall
- **Windows**: Windows Defender > Allow app through firewall
- **Router**: Some routers block device-to-device communication

### 4. **Expo Go App Issues**

- **Force close** Expo Go app completely
- **Reopen** Expo Go and try again
- **Clear Expo Go cache** (Settings > Clear Cache in Expo Go)
- **Update Expo Go** to latest version in App Store

### 5. **Alternative: Use Development Build**

```bash
# Install Expo CLI globally if needed
npm install -g @expo/cli

# Create development build
expo install expo-dev-client
expo run:ios --device
```

## 🚀 Immediate Fix to Try

**STEP 1**: Stop the current server
**STEP 2**: Restart with tunnel mode:

```bash
expo start --tunnel
```

**STEP 3**: Wait for QR code
**STEP 4**: Scan with Expo Go

## 📱 Expected Result

- QR code appears in terminal
- Scan with Expo Go
- Should see "Time Recycling Service Test" app load
- Blue background with success message

## 🆘 If Still Not Working

### Check These:

1. **Phone Settings**: Ensure WiFi is connected (not mobile data)
2. **Computer Network**: Check if computer can access internet
3. **VPN**: Disable VPN on computer or phone
4. **Corporate Network**: Some corporate/school networks block this
5. **Router Settings**: Check if device isolation is enabled

### Alternative Testing:

- Try with a different phone
- Use a mobile hotspot from your phone for computer
- Test on same network with a friend's device

## 🎯 Most Likely Solution

**Use tunnel mode**: `expo start --tunnel` - this bypasses most network issues! 🚀

The app is ready and working - it's just a network connectivity issue to resolve.
