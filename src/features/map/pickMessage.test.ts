import { ApiError } from "@/apis/client";
import { pickErrorMessage } from "./pickMessage";

describe("pickErrorMessage", () => {
  it("가까운 역이 없는 위치는 다른 곳을 고르라고 안내한다", () => {
    const error = new ApiError("PLACE_OUT_OF_SERVICE_AREA", "no station", 422);
    expect(pickErrorMessage(error)).toBe("이 근처에는 지하철역이 없어요. 다른 곳을 골라 주세요.");
  });

  it("요청 한도를 넘으면 잠시 뒤에 다시 하라고 안내한다", () => {
    const error = new ApiError("TOO_MANY_REQUESTS", "slow down", 429);
    expect(pickErrorMessage(error)).toBe("요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.");
  });

  it("그 밖의 오류는 다시 시도하라고 안내한다", () => {
    expect(pickErrorMessage(new ApiError("INTERNAL", "boom", 500))).toBe("주소를 불러오지 못했어요. 다시 시도해 주세요.");
    expect(pickErrorMessage(new Error("network"))).toBe("주소를 불러오지 못했어요. 다시 시도해 주세요.");
  });
});
