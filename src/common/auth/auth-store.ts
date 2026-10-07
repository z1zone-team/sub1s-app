import { create } from "zustand";

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  nickname: string;
  profileImageUrl?: string | null;
  totalDistanceMeters: number;
  currentStreakDays: number;
  rankScore: number;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoaded: boolean;
  isAuthenticated: boolean;
  isMockMode: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setLoaded: (loaded: boolean) => void;
  enableMockMode: (user?: AuthUser) => void;
  disableMockMode: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoaded: false,
  isAuthenticated: false,
  isMockMode: false,

  setAuth: (user, token) =>
    set({
      user,
      token,
      isLoaded: true,
      isAuthenticated: true,
    }),

  clearAuth: () =>
    set({
      user: null,
      token: null,
      isLoaded: true,
      isAuthenticated: false,
    }),

  setLoaded: (loaded) =>
    set({
      isLoaded: loaded,
    }),

  enableMockMode: (mockUser) => {
    const defaultUser: AuthUser = {
      id: "mock-user-001",
      clerkId: "clerk_mock_001",
      email: "tester@sub1s.com",
      nickname: "테스트유저",
      totalDistanceMeters: 10000,
      currentStreakDays: 3,
      rankScore: 1000,
    };

    set({
      user: mockUser ?? defaultUser,
      token: "mock-jwt-token-dev",
      isLoaded: true,
      isAuthenticated: true,
      isMockMode: true,
    });
  },

  disableMockMode: () =>
    set({
      isMockMode: false,
      user: null,
      token: null,
      isAuthenticated: false,
    }),
}));
