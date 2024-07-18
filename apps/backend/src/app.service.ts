import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { Game, Player } from './interfaces';
import { BehaviorSubject } from 'rxjs';

const sprites = ['🦀', '🐙', '🦑', '🦐'];

const baseGame: Game = {
  sessionId: '',
  players: [],
  slots: 0,
  started: false,
  finished: false,
  maxScore: 0,
};

@Injectable()
export class AppService {
  private game: Game = baseGame;
  public availableSprites$: BehaviorSubject<string[]> = new BehaviorSubject([]);
  public gameStarted$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public gameFinished$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public init(slots: number, maxScore: number): string {
    if (this.game.sessionId) {
      throw new Error(
        'Game session already started, let it finish or reset it.',
      );
    }

    this.game = {
      ...baseGame,
      sessionId: nanoid(),
      slots,
      maxScore,
    };

    this.availableSprites$.next(sprites);

    return this.game.sessionId;
  }

  private checkSession(sessionId: string): void {
    this.checkSession(sessionId);
  }

  public join(sessionId: string, sprite: string): void {
    this.checkSession(sessionId);

    if (this.game.started) {
      throw new Error('Game session already started.');
    }

    if (this.game.players.length >= this.game.slots) {
      throw new Error('Game session is full.');
    }

    if (!sprites.includes(sprite)) {
      throw new Error('Sprite not available.');
    }

    this.game.players.push({
      id: nanoid(),
      ready: false,
      score: 0,
      sprite,
    });

    this.availableSprites$.next(
      this.availableSprites$.value.filter((s) => s !== sprite),
    );
  }

  private findPlayer(playerId: string): Player {
    const player = this.game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not found.');
    }

    return player;
  }

  public markReady(sessionId: string, playerId: string): void {
    this.checkSession(sessionId);

    const player = this.findPlayer(playerId);

    player.ready = true;

    if (this.game.players.every((p) => p.ready)) {
      this.game.started = true;
    }
  }

  public addScore(sessionId: string, playerId: string, score: number): void {
    this.checkSession(sessionId);

    const player = this.findPlayer(playerId);

    player.score += score;

    if (player.score >= this.game.maxScore) {
      this.game.finished = true;
    }
  }

  public reset(): void {
    this.game = {
      ...baseGame,
    };
    this.availableSprites$.complete();
    this.availableSprites$ = new BehaviorSubject([]);
  }
}
