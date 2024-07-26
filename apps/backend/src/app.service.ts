import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { Game, Player } from './interfaces';
import { BehaviorSubject } from 'rxjs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class AppService {
  public game: Game = this.baseGame;
  public availableSpirits$: BehaviorSubject<string[]> = new BehaviorSubject([]);

  get baseGame(): Game {
    return {
      sessionId: '',
      players: [],
      slots: 0,
      started: false,
      finished: false,
      maxScore: 0,
    };
  }

  get spirits(): string[] {
    return readdirSync(join(__dirname, '../..', 'frontend', 'dist', 'spirits'));
  }

  public init(slots: number, maxScore: number): string {
    if (this.game.sessionId) {
      throw new Error(
        'Game session already started, let it finish or reset it.',
      );
    }

    this.game = {
      ...this.baseGame,
      sessionId: nanoid(),
      slots,
      maxScore,
    };

    this.availableSpirits$.next(this.spirits);

    return this.game.sessionId;
  }

  private checkSession(sessionId: string): void {
    if (this.game.sessionId !== sessionId) {
      throw new Error('Session not found.');
    }
  }
  public joinSession(sessionId: string): Game {
    this.checkSession(sessionId);
    return this.game;
  }

  public selectSpirit(
    sessionId: string,
    playerId: string,
    spirit: string,
  ): void {
    this.checkSession(sessionId);

    if (this.game.started) {
      throw new Error('Game session already started.');
    }

    if (this.game.players.length >= this.game.slots) {
      throw new Error('Game session is full.');
    }

    if (!this.spirits.includes(spirit)) {
      throw new Error('Sprite not available.');
    }

    const player = this.findPlayer(playerId);
    const availableSpirits = this.availableSpirits$.value;

    if (player) {
      availableSpirits.push(player.spirit);
      player.spirit = spirit;
    } else {
      this.game.players.push({
        id: playerId,
        score: 0,
        spirit: spirit,
      });
    }

    if (this.game.players.length === this.game.slots) {
      this.game.started = true;
    }

    this.availableSpirits$.next(availableSpirits.filter((s) => s !== spirit));
  }

  private findPlayer(playerId: string): Player | null {
    const player = this.game.players.find((p) => p.id === playerId);
    if (!player) {
      return null;
    }

    return player;
  }

  public addScore(sessionId: string, playerId: string, score: number): void {
    this.checkSession(sessionId);

    const player = this.findPlayer(playerId);
    if (!player) {
      throw new Error('Player not found.');
    }

    player.score += score;

    if (player.score >= this.game.maxScore) {
      this.game.finished = true;
    }
  }

  public reset(): void {
    this.game = {
      ...this.baseGame,
    };
    this.availableSpirits$.complete();
    this.availableSpirits$ = new BehaviorSubject([]);
  }
}
