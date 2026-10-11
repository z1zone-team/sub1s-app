export interface AuthSyncBody {
  nickname?: string;
  profileImageUrl?: string;
}

interface ClerkProfile {
  fullName?: string | null;
  username?: string | null;
  imageUrl?: string | null;
}

const MAX_NICKNAME_LENGTH = 50;

/** 서버가 받는 값(닉네임, 프로필 사진)만 담는다. 다른 값을 보내면 서버가 요청을 거부한다 */
export function buildSyncBody(profile: ClerkProfile): AuthSyncBody {
  const name = profile.fullName?.trim() || profile.username?.trim() || "";
  return {
    ...(name ? { nickname: name.slice(0, MAX_NICKNAME_LENGTH) } : {}),
    ...(profile.imageUrl ? { profileImageUrl: profile.imageUrl } : {}),
  };
}
