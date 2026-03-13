import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/pos',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationsGateway');

  afterInit() {
    this.logger.log('🔌 WebSocket Gateway initialized on /pos namespace');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Server → Client Emitters ────────────────────────────

  /**
   * Broadcast a new order to all connected clients (Kitchen, Admin Dashboard).
   */
  emitNewOrder(order: any) {
    this.server.emit('order:created', order);
    this.logger.log(`📦 Emitted order:created → ${order.ticketNumber}`);
  }

  /**
   * Broadcast an order status change (e.g., RECEIVED → PREPARING → READY).
   */
  emitOrderStatusUpdate(orderId: string, status: string, order?: any) {
    const payload: any = { orderId, status };
    if (order?.updatedAt) payload.updatedAt = order.updatedAt;
    if (order?.deliveredAt) payload.deliveredAt = order.deliveredAt;
    const room = `order:${orderId}`;

    // Tracking clients (and any listeners that joined the room)
    this.server.to(room).emit('order:statusUpdated', payload);

    // Staff screens that didn't join the room
    this.server.except(room).emit('order:statusUpdated', payload);

    this.logger.log(`🔄 Emitted order:statusUpdated → ${orderId} → ${status}`);
  }

  /**
   * Broadcast when an order is cancelled or deleted.
   */
  emitOrderCancelled(orderId: string) {
    this.server.emit('order:cancelled', { orderId });
    this.logger.log(`❌ Emitted order:cancelled → ${orderId}`);
  }

  // ─── Client → Server Listeners ───────────────────────────

  /**
   * Kitchen client can update order status via WebSocket.
   */
  @SubscribeMessage('order:updateStatus')
  handleOrderStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; status: string },
  ) {
    this.logger.log(
      `📥 Received order:updateStatus from ${client.id} → ${data.orderId}: ${data.status}`,
    );
    // Intentionally NOT persisting status changes via WS (security).
    // Kitchen should call PATCH /orders/:id/status with JWT so the change is stored.
    return { event: 'order:updateStatus', data: { success: false } };
  }

  /**
   * Client can join a specific order room for targeted updates (e.g., tracking page).
   */
  @SubscribeMessage('order:join')
  handleJoinOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    client.join(`order:${data.orderId}`);
    this.logger.log(`🚪 Client ${client.id} joined room order:${data.orderId}`);
    return { event: 'order:join', data: { joined: true } };
  }
}
