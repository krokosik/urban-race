import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppService } from './app.service';

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
  init(
    socket: Socket,
    data: { slots: number; maxScore: number },
  ): WsResponse<string> {
    const sessionId = this.appService.init(data?.slots, data?.maxScore);
    this.appService.availableSpirits$.subscribe((spirits) => {
      this.server.to(sessionId).emit('availableSpirits', spirits);
    });
    socket.join(this.gameRoom);

    return { event: 'init', data: sessionId };
  }

  @SubscribeMessage('join')
  join(socket: Socket, data: { sessionId: string }): WsResponse<{}> {
    const game = this.appService.joinSession(data.sessionId);
    socket.join(game.sessionId);
    return {
      event: 'join',
      data: game,
    };
  }

  @SubscribeMessage('selectSpirit')
  selectSpirit(
    @MessageBody() data: { sessionId: string; spirit: string },
  ): WsResponse<string> {
    this.appService.selectSpirit(data.sessionId, data.spirit);
    return { event: 'selectSpirit', data: 'OK' };
  }

  @SubscribeMessage('reset')
  reset() {
    this.appService.reset();
  }
}
