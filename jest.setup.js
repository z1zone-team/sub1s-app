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
