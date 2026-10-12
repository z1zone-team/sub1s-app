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

// Mock @clerk/expo
jest.mock("@clerk/expo", () => ({
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

// Mock expo-location
jest.mock("expo-location", () => ({
  Accuracy: {
    Balanced: 3,
    High: 4,
    Highest: 5,
  },
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
}));

// Mock expo-audio
jest.mock("expo-audio", () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  useAudioRecorder: jest.fn(() => ({
    currentTime: 2.5,
    isRecording: false,
    uri: "file:///data/voice_query.m4a",
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
  })),
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  })),
}));

// Mock @react-native-community/netinfo
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn((callback) => {
    callback({
      isConnected: true,
      isInternetReachable: true,
      type: "wifi",
    });
    return jest.fn();
  }),
}));

// Mock @react-native-async-storage/async-storage
const mockAsyncStorageStore = new Map();
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key) => Promise.resolve(mockAsyncStorageStore.get(key) ?? null)),
  setItem: jest.fn((key, value) => {
    mockAsyncStorageStore.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    mockAsyncStorageStore.delete(key);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockAsyncStorageStore.clear();
    return Promise.resolve();
  }),
}));

