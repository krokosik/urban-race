import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppService } from './app.service';
import QRCode from 'qrcode';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway {
  @WebSocketServer()
  server: Server;

  private readonly gameRoom = 'game';

  constructor(private readonly appService: AppService) {}

  @SubscribeMessage('init')
  async init(
    socket: Socket,
    data: { slots: number; maxScore: number },
  ): Promise<WsResponse<{ sessionId: string; qrCodeBase64: string }>> {
    const sessionId = this.appService.init(data?.slots, data?.maxScore);
    this.appService.availableSpirits$.subscribe((spirits) => {
      this.server.to(sessionId).emit('availableSpirits', spirits);
    });

    console.log('init', { sessionId });
    socket.join(this.gameRoom);

    const qrCodeBase64 = await QRCode.toDataURL(
      `${process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://urban-race.nvlv-studio.com'}/?sessionId=${sessionId}`,
    );

    return { event: 'init', data: { sessionId, qrCodeBase64 } };
  }

  @SubscribeMessage('join')
  join(socket: Socket, data: { sessionId: string }): WsResponse<{}> {
    const game = this.appService.joinSession(data.sessionId);
    socket.join(game.sessionId);

    socket.emit('allSpirits', this.appService.spirits);
    socket.emit('availableSpirits', this.appService.availableSpirits$.value);

    return {
      event: 'join',
      data: game,
    };
  }

  @SubscribeMessage('selectSpirit')
  selectSpirit(
    client: Socket,
    data: { sessionId: string; spirit: string },
  ): WsResponse<string> {
    this.appService.selectSpirit(data.sessionId, client.id, data.spirit);

    this.server
      .to(data.sessionId)
      .to(this.gameRoom)
      .emit('players', this.appService.game.players);

    if (this.appService.game.started) {
      this.server.to(data.sessionId).to(this.gameRoom).emit('start');
    }

    return { event: 'selectSpirit', data: 'OK' };
  }

  @SubscribeMessage('reset')
  reset(client: Socket) {
    this.appService.reset();
    client.leave(this.gameRoom);
    console.log('reset');
  }
}
