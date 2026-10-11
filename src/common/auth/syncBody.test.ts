import { buildSyncBody } from "./syncBody";

describe("buildSyncBody", () => {
  it("이름과 프로필 사진만 담는다", () => {
    expect(buildSyncBody({ fullName: "홍길동", imageUrl: "https://img/x.png" })).toEqual({
      nickname: "홍길동",
      profileImageUrl: "https://img/x.png",
    });
  });

  it("이름이 없으면 사용자명을 쓴다", () => {
    expect(buildSyncBody({ fullName: " ", username: "rider" })).toEqual({ nickname: "rider" });
  });

  it("이름이 모두 없으면 닉네임을 보내지 않는다", () => {
    expect(buildSyncBody({ fullName: null, username: null, imageUrl: null })).toEqual({});
  });

  it("닉네임은 50자까지만 보낸다", () => {
    expect(buildSyncBody({ fullName: "가".repeat(60) }).nickname).toHaveLength(50);
  });
});
