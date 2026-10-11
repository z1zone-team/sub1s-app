import { io, Socket } from "socket.io-client";
import { AppState, AppStateStatus } from "react-native";
import { ENV } from "../../constants/env";
import { useRealtimeStore } from "./realtime-store";
import { buildSocketOptions } from "./socketOptions";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  JoinTrainPayload,
  LeaveTrainPayload,
  ReportLocationPayload,
} from "./types";

export type SubwaySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type TokenGetter = () => Promise<string | null>;
let socketTokenGetter: TokenGetter | null = null;

export function setSocketTokenGetter(getter: TokenGetter | null): void {
  socketTokenGetter = getter;
}

class SubwaySocketClient {
  private socket: SubwaySocket | null = null;
  private appStateSubscription: { remove: () => void } | null = null;
  private shouldBeConnected = false;

  constructor() {
    this.setupAppStateListener();
  }

  private setupAppStateListener(): void {
    if (this.appStateSubscription) return;

    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active" && this.shouldBeConnected) {
          if (!this.socket?.connected) {
            void this.connect();
          }
        }
      }
    );
  }

  public async getSocket(): Promise<SubwaySocket> {
    if (!this.socket) {
      await this.initSocket();
    }
    return this.socket!;
  }

  public async connect(): Promise<SubwaySocket> {
    this.shouldBeConnected = true;

    if (!this.socket) {
      await this.initSocket();
    } else if (!this.socket.connected) {
      // 갱신된 토큰 적용 후 연결
      const token = socketTokenGetter ? await socketTokenGetter() : null;
      if (token) {
        this.socket.auth = { token };
      }
      this.socket.connect();
    }

    return this.socket!;
  }

  public disconnect(): void {
    this.shouldBeConnected = false;
    if (this.socket) {
      this.socket.disconnect();
      useRealtimeStore.getState().actions.setConnected(false);
    }
  }

  private async initSocket(): Promise<void> {
    const token = socketTokenGetter ? await socketTokenGetter() : null;

    const socketUrl = ENV.WS_URL;

    this.socket = io(socketUrl, buildSocketOptions(token)) as SubwaySocket;

    this.bindSocketEvents();
  }

  private bindSocketEvents(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      useRealtimeStore.getState().actions.setConnected(true);
    });

    this.socket.on("disconnect", () => {
      useRealtimeStore.getState().actions.setConnected(false);
    });

    this.socket.on("connect_error", (error) => {
      console.warn("[SubwaySocketClient] Connection error:", error.message);
      useRealtimeStore.getState().actions.setConnected(false);
    });
  }

  public joinTrain(payload: JoinTrainPayload): void {
    if (this.socket?.connected) {
      this.socket.emit("join_train", payload);
      useRealtimeStore.getState().actions.setCurrentTrain(payload);
    }
  }

  public leaveTrain(payload: LeaveTrainPayload): void {
    if (this.socket?.connected) {
      this.socket.emit("leave_train", payload);
      const current = useRealtimeStore.getState().currentTrain;
      if (
        current &&
        current.lineId === payload.lineId &&
        current.trainId === payload.trainId
      ) {
        useRealtimeStore.getState().actions.setCurrentTrain(null);
      }
    }
  }

  public reportLocation(payload: ReportLocationPayload): void {
    if (this.socket?.connected) {
      this.socket.emit("report_location", payload);
    }
  }

  public destroy(): void {
    this.disconnect();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.socket = null;
  }
}

export const subwaySocketClient = new SubwaySocketClient();
