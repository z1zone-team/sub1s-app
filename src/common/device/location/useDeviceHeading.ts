import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { DeviceMotion } from "expo-sensors";
import { addDeclination, declinationOf, headingFromRotation, pickHeading, shouldUpdateHeading } from "./heading";

/** 기기 회전 센서를 읽는 간격(ms). 화면 프레임에 가깝게 읽어 부채꼴이 끊기지 않게 한다 */
const MOTION_INTERVAL_MS = 16;

/** 지도 페이지로 보내는 최소 간격(ms). 브리지로 너무 자주 보내지 않는다 */
const MIN_SEND_INTERVAL_MS = 16;

/**
 * 폰이 바라보는 방향(북쪽 0도, 시계 방향)이 바뀔 때마다 onChange로 바로 알린다. 화면 상태를 거치지 않아 다시 그리는 비용이 없다.
 * 주로 기기 회전 센서(DeviceMotion, 초당 수십 번)를 쓰고, 이 값은 자북 기준이라 위치 기반 방향(expo-location)에서
 * 진북과의 차이를 한 번 읽어 보정한다. 회전 센서가 없으면 위치 기반 방향(초당 10번쯤)을 그대로 쓴다.
 * 위치 권한이 없거나 센서를 못 읽으면 알리지 않는다. enabled가 false면 센서를 켜지 않고 마지막에 null을 알린다
 */
export function useDeviceHeading(enabled: boolean, onChange: (heading: number | null) => void): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) {
      onChangeRef.current(null);
      return;
    }
    let cancelled = false;
    let headingSub: Location.LocationSubscription | null = null;
    let motionSub: { remove: () => void } | null = null;
    let declination: number | null = null;
    let motionWorks = false;
    let last: number | null = null;
    let lastSentAt = 0;

    const emit = (next: number): void => {
      const now = Date.now();
      if (now - lastSentAt < MIN_SEND_INTERVAL_MS || !shouldUpdateHeading(last, next)) return;
      last = next;
      lastSentAt = now;
      onChangeRef.current(next);
    };

    void (async () => {
      try {
        const { granted } = await Location.getForegroundPermissionsAsync();
        if (!granted || cancelled) return;

        const motionAvailable = await DeviceMotion.isAvailableAsync().catch(() => false);
        if (cancelled) return;
        if (motionAvailable) {
          DeviceMotion.setUpdateInterval(MOTION_INTERVAL_MS);
          motionSub = DeviceMotion.addListener((event) => {
            if (!event.rotation) return;
            const magnetic = headingFromRotation(event.rotation);
            if (magnetic === null) return;
            motionWorks = true;
            emit(addDeclination(magnetic, declination ?? 0));
          });
        }

        // 위치 기반 방향: 회전 센서가 있으면 진북과의 차이를 한 번 읽고 끝내고, 없으면 그대로 방향으로 쓴다
        headingSub = await Location.watchHeadingAsync((value) => {
          const found = declinationOf(value);
          if (found !== null) declination = found;
          if (motionWorks) {
            if (declination !== null) {
              headingSub?.remove();
              headingSub = null;
            }
            return;
          }
          const next = pickHeading(value);
          if (next !== null) emit(next);
        });
        if (cancelled) headingSub.remove();
      } catch {
        // 센서를 읽지 못하면 방향 표시만 없고 지도는 그대로 보인다
      }
    })();

    return () => {
      cancelled = true;
      headingSub?.remove();
      motionSub?.remove();
    };
  }, [enabled]);
}
