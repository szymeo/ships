import {Application, Container, Graphics, GraphicsContext} from "pixi.js";
import {switchCase} from "./utils";

enum BoardMember {
    EMPTY= 'empty',
    SHIP = 'ship',
    HIT = 'hit',
    FORBIDDEN = 'forbidden',
}

export class Game {
    private static _instance: Game;

    private static BOARD_SIZE = 10;
    private static SQUARE_SIZE = 100;
    private static GRID_GAP = 1;
    private static SQUARE_RADIUS = 6;
    private static SHIP_SIZE = 25;

    private _graphicsContexts = {
        squareGraphicsContext: new GraphicsContext().roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS).fill({color: 0x4b5563}),
        forbiddenGraphicsContext: new GraphicsContext().roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS).fill({color: 0x4b5563}),
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
        hitSquareGraphicsContext: new GraphicsContext().roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS).fill({color: 0xF44336}),
        hoveredSquareGraphicsContext: new GraphicsContext().roundRect(0, 0, Game.SQUARE_SIZE, Game.SQUARE_SIZE, Game.SQUARE_RADIUS).fill({color: 0x6b7280}),
    }
    private _board: Map<string, BoardMember> = new Map();
    private _boardCellsGraphics: Map<string, Graphics> = new Map();
    private _isPointerDown = false;
    private _boardDirty: number[][] = [];
    private _hoveredSquares: Set<string> = new Set();
    private _changedSquares: Set<string> = new Set();

    private constructor(private readonly container: Container) {
        this._createEmptyBoard();
        this._redrawBoard();
    }

    static init(container: Container): void {
        if (this._instance) {
            return;
        }

        this._instance = new Game(container);
    }

    _redrawBoard(): void {
        if (!this._boardCellsGraphics.size) {
            for (let i = 0; i < Game.BOARD_SIZE; i++) {
                for (let j = 0; j < Game.BOARD_SIZE; j++) {
                    this._renderBoardCell(i, j);
                }
            }
        }

        this._boardDirty.forEach(([i, j]) => {
            const square = this._boardCellsGraphics.get(this._getIndexOfSquare(i, j));
            square.context = this._getSquareGraphicsContext({
                isHovered: this._hoveredSquares.has(this._getIndexOfSquare(i, j)),
                squareType: this._board.get(this._getIndexOfSquare(i, j)),
            });
        });
        this._boardDirty = [];
    }

    private _renderBoardCell(i: number, j: number): void {
        const squareType = this._board.get(this._getIndexOfSquare(i, j));
        const squareDefaultGraphicContext = this._getSquareGraphicsContext({
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
            square.context = this._getSquareGraphicsContext({
                isHovered: true,
                squareType,
            });

            this._hoveredSquares.add(this._getIndexOfSquare(i, j));
            this._boardDirty.push([i, j]);
            this._redrawBoard();
        }
        square.onpointermove = () => {
            if (this._isPointerDown && !this._changedSquares.has(this._getIndexOfSquare(i, j))) {
                this._changedSquares.add(this._getIndexOfSquare(i, j));
                this._board.set(this._getIndexOfSquare(i, j), switchCase({
                    [BoardMember.EMPTY]: BoardMember.SHIP,
                    [BoardMember.SHIP]: BoardMember.EMPTY,
                })(this._board.get(this._getIndexOfSquare(i, j))));
                this._boardDirty.push([i, j]);
                this._redrawBoard();
            }
        }
        square.onmouseout = () => {
            this._hoveredSquares.delete(this._getIndexOfSquare(i, j));
            this._changedSquares.delete(this._getIndexOfSquare(i, j));
            this._boardDirty.push([i, j]);
            this._redrawBoard();
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
            if (!this._changedSquares.has(this._getIndexOfSquare(i, j))) {
                this._board.set(this._getIndexOfSquare(i, j), switchCase({
                    [BoardMember.EMPTY]: BoardMember.SHIP,
                    [BoardMember.SHIP]: BoardMember.EMPTY,
                })(this._board.get(this._getIndexOfSquare(i, j))));
                this._changedSquares.add(this._getIndexOfSquare(i, j));
                console.log(`Clicked on square [${i}, ${j}]`);
                this._boardDirty.push([i, j]);
                this._redrawBoard();
            }
        }

        this._boardCellsGraphics.set(this._getIndexOfSquare(i, j), square);
        this.container.addChild(square);
    }

    private _getSquareGraphicsContext({isHovered, squareType}): GraphicsContext {
        switch (squareType) {
            case BoardMember.SHIP:
                return isHovered ? this._graphicsContexts.hoveredShipSquareGraphicsContext : this._graphicsContexts.shipSquareGraphicsContext;
            case BoardMember.HIT:
                return this._graphicsContexts.hitSquareGraphicsContext;
            default:
                return isHovered ? this._graphicsContexts.hoveredSquareGraphicsContext : this._graphicsContexts.squareGraphicsContext;
        }
    }

    _createEmptyBoard(): void {
        this._board.clear();

        for (let i = 0; i < Game.BOARD_SIZE; i++) {
            this._board[i] = [];
            for (let j = 0; j < Game.BOARD_SIZE; j++) {
                this._board.set(this._getIndexOfSquare(i, j), BoardMember.EMPTY);
            }
        }
    }

    _getIndexOfSquare(x: number, y: number): string {
        return `x${x}y_${y}`;
    }
}