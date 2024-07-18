import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AppService } from './app.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway implements OnGatewayConnection {
  constructor(private readonly appService: AppService) {}

  handleConnection(client: Socket, ...args: any[]): void {
    this.appService.availableSprites$.subscribe((sprites) => {
      client.emit('availableSprites', sprites);
    });
  }

  @SubscribeMessage('init')
  init(@MessageBody() data: { slots: number; maxScore: number }): string {
    return this.appService.init(data.slots, data.maxScore);
  }

  @SubscribeMessage('join')
  join(@MessageBody() data: { sessionId: string; sprite: string }): string {
    try {
      this.appService.join(data.sessionId, data.sprite);
      return 'OK';
    } catch (error) {
      return error.message;
    }
  }
}
