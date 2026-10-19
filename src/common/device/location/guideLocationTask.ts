import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { create } from "zustand";
import { toLocationCoords, type LocationCoords } from "./useForegroundLocation";

export const GUIDE_LOCATION_TASK = "sub1s-guide-location";

/** 포그라운드 서비스가 보내는 위치의 간격. 걷는 동안 배터리를 아끼려고 길게 잡는다 */
export const GUIDE_LOCATION_INTERVAL_MS = 15_000;
export const GUIDE_LOCATION_DISTANCE_M = 25;

interface GuideLocationState {
  /** 백그라운드 작업이 마지막으로 받은 위치 */
  latest: LocationCoords | null;
  set: (coords: LocationCoords) => void;
  clear: () => void;
}

export const useGuideLocationStore = create<GuideLocationState>((set) => ({
  latest: null,
  set: (latest) => set({ latest }),
  clear: () => set({ latest: null }),
}));

/** 두 위치 중 더 최근 것. 하나만 있으면 그것, 둘 다 없으면 null */
export function newerCoords(a: LocationCoords | null, b: LocationCoords | null): LocationCoords | null {
  if (!a) return b;
  if (!b) return a;
  return b.timestamp > a.timestamp ? b : a;
}

// 앱 프로세스가 살아 있는 동안 포그라운드 서비스가 위치를 이 작업으로 보낸다. 모듈이 불릴 때 정의해야 한다
TaskManager.defineTask(GUIDE_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations ?? [];
  const last = locations[locations.length - 1];
  if (last) useGuideLocationStore.getState().set(toLocationCoords(last));
});

/**
 * 안내 중 앱이 백그라운드로 가도 위치가 계속 오게 안드로이드 포그라운드 서비스를 시작한다(상단에 "안내 중" 알림이 보인다).
 * 앱이 화면에 있을 때 시작해야 하고, 위치 권한이 없거나 시작하지 못하면 false를 돌려주며 앱 안에서만 위치를 받는다
 */
export async function startGuideLocationService(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(GUIDE_LOCATION_TASK)) return true;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) return false;
    await Location.startLocationUpdatesAsync(GUIDE_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: GUIDE_LOCATION_INTERVAL_MS,
      distanceInterval: GUIDE_LOCATION_DISTANCE_M,
      foregroundService: {
        notificationTitle: "Sub1S 안내 중",
        notificationBody: "이동 안내를 위해 위치를 확인하고 있어요",
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function stopGuideLocationService(): Promise<void> {
  useGuideLocationStore.getState().clear();
  try {
    if (await Location.hasStartedLocationUpdatesAsync(GUIDE_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(GUIDE_LOCATION_TASK);
    }
  } catch {
    // 이미 멈춘 서비스를 다시 멈추려 한 경우 등은 무시한다
  }
}
