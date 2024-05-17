import {Container} from "pixi.js";
import {Board} from "./Board";
import {BoardMember} from "./models";
import {GameRecordsStorage} from "./GameRecordsStorage";

export class Game {
    private static _instance: Game;

    private _myBoardContainer = new Container();
    private _opponentBoardContainer = new Container();
    private _myBoard: Board;
    private _opponentBoard: Board;

    private constructor(private readonly container: Container) {
        this.container.addChild(this._myBoardContainer);
        this.container.addChild(this._opponentBoardContainer);

        const BOARD_SIZE = 10;
        const SQUARE_SIZE = 50;
        const GRID_GAP = 1;
        const SQUARE_RADIUS = 6;
        const SHIP_SIZE = SQUARE_SIZE / 4;

        this._myBoard = new Board(this._myBoardContainer, {
            BOARD_SIZE,
            SQUARE_SIZE,
            GRID_GAP,
            SQUARE_RADIUS,
            SHIP_SIZE,
        })
        this._myBoard.setPlacementStage();
        this._opponentBoard = new Board(this._opponentBoardContainer, {
            BOARD_SIZE,
            SQUARE_SIZE: SQUARE_SIZE,
            GRID_GAP: GRID_GAP,
            SQUARE_RADIUS: SQUARE_RADIUS,
            SHIP_SIZE: SHIP_SIZE,
            MARKING_MAP: {
                [BoardMember.EMPTY]: BoardMember.HIT,
                [BoardMember.HIT]: BoardMember.HIT_SHIP,
                [BoardMember.HIT_SHIP]: BoardMember.EMPTY,
            }
        });

        this._myBoardContainer.x = 60;
        this._myBoardContainer.y = 60;

        this._opponentBoardContainer.x = BOARD_SIZE * SQUARE_SIZE + 60 + 120 + 60;
        this._opponentBoardContainer.y = 60;
    }

    static init(container: Container): void {
        this._instance = new Game(container);
    }

    static startNewGame(): void {
        this._instance._myBoard.init();
        this._instance._myBoard.setPlacementStage();
        this._instance._opponentBoard.init();
    }

    static startBattle(): void {
        this._instance._myBoard.setMarkingStage();
        this._instance._opponentBoard.setMarkingStage();
    }

    static endBattle(): void {
        GameRecordsStorage.addRecord({
            data: {
                me: Array.from(this._instance._myBoard.data.entries()),
                opponent: Array.from(this._instance._opponentBoard.data.entries()),
            }
        })
        this._instance._myBoard.setConclusionStage();
        this._instance._opponentBoard.setConclusionStage();
    }
}