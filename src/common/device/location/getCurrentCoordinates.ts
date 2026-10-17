import * as Location from "expo-location";

export interface CurrentCoordinates {
  lat: number;
  lng: number;
}

/** 이 시간 안에 위치가 오지 않으면 위치 없이 진행한다 */
export const CURRENT_POSITION_TIMEOUT_MS = 2000;
/** 마지막으로 알려진 위치를 그대로 써도 되는 나이 */
export const LAST_KNOWN_MAX_AGE_MS = 2 * 60 * 1000;

function toCoordinates(position: Location.LocationObject | null): CurrentCoordinates | null {
  if (!position) return null;
  const { latitude, longitude } = position.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { lat: latitude, lng: longitude };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      }
    );
  });
}

/**
 * 현재 위치를 한 번 읽는다. 권한을 묻지 않고(이미 허용된 경우에만), 마지막 위치가 있으면 그것을 쓰고,
 * 없으면 최대 {@link CURRENT_POSITION_TIMEOUT_MS}만 기다린다. 어떤 이유로든 얻지 못하면 null이라
 * 호출하는 쪽은 위치 없이 진행하면 된다 (음성 요청이 위치 때문에 늦거나 실패하면 안 된다)
 */
export async function getCurrentCoordinates(
  timeoutMs: number = CURRENT_POSITION_TIMEOUT_MS
): Promise<CurrentCoordinates | null> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) return null;

    const lastKnown = toCoordinates(await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }));
    if (lastKnown) return lastKnown;

    const current = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      timeoutMs
    );
    return toCoordinates(current);
  } catch {
    return null;
  }
}
