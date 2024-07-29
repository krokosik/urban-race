import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { toDataURL } from 'qrcode';
import { Server, Socket } from 'socket.io';
import { AppService } from './app.service';
import { interval, Subscription } from 'rxjs';
import { Logger } from 'nestjs-pino';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  allowEIO3: true,
})
export class AppGateway {
  @WebSocketServer()
  server: Server;

  private readonly gameRoom = 'game';
  private playersSubscription: Subscription;

  constructor(
    private readonly appService: AppService,
    private readonly LOG: Logger,
  ) {}

  @SubscribeMessage('init')
  async init(
    socket: Socket,
    data: { slots: number; maxScore: number },
  ): Promise<WsResponse<{ sessionId: string; qrCodeBase64: string }>> {
    try {
      this.LOG.log(
        `Init game with ${data.slots} slots and max score ${data.maxScore}`,
      );
      const sessionId = this.appService.init(data?.slots, data?.maxScore);
      this.appService.players$.subscribe((players) => {
        this.server.to(sessionId).to(this.gameRoom).emit('players', players);
      });

      socket.join(this.gameRoom);

      const qrCodeBase64 = await toDataURL(
        `${process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://urban-race.nvlv-studio.com'}/?sessionId=${sessionId}`,
      );

      this.LOG.log(`Session ID: ${sessionId}`);

      return { event: 'init', data: { sessionId, qrCodeBase64 } };
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('join')
  join(socket: Socket, data: { sessionId: string }): WsResponse<{}> {
    try {
      this.LOG.log(`Someone joined session ${data.sessionId}`);
      const game = this.appService.joinSession(data.sessionId);
      if (game.started) {
        socket.emit('error', { message: 'Game already started.' });
      }
      socket.join(game.sessionId);

      socket.emit('allSpirits', this.appService.spirits);
      socket.emit('players', this.appService.players$.value);

      return {
        event: 'join',
        data: game,
      };
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('selectSpirit')
  selectSpirit(
    client: Socket,
    data: { sessionId: string; spirit: string },
  ): WsResponse<string> {
    this.LOG.log(`Player ${client.id} selected spirit ${data.spirit}`);
    this.appService.selectSpirit(data.sessionId, client.id, data.spirit);

    if (this.appService.game.started) {
      this.server.to(data.sessionId).to(this.gameRoom).emit('start');
      this.startPlayerNotification(data.sessionId);
    }

    return { event: 'selectSpirit', data: 'OK' };
  }

  @SubscribeMessage('start')
  start(client: Socket, data: { sessionId: string }) {
    try {
      if (this.appService.game.sessionId !== data.sessionId) {
        return;
      }
      this.appService.game.started = true;
      this.server.to(data.sessionId).to(this.gameRoom).emit('start');
      this.startPlayerNotification(data.sessionId);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  private startPlayerNotification(sessionId: string) {
    this.LOG.log('Starting game');

    this.playersSubscription?.unsubscribe();
    this.playersSubscription = interval(300).subscribe(() => {
      this.server
        .to(this.gameRoom)
        .emit('players', this.appService.game.players);
    });
  }

  @SubscribeMessage('addScore')
  addScore(client: Socket, data: { sessionId: string; score: number }) {
    try {
      this.appService.addScore(data.sessionId, client.id, data.score);
      if (this.appService.game.finished) {
        this.server.to(data.sessionId).to(this.gameRoom).emit('finish');
        this.playersSubscription?.unsubscribe();
        this.playersSubscription = null;
        this.LOG.log('Game finished');
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('reset')
  reset(client: Socket) {
    try {
      this.LOG.log('Resetting game');
      const sessionId = this.appService.game.sessionId;
      this.appService.reset();
      this.server.to(this.gameRoom).emit('reset');
      if (sessionId) {
        this.server.to(sessionId).emit('reset');
      }
      this.playersSubscription?.unsubscribe();
      this.playersSubscription = null;
      client.leave(this.gameRoom);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
