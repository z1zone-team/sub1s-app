// Mock react-native components and APIs
jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  TouchableOpacity: "TouchableOpacity",
  StyleSheet: {
    create: (styles) => styles,
  },
  Platform: {
    OS: "android",
    select: (obj) => obj.android || obj.default,
  },
  AppState: {
    currentState: "active",
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      appEnv: "local",
      apiBaseUrl: "http://localhost:3000",
      wsUrl: "http://localhost:3000/ws/subway",
      clerkPublishableKey: "pk_test_mock_key",
      clientKey: "test-client-key",
    },
  },
}));

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock @clerk/clerk-expo
jest.mock("@clerk/clerk-expo", () => ({
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "user_test_123",
    getToken: jest.fn().mockResolvedValue("mock_jwt_token"),
    signOut: jest.fn().mockResolvedValue(undefined),
  })),
  ClerkProvider: ({ children }) => children,
}));

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5,
  },
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: "timeInterval",
  },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue({}),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-1234"),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "ExponentPushToken[mock-token-123]" }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
  notificationAsync: jest.fn().mockResolvedValue(undefined),
}));
