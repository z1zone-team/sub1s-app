import { secureStorage, appStorage } from "./storage";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("Storage Adapters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("secureStorage", () => {
    it("should set, get, and remove values via SecureStore", async () => {
      await secureStorage.setItem("jwt_key", "secret_jwt_token");
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("jwt_key", "secret_jwt_token");

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce("secret_jwt_token");
      const val = await secureStorage.getItem("jwt_key");
      expect(val).toBe("secret_jwt_token");

      await secureStorage.removeItem("jwt_key");
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("jwt_key");
    });
  });

  describe("appStorage", () => {
    it("should set, get, and remove values via AsyncStorage", async () => {
      await appStorage.setItem("pref_theme", "dark");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("pref_theme", "dark");

      const val = await appStorage.getItem("pref_theme");
      expect(val).toBe("dark");

      await appStorage.removeItem("pref_theme");
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("pref_theme");
    });
  });
});
