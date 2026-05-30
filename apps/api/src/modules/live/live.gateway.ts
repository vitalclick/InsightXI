import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Logger, OnModuleDestroy } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { LiveService, LiveSnapshot } from "./live.service";

const TICK_MS = 3000;

/**
 * Broadcasts simulated live match updates over Socket.IO.
 * Clients receive "live:update" snapshots; on connect they get the current
 * state immediately via the "subscribe" message.
 */
@WebSocketGateway({ cors: { origin: true } })
export class LiveGateway implements OnGatewayInit, OnModuleDestroy {
  private readonly logger = new Logger(LiveGateway.name);
  private timer?: NodeJS.Timeout;

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly live: LiveService) {}

  afterInit(): void {
    this.timer = setInterval(() => {
      const snapshot = this.live.tick();
      this.server.emit("live:update", snapshot);
    }, TICK_MS);
    this.logger.log("Live match simulator started");
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  @SubscribeMessage("subscribe")
  onSubscribe(client: Socket): LiveSnapshot {
    const snapshot = this.live.snapshot();
    client.emit("live:update", snapshot);
    return snapshot;
  }
}
