# ♻️ Time Recycling Service - Modern Bottle Pickup Service App

A premium React Native application for managing recycling pickup services between vendors (bars/restaurants) and drivers. Built with Expo, Firebase, and modern UI/UX design principles.

## ✨ Features

### 🎨 **Modern UI/UX**

- **Glassmorphism & Neumorphism** design elements
- **Smooth animations** with React Native Reanimated
- **Dark/Light theme** support
- **Haptic feedback** for better user experience
- **Beautiful onboarding** with gradient backgrounds

### 👨‍🍳 **Vendor Features**

- Dashboard with upcoming pickups in card layout
- Schedule pickup form with date/time picker
- Pickup history with status tracking
- Profile & settings management
- Real-time pickup status updates

### 🚚 **Driver Features**

- Dashboard with assigned pickups (list/map view)
- Pickup detail screens with vendor information
- Photo upload for pickup completion
- Navigation integration for routes
- Pickup history with status filters

### 🔐 **Authentication & Backend**

- Firebase Authentication (email/password)
- Custom user roles (Vendor/Driver)
- Firestore database for data storage
- Cloud messaging for push notifications

## ���� **Tech Stack**

### **Core**

- React Native + Expo SDK 53
- TypeScript for type safety
- React Navigation for routing

### **Styling & Animation**

- NativeWind (Tailwind CSS for React Native)
- React Native Reanimated for animations
- Expo Linear Gradient for backgrounds
- Expo Haptics for tactile feedback

### **Backend**

- Firebase Authentication
- Cloud Firestore database
- Firebase Cloud Messaging (FCM)
- Firebase Storage for image uploads

### **Additional Libraries**

- Expo Image Picker for photo uploads
- React Native Gesture Handler
- React Native Safe Area Context
- React Native Screens

## 📱 **App Structure**

```
src/
├── components/
│   └── ui/                 # Reusable UI components
│       ├── Button.tsx      # Animated button with haptics
│       ├── Card.tsx        # Glassmorphism cards
│       ├── Input.tsx       # Animated form inputs
│       ├── Modal.tsx       # Slide-up modals
│       └── StatusBadge.tsx # Colored status indicators
│
├── contexts/
│   ├── AuthContext.tsx     # Firebase auth & user management
│   └── ThemeContext.tsx    # Dark/light theme switching
│
├── screens/
│   ├── auth/               # Authentication screens
│   │   ├── LoginScreen.tsx
│   │   └── SignupScreen.tsx
│   ├── vendor/             # Vendor-specific screens
│   │   ├── VendorDashboard.tsx
│   │   └── SchedulePickupScreen.tsx
│   ├── driver/             # Driver-specific screens
│   │   ├── DriverDashboard.tsx
│   │   └── CompletePickupScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── RoleSelectionScreen.tsx
│   └── ProfileScreen.tsx
│
├── navigation/
│   └── AppNavigator.tsx    # Navigation configuration
│
├── config/
│   └── firebase.ts        # Firebase configuration
│
└── utils/
    └── sampleData.ts      # Sample data for development
```

## 🚀 **Getting Started**

### **Prerequisites**

- Node.js 18+
- Expo CLI
- Expo Go app on your phone
- Firebase project (optional for full functionality)

### **Installation**

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Start the development server:**

```bash
npm start
```

3. **Open in Expo Go:**
   - Scan the QR code with Expo Go app
   - The app will load on your device

### **Firebase Setup (Optional)**

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)

2. Enable Authentication, Firestore, and Storage

3. Update `src/config/firebase.ts` with your Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};
```

## 📱 **Current Demo Features**

The app currently includes:

### ✅ **Working Features**

- Beautiful onboarding experience with animations
- Role selection (Vendor/Driver)
- Modern UI components with glassmorphism effects
- Dark/light theme switching
- Sample data for development
- Responsive design for different screen sizes

### 🚧 **In Development**

- Firebase authentication integration
- Real-time data synchronization
- Push notifications
- Map integration for drivers
- Photo upload functionality
- Payment processing

## 🎨 **Design System**

### **Colors**

- Primary: Blue (#3b82f6)
- Success: Green (#22c55e)
- Warning: Orange (#f59e0b)
- Danger: Red (#ef4444)

### **Typography**

- System fonts for optimal performance
- Clear hierarchy with proper sizing
- Accessibility-friendly contrast ratios

### **Components**

- Consistent spacing and padding
- Rounded corners for modern feel
- Subtle shadows and glassmorphism effects
- Smooth animations and transitions

## ���� **Screenshots**

The app features:

- Gradient onboarding screens with animations
- Role selection with beautiful cards
- Dashboard with pickup cards and statistics
- Modern form inputs with validation
- Status badges with color coding
- Glassmorphism cards with backdrop blur

## 🔄 **Development Workflow**

1. **Test on Device:** Use Expo Go for instant updates
2. **Hot Reloading:** Changes appear instantly on save
3. **TypeScript:** Full type safety and IntelliSense
4. **Component-Driven:** Reusable UI components
5. **Sample Data:** Realistic data for development

## 🚀 **Next Steps**

1. **Complete Firebase Integration**

   - User authentication
   - Real-time database operations
   - Push notifications

2. **Add Advanced Features**

   - Map integration with routes
   - Photo upload to Firebase Storage
   - Payment processing
   - Chat/messaging system

3. **Polish & Performance**
   - Error handling and loading states
   - Performance optimization
   - Accessibility improvements
   - Testing & quality assurance

## 📝 **License**

This project is built for demonstration purposes. Feel free to use as inspiration for your own projects.

---

**Built with ❤️ using React Native, Expo, and modern mobile app development practices.**
