import { buildVoiceFormData, type VoiceRouteRecommendRequest } from "./voiceRouteTypes";

const audio = { uri: "file:///voice.m4a", name: "voice_query.m4a", type: "audio/m4a" };

/** 요청 본문의 필드를 이름과 문자열 값으로 돌려준다 (파일 필드는 값을 보지 않는다) */
function fieldsOf(params: VoiceRouteRecommendRequest): Record<string, string> {
  const formData = buildVoiceFormData(params);
  return Object.fromEntries([...formData.keys()].map((name) => [name, String(formData.get(name))]));
}

describe("buildVoiceFormData", () => {
  it("기기에서 받아 적은 문장만 보낼 때는 파일 없이 transcriptHint만 보낸다", () => {
    expect(fieldsOf({ transcriptHint: " 강남역 가자 " })).toEqual({ transcriptHint: "강남역 가자" });
  });

  it("빈 문장은 보내지 않는다", () => {
    expect(Object.keys(fieldsOf({ audio, transcriptHint: "  " }))).toEqual(["file"]);
  });

  it("위치가 없으면 lat, lng를 보내지 않는다", () => {
    expect(Object.keys(fieldsOf({ audio }))).toEqual(["file"]);
  });

  it("lat과 lng가 둘 다 있으면 문자열로 보낸다", () => {
    expect(fieldsOf({ audio, lat: 37.5665, lng: 126.978 })).toMatchObject({ lat: "37.5665", lng: "126.978" });
  });

  it("둘 중 하나만 있으면 둘 다 보내지 않는다", () => {
    expect(Object.keys(fieldsOf({ audio, lat: 37.5 }))).toEqual(["file"]);
    expect(Object.keys(fieldsOf({ audio, lng: 126.9 }))).toEqual(["file"]);
  });

  it("숫자가 아닌 값은 보내지 않는다", () => {
    expect(Object.keys(fieldsOf({ audio, lat: Number.NaN, lng: 126.9 }))).toEqual(["file"]);
  });

  it("경로 종류와 위치를 함께 보낸다", () => {
    expect(fieldsOf({ audio, preferredMode: "COMFORTABLE", lat: 37.5, lng: 126.9 })).toMatchObject({
      preferredMode: "COMFORTABLE",
      lat: "37.5",
      lng: "126.9",
    });
  });
});
