import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { Game } from './interfaces';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getGame(@Query('sessionId') sessionId: string): Game | null {
    const game = this.appService.game;
    console.log(sessionId, game.sessionId);
    return sessionId === game.sessionId ? this.appService.game : null;
  }
}
