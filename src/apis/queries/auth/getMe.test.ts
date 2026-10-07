import { getMe } from "./getMe";
import * as client from "@/apis/client";

jest.mock("@/apis/client", () => {
  const actual = jest.requireActual("@/apis/client");
  return {
    ...actual,
    get: jest.fn(),
  };
});

describe("getMe query function", () => {
  it("should call get with /auth/me and return user data", async () => {
    const mockUser = {
      id: "user-1",
      clerkId: "clerk_123",
      email: "test@sub1s.com",
      nickname: "지하철마스터",
      totalDistanceMeters: 15400,
      currentStreakDays: 5,
      rankScore: 1250,
      createdAt: "2026-10-01T00:00:00Z",
    };

    (client.get as jest.Mock).mockResolvedValue(mockUser);

    const result = await getMe();
    expect(client.get).toHaveBeenCalledWith("/auth/me");
    expect(result).toEqual(mockUser);
  });
});
