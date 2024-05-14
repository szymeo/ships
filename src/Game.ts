import {Container, Graphics, GraphicsContext, Text} from "pixi.js";
import {switchCase} from "./utils";

enum BoardMember {
    EMPTY = 'empty',
    SHIP = 'ship',
    HIT = 'hit',
    HIT_SHIP = 'hit_ship',
    HIT_FORBIDDEN = 'hit_forbidden',
    FORBIDDEN = 'forbidden',
}

enum GamePhase {
    PLACEMENT = 'placement',
    BATTLE = 'battle',
}

export class Game {
    private static _instance: Game;

    private static BOARD_SIZE = 10;
    private static SQUARE_SIZE = 50;
    private static GRID_GAP = 1;
    private static SQUARE_RADIUS = 6;
    private static SHIP_SIZE = Game.SQUARE_SIZE / 4;

    private readonly boardContainer = new Container();
    private readonly hudContainer = new Container();
    private _gamePhase: GamePhase = GamePhase.PLACEMENT;
    private _graphicsContexts = {
        squareGraphicsContext: new GraphicsContext().roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS).fill({color: 0x4b5563}),
        forbiddenGraphicsContext: new GraphicsContext()
            .roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS)
            .fill({color: 0x4b5563})
            .moveTo(Game.SQUARE_SIZE / 3, Game.SQUARE_SIZE / 3)
            .lineTo(Game.SQUARE_SIZE * 2 / 3, Game.SQUARE_SIZE * 2 / 3)
            .moveTo(Game.SQUARE_SIZE * 2 / 3, Game.SQUARE_SIZE / 3)
            .lineTo(Game.SQUARE_SIZE / 3, Game.SQUARE_SIZE * 2 / 3)
            .stroke({width: 2, color: 0x111111}),
        hoveredForbiddenGraphicsContext: new GraphicsContext().roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS).fill({color: 0x4b5563}),
        shipSquareGraphicsContext: new GraphicsContext()
            .roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS)
            .fill({color: 0x1f2937})
            .circle(Game.SQUARE_SIZE / 2, Game.SQUARE_SIZE / 2, Game.SHIP_SIZE)
            .fill({color: 0xf59e0b}),
        hoveredShipSquareGraphicsContext: new GraphicsContext()
            .roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS)
            .fill({color: 0x222222})
            .circle(Game.SQUARE_SIZE / 2, Game.SQUARE_SIZE / 2, Game.SHIP_SIZE)
            .fill({color: 0xf59e0b}),
        hitSquareGraphicsContext: new GraphicsContext()
            .roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS)
            .fill({color: 0x4b5563})
            .moveTo(Game.SQUARE_SIZE / 3, Game.SQUARE_SIZE / 3)
            .lineTo(Game.SQUARE_SIZE * 2 / 3, Game.SQUARE_SIZE * 2 / 3)
            .moveTo(Game.SQUARE_SIZE * 2 / 3, Game.SQUARE_SIZE / 3)
            .lineTo(Game.SQUARE_SIZE / 3, Game.SQUARE_SIZE * 2 / 3)
            .stroke({width: 2, color: 0xF44336}),
        hitShipSquareGraphicsContext: new GraphicsContext()
            .roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS)
            .fill({color: 0x1f2937})
            .circle(Game.SQUARE_SIZE / 2, Game.SQUARE_SIZE / 2, Game.SHIP_SIZE)
            .fill({color: 0xF44336}),
        hitForbiddenSquareGraphicsContext: new GraphicsContext()
            .roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS)
            .fill({color: 0x4b5563})
            .moveTo(Game.SQUARE_SIZE / 3, Game.SQUARE_SIZE / 3)
            .lineTo(Game.SQUARE_SIZE * 2 / 3, Game.SQUARE_SIZE * 2 / 3)
            .moveTo(Game.SQUARE_SIZE * 2 / 3, Game.SQUARE_SIZE / 3)
            .lineTo(Game.SQUARE_SIZE / 3, Game.SQUARE_SIZE * 2 / 3)
            .stroke({width: 3, color: 0xF44336}),
        hoveredSquareGraphicsContext: new GraphicsContext().roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS).fill({color: 0x6b7280}),
    }
    private _board: Map<string, BoardMember> = new Map();
    private _boardCellsGraphics: Map<string, Graphics> = new Map();
    private _isPointerDown = false;
    private _boardDirty: number[][] = [];
    private _hoveredSquares: Set<string> = new Set();
    private _changedSquares: Set<string> = new Set();

    private constructor(private readonly container: Container) {
        this.container.addChild(this.boardContainer);
        this.container.addChild(this.hudContainer);
        this.createEmptyBoard();
        this.redrawBoard();
        this.drawBoardLetters();
    }

    get isPlacementPhase(): boolean {
        return this._gamePhase === GamePhase.PLACEMENT;
    }

    get isBattlePhase(): boolean {
        return this._gamePhase === GamePhase.BATTLE;
    }

    static init(container: Container): void {
        this._instance = new Game(container);
    }

    static startBattle(): void {
        this._instance._gamePhase = GamePhase.BATTLE;
        this._instance.redrawBoard();
    }

    drawBoardLetters(): void {
        const boardLetters = 'ABCDOLMXVZ';

        for (let i = 0; i < Game.BOARD_SIZE; i++) {
            const letter = new Text({
                text: boardLetters[i],
                style: {
                    fontSize: 20,
                    fill: 0xffffff,
                },
                x: i * (Game.SQUARE_SIZE + Game.GRID_GAP) + Game.SQUARE_SIZE / 2 - 5,
                y: -30,
            });

            this.boardContainer.addChild(letter);
        }

        for (let i = 0; i < Game.BOARD_SIZE; i++) {
            const letter = new Text({
                text: i + 1,
                style: {
                    fontSize: 20,
                    fill: 0xffffff,
                },
                x: -30,
                y: i * (Game.SQUARE_SIZE + Game.GRID_GAP) + Game.SQUARE_SIZE / 2 - 10,
            });

            this.boardContainer.addChild(letter);
        }

    }

    redrawBoard(): void {
        if (!this._boardCellsGraphics.size) {
            this.boardContainer.removeChildren();

            for (let i = 0; i < Game.BOARD_SIZE; i++) {
                for (let j = 0; j < Game.BOARD_SIZE; j++) {
                    this.renderBoardCell(i, j);
                }
            }
        }

        this._boardDirty.forEach(([i, j]) => {
            const square = this._boardCellsGraphics.get(this.getIndexOfSquare(i, j));
            square.context = this.getSquareGraphicsContext({
                isHovered: this._hoveredSquares.has(this.getIndexOfSquare(i, j)),
                squareType: this._board.get(this.getIndexOfSquare(i, j)),
            });
        });
        this._boardDirty = [];
    }

    renderBoardCell(i: number, j: number): void {
        const squareType = this._board.get(this.getIndexOfSquare(i, j));
        const squareDefaultGraphicContext = this.getSquareGraphicsContext({
            isHovered: false,
            squareType,
        });
        const square = new Graphics({
            context: squareDefaultGraphicContext,
            x: i * (Game.SQUARE_SIZE + Game.GRID_GAP),
            y: j * (Game.SQUARE_SIZE + Game.GRID_GAP),
        });

        square.cursor = 'pointer';
        square.eventMode = 'static';
        square.onmouseover = () => {
            square.context = this.getSquareGraphicsContext({
                isHovered: true,
                squareType,
            });

            this._hoveredSquares.add(this.getIndexOfSquare(i, j));
            this._boardDirty.push([i, j]);
            this.redrawBoard();
        }
        square.onpointermove = () => {
            if (this.isBattlePhase) {
                return;
            }

            if (this._isPointerDown && !this._changedSquares.has(this.getIndexOfSquare(i, j))) {
                const newBoardMemberType = switchCase({
                    [BoardMember.EMPTY]: BoardMember.SHIP,
                    [BoardMember.SHIP]: BoardMember.EMPTY,
                    [BoardMember.FORBIDDEN]: BoardMember.SHIP,
                })(this._board.get(this.getIndexOfSquare(i, j)));

                this._changedSquares.add(this.getIndexOfSquare(i, j));
                this._board.set(this.getIndexOfSquare(i, j), newBoardMemberType);
                this._boardDirty.push([i, j]);
                this.markForbiddenSquares();
                this.redrawBoard();
            }
        }
        square.onmouseout = () => {
            this._hoveredSquares.delete(this.getIndexOfSquare(i, j));
            this._changedSquares.delete(this.getIndexOfSquare(i, j));
            this._boardDirty.push([i, j]);
            this.redrawBoard();
        }
        square.onpointerdown = () => {
            this._isPointerDown = true;
        }
        square.onpointerup = () => {
            this._isPointerDown = false;
            setTimeout(() => {
                this._changedSquares.clear();
            }, 100)
        }
        square.onclick = () => {
            const oldBoardMemberType = this._board.get(this.getIndexOfSquare(i, j));

            if (this.isBattlePhase) {
                const newBoardMemberType = switchCase({
                    [BoardMember.EMPTY]: BoardMember.HIT,
                    [BoardMember.HIT]: BoardMember.EMPTY,
                    [BoardMember.SHIP]: BoardMember.HIT_SHIP,
                    [BoardMember.HIT_SHIP]: BoardMember.SHIP,
                    [BoardMember.FORBIDDEN]: BoardMember.HIT_FORBIDDEN,
                    [BoardMember.HIT_FORBIDDEN]: BoardMember.FORBIDDEN,
                })(oldBoardMemberType);

                this._board.set(this.getIndexOfSquare(i, j), newBoardMemberType);
                this._boardDirty.push([i, j]);
                this.redrawBoard();
                return;
            }

            if (!this._changedSquares.has(this.getIndexOfSquare(i, j))) {
                const newBoardMemberType = switchCase({
                    [BoardMember.EMPTY]: BoardMember.SHIP,
                    [BoardMember.SHIP]: BoardMember.EMPTY,
                    [BoardMember.FORBIDDEN]: BoardMember.SHIP,
                })(oldBoardMemberType);

                this._board.set(this.getIndexOfSquare(i, j), newBoardMemberType);
                this._changedSquares.add(this.getIndexOfSquare(i, j));
                this._boardDirty.push([i, j]);
                this.markForbiddenSquares();

                this.redrawBoard();
            }
        }

        this._boardCellsGraphics.set(this.getIndexOfSquare(i, j), square);
        this.boardContainer.addChild(square);
    }

    markForbiddenSquares(): void {
        Array.from(this._board.entries()).forEach(([key, value]) => {
            if (value === BoardMember.FORBIDDEN) {
                this._board.set(key, BoardMember.EMPTY);
                this._boardDirty.push(key.split('_').map(Number));
            }
        })

        Array.from(this._board.entries()).forEach(([key, value]) => {
            if (value === BoardMember.SHIP) {
                const [x, y] = key.split('_');
                const i = Number(x);
                const j = Number(y);
                const siblingSquares = [
                    [i - 1, j - 1],
                    [i - 1, j],
                    [i - 1, j + 1],
                    [i + 1, j],
                    [i + 1, j - 1],
                    [i, j - 1],
                    [i + 1, j + 1],
                    [i, j + 1],
                ];
                siblingSquares.forEach(([x, y]) => {
                    if (x >= 0 && x < Game.BOARD_SIZE && y >= 0 && y < Game.BOARD_SIZE && this._board.get(this.getIndexOfSquare(x, y)) !== BoardMember.SHIP){
                        this._board.set(this.getIndexOfSquare(x, y), BoardMember.FORBIDDEN);
                        this._boardDirty.push([x, y]);
                    }
                });
            }
        })
    }

    getSquareGraphicsContext({isHovered, squareType}): GraphicsContext {
        switch (squareType) {
            case BoardMember.SHIP:
                return isHovered ? this._graphicsContexts.hoveredShipSquareGraphicsContext : this._graphicsContexts.shipSquareGraphicsContext;
            case BoardMember.HIT:
                return this._graphicsContexts.hitSquareGraphicsContext;
            case BoardMember.HIT_SHIP:
                return this._graphicsContexts.hitShipSquareGraphicsContext;
            case BoardMember.HIT_FORBIDDEN:
                return this._graphicsContexts.hitForbiddenSquareGraphicsContext;
            case BoardMember.FORBIDDEN:
                return this._graphicsContexts.forbiddenGraphicsContext;
            default:
                return isHovered ? this._graphicsContexts.hoveredSquareGraphicsContext : this._graphicsContexts.squareGraphicsContext;
        }
    }

    createEmptyBoard(): void {
        this._board.clear();

        for (let i = 0; i < Game.BOARD_SIZE; i++) {
            this._board[i] = [];
            for (let j = 0; j < Game.BOARD_SIZE; j++) {
                this._board.set(this.getIndexOfSquare(i, j), BoardMember.EMPTY);
            }
        }
    }

    getIndexOfSquare(x: number, y: number): string {
        return `${x}_${y}`;
    }
}