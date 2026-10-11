import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { post } from "@/apis/client";
import { buildSyncBody } from "./syncBody";

/** 로그인하면 서버 사용자와 동기화한다. 같은 사용자는 한 번만 보낸다 */
export function useAuthSync(): void {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const client = useQueryClient();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !user || syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;

    post("/auth/sync", buildSyncBody(user))
      .then(() => client.invalidateQueries())
      .catch(() => {
        syncedUserId.current = null;
      });
  }, [isSignedIn, user, client]);
}
