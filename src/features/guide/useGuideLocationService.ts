import { useEffect } from "react";
import { startGuideLocationService, stopGuideLocationService } from "@/common/device/location/guideLocationTask";
import { useActiveGuideStore } from "./active-guide-store";

/**
 * 안내 중인 이동이 있는 동안 안드로이드 포그라운드 서비스로 위치를 받고, 안내가 끝나면 끈다.
 * 안내 화면에서 홈으로 나가도 안내가 이어지는 동안은 켜져 있다
 */
export function useGuideLocationService(): void {
  const active = useActiveGuideStore((state) => state.guide !== null);

  useEffect(() => {
    if (!active) return;
    void startGuideLocationService();
    return () => {
      void stopGuideLocationService();
    };
  }, [active]);
}
