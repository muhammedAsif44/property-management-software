import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`⚡ Real-time client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`⚡ Real-time client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_property')
  handleJoinProperty(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { propertyId: string },
  ) {
    if (data?.propertyId) {
      const room = `property:${data.propertyId}`;
      client.join(room);
      this.logger.log(`📡 Socket ${client.id} subscribed to live updates for property: ${data.propertyId}`);
      return { status: 'joined', room };
    }
    return { status: 'error', message: 'Missing propertyId' };
  }

  @SubscribeMessage('leave_property')
  handleLeaveProperty(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { propertyId: string },
  ) {
    if (data?.propertyId) {
      const room = `property:${data.propertyId}`;
      client.leave(room);
      this.logger.log(`👋 Socket ${client.id} unsubscribed from property: ${data.propertyId}`);
      return { status: 'left', room };
    }
  }

  /**
   * Broadcast live event to all connected staff in a specific property
   */
  emitToProperty(propertyId: string, event: string, payload: any) {
    const room = `property:${propertyId}`;
    if (this.server) {
      this.server.to(room).emit(event, payload);
      this.logger.log(`🔔 Live event '${event}' emitted to property room '${room}'`);
    }
  }

  /**
   * Broadcast platform-wide event (e.g. Super Admin alerts or backup updates)
   */
  emitGlobal(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
      this.logger.log(`🌐 Live event '${event}' emitted globally`);
    }
  }
}
