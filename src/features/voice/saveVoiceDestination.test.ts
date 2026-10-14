import type { VoiceRouteRecommendResponseDto } from "@/apis/mutations/voice/voiceRouteTypes";
import { getPlaces } from "@/apis/queries/users/places";
import { saveVoiceDestination } from "./saveVoiceDestination";

jest.mock("@/apis/queries/users/places", () => ({ getPlaces: jest.fn() }));

const result = (name: string, segments: unknown[] = []): VoiceRouteRecommendResponseDto => ({
  interpretedIntent: { destStationName: name },
  recommendedRoute: { segments },
} as VoiceRouteRecommendResponseDto);

beforeEach(() => jest.resetAllMocks());

it("records a station as soon as a voice result is available", async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  await saveVoiceDestination(result("강남", [{ lineId: "02", fromStationId: "02_221", fromStationName: "역삼", toStationId: "02_222", toStationName: "강남" }]), save);
  expect(save).toHaveBeenCalledWith({ name: "강남", stationId: "02_222" });
  expect(getPlaces).not.toHaveBeenCalled();
});

it.each([["집", "HOME"], ["학교", "SCHOOL"]])("records the saved %s coordinates even for a walking-only route", async (name, kind) => {
  jest.mocked(getPlaces).mockResolvedValue([{ kind: kind as "HOME" | "SCHOOL", name: "저장한 장소", stationId: null, lat: 37.5, lng: 127 }]);
  const save = jest.fn().mockResolvedValue(undefined);
  await saveVoiceDestination(result(name), save);
  expect(save).toHaveBeenCalledWith({ name: "저장한 장소", lat: 37.5, lng: 127 });
});

it("does not record a nearby station when the saved place lookup fails", async () => {
  jest.mocked(getPlaces).mockRejectedValue(new Error("network"));
  const save = jest.fn().mockResolvedValue(undefined);
  await expect(saveVoiceDestination(result("집"), save)).resolves.toBeUndefined();
  expect(save).not.toHaveBeenCalled();
});
