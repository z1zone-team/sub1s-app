import {
  formatDurationMinutes,
  formatRemainingSec,
  formatIsoToKoreanTime,
} from "./time";
import { getErrorMessage } from "./error-handler";
import { ApiError } from "../../apis/client";

describe("Common Utilities", () => {
  describe("time utils", () => {
    it("should format duration in minutes properly", () => {
      expect(formatDurationMinutes(75)).toBe("1시간 15분");
      expect(formatDurationMinutes(60)).toBe("1시간");
      expect(formatDurationMinutes(25)).toBe("25분");
      expect(formatDurationMinutes(0)).toBe("0분");
    });

    it("should format remaining seconds properly", () => {
      expect(formatRemainingSec(150)).toBe("2분 30초");
      expect(formatRemainingSec(60)).toBe("1분");
      expect(formatRemainingSec(45)).toBe("45초");
      expect(formatRemainingSec(0)).toBe("곧 도착");
      expect(formatRemainingSec(-5)).toBe("곧 도착");
    });

    it("should format ISO string to Korean time", () => {
      const formatted = formatIsoToKoreanTime("2026-10-07T05:30:00Z");
      // 05:30 UTC is 14:30 KST (오후 2:30)
      expect(formatted).toContain("2:30");
    });
  });

  describe("error handler utils", () => {
    it("should translate ApiError codes to user friendly messages", () => {
      const err401 = new ApiError("UNAUTHORIZED", "Unauthorized", 401);
      expect(getErrorMessage(err401)).toBe(
        "로그인이 필요하거나 세션이 만료되었습니다."
      );

      const err429 = new ApiError("TOO_MANY_REQUESTS", "Rate limited", 429);
      expect(getErrorMessage(err429)).toBe(
        "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
      );

      const standardErr = new Error("Custom error message");
      expect(getErrorMessage(standardErr)).toBe("Custom error message");

      expect(getErrorMessage("String error")).toBe("String error");
      expect(getErrorMessage(null)).toBe("알 수 없는 오류가 발생했습니다.");
    });
  });
});
