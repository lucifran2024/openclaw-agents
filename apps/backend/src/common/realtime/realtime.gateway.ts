import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../observability/metrics.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.secret'),
      });

      (client as any).user = payload;

      // Join tenant room
      await client.join(`tenant:${payload.tid}`);
      // Join personal room
      await client.join(`agent:${payload.sub}`);
      // Join team rooms
      if (payload.teams) {
        for (const teamId of payload.teams) {
          await client.join(`tenant:${payload.tid}:team:${teamId}`);
        }
      }

      this.logger.log(`Client connected: ${payload.sub} (tenant: ${payload.tid})`);
      this.metricsService.setActiveWebsockets(this.server.engine.clientsCount);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    if (user) {
      this.logger.log(`Client disconnected: ${user.sub}`);
    }
    this.metricsService.setActiveWebsockets(this.server.engine.clientsCount);
  }

  emitToTenant(tenantId: string, event: string, data: unknown) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: unknown) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`agent:${userId}`).emit(event, data);
  }

  emitToBoard(boardId: string, event: string, data: unknown) {
    this.server.to(`kanban:${boardId}`).emit(event, data);
  }
}
