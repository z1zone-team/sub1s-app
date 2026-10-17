import { distanceMeters, WALK_ARRIVE_RADIUS_M, walkProgress } from "./walkGuide";

const origin = { lat: 37.4979, lng: 127.0276 };
const destination = { lat: 37.5079, lng: 127.0276 };

describe("distanceMeters", () => {
  it("같은 좌표는 0이다", () => {
    expect(distanceMeters(origin, origin)).toBe(0);
  });

  it("위도 0.01도는 약 1.11km다", () => {
    expect(distanceMeters(origin, destination)).toBeGreaterThan(1100);
    expect(distanceMeters(origin, destination)).toBeLessThan(1120);
  });

  it("방향과 상관없이 같다", () => {
    expect(distanceMeters(origin, destination)).toBeCloseTo(distanceMeters(destination, origin), 6);
  });
});

describe("walkProgress", () => {
  const totalDurationSec = 1200;

  it("위치를 모르면 출발지에서 시작한 것으로 보고 전체 시간이 남는다", () => {
    const progress = walkProgress({ origin, destination, totalDurationSec });

    expect(progress.remainingM).toBeCloseTo(distanceMeters(origin, destination), 3);
    expect(progress.remainingSec).toBe(totalDurationSec);
    expect(progress.arrived).toBe(false);
  });

  it("도착지에 가까워질수록 남은 거리와 시간이 줄어든다", () => {
    const half = { lat: 37.5029, lng: 127.0276 };

    const progress = walkProgress({ origin, destination, me: half, totalDurationSec });

    expect(progress.remainingM).toBeCloseTo(distanceMeters(origin, destination) / 2, -1);
    expect(progress.remainingSec).toBeGreaterThan(550);
    expect(progress.remainingSec).toBeLessThan(650);
  });

  it("도착지 반경(50m) 안이면 도착이다", () => {
    const near = { lat: destination.lat - 0.0003, lng: destination.lng };

    const progress = walkProgress({ origin, destination, me: near, totalDurationSec });

    expect(progress.remainingM).toBeLessThan(WALK_ARRIVE_RADIUS_M);
    expect(progress.arrived).toBe(true);
  });

  it("반경 바로 밖이면 도착이 아니다", () => {
    const far = { lat: destination.lat - 0.0006, lng: destination.lng };

    expect(walkProgress({ origin, destination, me: far, totalDurationSec }).arrived).toBe(false);
  });

  it("도착 반경을 바꿀 수 있다", () => {
    const me = { lat: destination.lat - 0.0006, lng: destination.lng };

    expect(walkProgress({ origin, destination, me, totalDurationSec, arriveRadiusM: 100 }).arrived).toBe(true);
  });

  it("출발지보다 멀어지면 남은 시간이 더 길어진다", () => {
    const behind = { lat: origin.lat - 0.005, lng: origin.lng };

    expect(walkProgress({ origin, destination, me: behind, totalDurationSec }).remainingSec).toBeGreaterThan(totalDurationSec);
  });

  it("소요 시간이 없으면 초당 1.2m로 시간을 계산한다", () => {
    const progress = walkProgress({ origin, destination, totalDurationSec: 0 });

    expect(progress.remainingSec).toBe(Math.round(progress.remainingM / 1.2));
  });

  it("서버가 준 전체 거리가 있으면 남은 거리를 그 기준으로 보여 주고 시작할 때는 전체 거리와 같다", () => {
    const start = walkProgress({ origin, destination, totalDurationSec, totalDistanceKm: 1.4 });
    const half = { lat: 37.5029, lng: 127.0276 };
    const middle = walkProgress({ origin, destination, me: half, totalDurationSec, totalDistanceKm: 1.4 });

    expect(start.remainingM).toBeCloseTo(1400, 3);
    expect(middle.remainingM).toBeGreaterThan(650);
    expect(middle.remainingM).toBeLessThan(750);
  });

  it("도착 판정은 전체 거리와 상관없이 직선 거리로 한다", () => {
    const near = { lat: destination.lat - 0.0003, lng: destination.lng };

    expect(walkProgress({ origin, destination, me: near, totalDurationSec, totalDistanceKm: 5 }).arrived).toBe(true);
  });

  it("출발지와 도착지가 같아도 깨지지 않는다", () => {
    const progress = walkProgress({ origin, destination: origin, me: origin, totalDurationSec });

    expect(progress.remainingM).toBe(0);
    expect(progress.remainingSec).toBe(0);
    expect(progress.arrived).toBe(true);
  });
});
