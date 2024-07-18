import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AppService, spirits } from './app.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway implements OnGatewayConnection {
  constructor(private readonly appService: AppService) {}

  handleConnection(client: Socket, ...args: any[]): void {
    this.appService.availableSpirits$.subscribe((sprites) => {
      client.emit('availableSpirits', sprites);
    });
  }

  @SubscribeMessage('init')
  init(
    @MessageBody() data: { slots: number; maxScore: number },
  ): WsResponse<string> {
    const sessionId = this.appService.init(data?.slots, data?.maxScore);
    console.log('init', sessionId);
    return { event: 'init', data: sessionId };
  }

  @SubscribeMessage('join')
  join(@MessageBody() data: { sessionId: string }): WsResponse<{}> {
    const game = this.appService.joinSession(data.sessionId);
    return {
      event: 'join',
      data: {
        sessionId: game.sessionId,
        slots: game.slots,
        maxScore: game.maxScore,
        allSpirits: spirits,
      },
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
