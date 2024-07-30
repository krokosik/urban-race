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
import { Game, GameError, GameErrorType, Player } from './interfaces';

@Injectable()
export class AppService {
  public game: Game = this.baseGame;
  public reset$: Subject<void> = new Subject();

  public players$: BehaviorSubject<Player[]>;
  public start$: Subject<void>;
  public finish$: Subject<void>;
  public countdownLobby$: Subject<number>;
  public countdownGame$: Subject<number>;
  public countdownFinish$: Subject<number>;

  private timerSubscription: Subscription | null = null;
  private startTimestamp: number;

  constructor() {
    this.reset$.subscribe(() => {
      this.game = this.baseGame;
      this.initObservables();
    });
    this.reset();
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
    this.countdownFinish$ = new Subject();
    this.countdownLobby$
      .pipe(filter((i) => i === 0))
      .subscribe(() => this.start$.next());

    this.countdownFinish$
      .pipe(filter((i) => i === 0))
      .subscribe(() => this.finish$.next());

    this.countdownGame$.pipe(filter((i) => i === 0)).subscribe(() => {
      this.startTimestamp = Date.now();
      this.setupTimer(this.countdownFinish$, this.game.raceTime, true);
    });

    this.start$.subscribe(() => {
      this.game.started = true;
      this.setupTimer(this.countdownGame$, this.game.countdownGame);
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
      slots: this.spirits.length,
      started: false,
      finished: false,
      maxScore: 100,
      countdownGame: 9,
      countdownLobby: 30,
      secondDurationMs: 1500,
      raceTime: 60,
    };
  }

  get spirits(): string[] {
    return readdirSync(join(__dirname, '../..', 'frontend', 'dist', 'spirits'));
  }

  public init(
    data: Partial<{
      slots: number;
      maxScore: number;
      raceTime: number;
      countdownLobby: number;
      countdownGame: number;
      secondDurationMs: number;
    }>,
  ): string {
    if (this.game.sessionId) {
      throw new GameError(GameErrorType.GameStarted);
    }

    this.game = {
      ...this.baseGame,
      ...data,
      sessionId: nanoid(),
    };
    this.initObservables();

    this.players$.next(this.game.players);

    return this.game.sessionId;
  }

  private checkSession(sessionId: string): void {
    if (this.game.sessionId !== sessionId) {
      throw new GameError(GameErrorType.NoSession);
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
      throw new GameError(GameErrorType.GameStarted);
    }

    if (this.game.players.length >= this.game.slots) {
      throw new GameError(GameErrorType.GameFull);
    }

    if (!this.spirits.includes(spirit)) {
      throw new GameError(GameErrorType.SpiritNotAvailable);
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
      this.setupTimer(
        this.countdownLobby$,
        this.game.players.length < this.game.slots
          ? this.game.countdownLobby
          : 0,
      );
    }

    this.players$.next(this.game.players);
  }

  private setupTimer(
    countdown$: Subject<number>,
    countdown: number,
    ignoreRatio = false,
  ) {
    this.timerSubscription?.unsubscribe();
    const secondDurationMs = ignoreRatio ? 1000 : this.game.secondDurationMs;
    const rescaledCountdown = Math.round((countdown * 1000) / secondDurationMs);
    this.timerSubscription = timer(0, secondDurationMs)
      .pipe(
        take(rescaledCountdown + 1),
        map((i) => rescaledCountdown - i),
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
      throw new GameError(GameErrorType.GameNotRunning);
    }

    const player = this.findPlayer(playerId);
    if (!player) {
      throw new GameError(GameErrorType.PlayerNotFound);
    }

    player.score = Math.min(
      Math.round((score + player.score) * 100) / 100,
      this.game.maxScore,
    );

    if (player.score >= this.game.maxScore && !player.time) {
      player.time = Date.now() - this.startTimestamp;
      this.players$.next(this.game.players);
    }

    const playersFinished = this.game.players.reduce(
      (acc, p) => acc + (p.time ? 1 : 0),
      0,
    );
    if (playersFinished >= Math.min(this.game.players.length, 3)) {
      this.finish$.next();
      this.players$.next(this.game.players);
    }
  }

  public reset(): void {
    this.reset$.next();
  }
}
