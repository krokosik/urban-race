import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Logger } from 'nestjs-pino';
import { toDataURL } from 'qrcode';
import { interval, mergeMap, takeUntil } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { AppService } from './app.service';

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
      this.setupSubscriptions(sessionId);

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

  private setupSubscriptions(sessionId: string) {
    this.appService.players$.subscribe((players) => {
      this.server.to(sessionId).to(this.gameRoom).emit('players', players);
    });
    this.appService.start$.subscribe(() => {
      this.server.to(sessionId).to(this.gameRoom).emit('start');
      this.LOG.log('Game started');
    });
    this.appService.finish$.subscribe(() => {
      this.server.to(sessionId).to(this.gameRoom).emit('finish');
      this.LOG.log('Game finished');
    });
    this.appService.start$
      .pipe(
        mergeMap(() => interval(300)),
        takeUntil(this.appService.finish$),
      )
      .subscribe(() => {
        this.server
          .to(this.gameRoom)
          .emit('players', this.appService.game.players);
      });
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
  selectSpirit(client: Socket, data: { sessionId: string; spirit: string }) {
    this.LOG.log(`Player ${client.id} selected spirit ${data.spirit}`);
    this.appService.selectSpirit(data.sessionId, client.id, data.spirit);
  }

  @SubscribeMessage('addScore')
  addScore(client: Socket, data: { sessionId: string; score: number }) {
    try {
      this.appService.addScore(data.sessionId, client.id, data.score);
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
      this.server
        .to(this.gameRoom)
        .to(sessionId ?? '')
        .emit('reset');
      client.leave(this.gameRoom);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
