import { ApiError } from "@/apis/client";
import { acceptErrorMessage, inviteLink, inviteMessage, isInviteToken } from "./invite";

describe("inviteLink", () => {
  it("토큰으로 초대 링크를 만든다", () => {
    expect(inviteLink("abcDEF1234567890")).toBe("https://sub1s.devnoco.com/invite/abcDEF1234567890");
  });

  it("공유 문구에 링크를 담는다", () => {
    expect(inviteMessage("https://x/y")).toContain("https://x/y");
  });
});

describe("isInviteToken", () => {
  it("16자 영문, 숫자, -, _ 만 허용한다", () => {
    expect(isInviteToken("abcDEF12345678_-")).toBe(true);
    expect(isInviteToken("short")).toBe(false);
    expect(isInviteToken("abcDEF12345678!!")).toBe(false);
  });
});

describe("acceptErrorMessage", () => {
  it("내 링크, 없는 링크, 형식 오류를 구분한다", () => {
    expect(acceptErrorMessage(new ApiError("SELF_INVITE", "x", 400))).toContain("내 초대 링크");
    expect(acceptErrorMessage(new ApiError("INVITE_NOT_FOUND", "x", 404))).toContain("만료");
    expect(acceptErrorMessage(new ApiError("INVALID_REQUEST_PAYLOAD", "x", 400))).toContain("올바르지");
  });

  it("그 밖의 오류는 일반 문구다", () => {
    expect(acceptErrorMessage(new Error("boom"))).toContain("실패");
  });
});
