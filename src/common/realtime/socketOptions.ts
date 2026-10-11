import type { ManagerOptions, SocketOptions } from "socket.io-client";

/**
 * 소켓 연결 옵션. 서버의 엔진 경로는 기본값(/socket.io/)이고 /ws/subway는 네임스페이스라서
 * 접속 주소에 네임스페이스를 넣고 path는 주지 않는다. path를 /ws/subway로 주면 연결되지 않는다.
 * 로그인하지 않았으면 auth를 보내지 않아 공개 소켓으로 연결한다(유효하지 않은 토큰은 서버가 거부한다)
 */
export function buildSocketOptions(token: string | null): Partial<ManagerOptions & SocketOptions> {
  return {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    ...(token ? { auth: { token } } : {}),
  };
}
