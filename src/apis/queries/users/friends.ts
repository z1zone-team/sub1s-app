import { del, get, post, type RequestOptions } from "@/apis/client";

export interface Friend {
  userId: string;
  nickname: string;
  profileImageUrl: string | null;
  /** 친구가 된 시각 (KST ISO) */
  friendedAt: string;
}

export interface FriendList {
  totalCount: number;
  /** 최근에 친구가 된 순서 */
  friends: Friend[];
}

export interface InviteToken {
  inviteToken: string;
}

/** GET /api/v1/friends */
export const getFriends = (options?: RequestOptions): Promise<FriendList> =>
  get<FriendList>("/friends", undefined, options);

/** GET /api/v1/friends/invite. 없으면 서버가 만들고 이후에는 같은 값 */
export const getInviteToken = (options?: RequestOptions): Promise<InviteToken> =>
  get<InviteToken>("/friends/invite", undefined, options);

/** POST /api/v1/friends/invite/reset. 이전 링크는 무효가 된다 */
export const resetInviteToken = (): Promise<InviteToken> =>
  post<InviteToken>("/friends/invite/reset", {});

/** POST /api/v1/friends/accept. 바로 서로 친구가 되고 초대한 사람의 프로필을 돌려준다 */
export const acceptInvite = (inviteToken: string): Promise<Friend> =>
  post<Friend>("/friends/accept", { inviteToken });

/** DELETE /api/v1/friends/:friendId. 양쪽에서 모두 사라진다 */
export const removeFriend = (friendId: string): Promise<{ friendId: string }> =>
  del<{ friendId: string }>(`/friends/${friendId}`);
