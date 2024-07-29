import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  BehaviorSubject,
  filter,
  map,
  Subject,
  Subscription,
  take,
  timer,
} from 'rxjs';
import { Game, Player } from './interfaces';

@Injectable()
export class AppService {
  public game: Game = this.baseGame;
  public players$: BehaviorSubject<Player[]>;
  public start$: Subject<void>;
  public finish$: Subject<void>;
  public countdownLobby$: Subject<number>;
  public countdownGame$: Subject<number>;

  private timerSubscription: Subscription | null = null;
  private readonly countdownLobby = 30;
  private readonly countdownGame = 6;

  constructor() {
    this.initObservables();
  }

  private initObservables() {
    this.players$?.complete();
    this.start$?.complete();
    this.finish$?.complete();

    this.timerSubscription?.unsubscribe();

    this.players$ = new BehaviorSubject(this.game.players);
    this.start$ = new Subject();
    this.finish$ = new Subject();
    this.countdownLobby$ = new Subject();
    this.countdownGame$ = new Subject();
    this.countdownLobby$
      .pipe(filter((i) => i === 0))
      .subscribe(() => this.start$.next());

    this.start$.subscribe(() => {
      this.game.started = true;
      this.setupTimer(this.countdownGame$, this.countdownGame);
    });

    this.finish$.subscribe(() => {
      this.game.finished = true;
      this.timerSubscription?.unsubscribe();
      this.timerSubscription = null;
    });
  }

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

    this.players$.next(this.game.players);

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
      throw new Error('Spirit not available.');
    }

    const player = this.findPlayer(playerId);

    if (player) {
      player.spirit = spirit;
    } else {
      this.game.players.push({
        id: playerId,
        score: 0,
        spirit: spirit,
      });
    }

    this.players$.next(this.game.players);
    this.setupTimer(
      this.countdownLobby$,
      this.game.players.length < this.game.slots ? this.countdownLobby : 0,
    );
  }

  private setupTimer(countdown$: Subject<number>, countdown: number) {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = timer(0, 1000)
      .pipe(
        take(countdown + 1),
        map((i) => countdown - i),
      )
      .subscribe((i) => countdown$.next(i));
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

    if (!this.game.started || this.game.finished) {
      throw new Error('Game is not running.');
    }

    const player = this.findPlayer(playerId);
    if (!player) {
      throw new Error('Player not found.');
    }

    player.score = Math.min(
      Math.round((score + player.score) * 100) / 100,
      this.game.maxScore,
    );

    if (player.score >= this.game.maxScore) {
      this.finish$.next();
      this.players$.next(this.game.players);
    }
  }

  public reset(): void {
    this.game = {
      ...this.baseGame,
    };
    this.initObservables();
  }
}
