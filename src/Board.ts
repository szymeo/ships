import {Container, Graphics, GraphicsContext, Text} from "pixi.js";
import {BoardMember, BoardOptions, BoardStage} from "./models";
import {switchCase} from "./utils";

function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export class Board {
    private readonly boardContainer = new Container();

    private readonly _options: BoardOptions = {
        BOARD_SIZE: 10,
        SQUARE_SIZE: 50,
        GRID_GAP: 1,
        SQUARE_RADIUS: 6,
        SHIP_SIZE: 12.5,
        MARKING_MAP: {
            [BoardMember.EMPTY]: BoardMember.HIT,
            [BoardMember.HIT]: BoardMember.EMPTY,
            [BoardMember.SHIP]: BoardMember.HIT_SHIP,
            [BoardMember.HIT_SHIP]: BoardMember.SHIP,
            [BoardMember.FORBIDDEN]: BoardMember.HIT_FORBIDDEN,
            [BoardMember.HIT_FORBIDDEN]: BoardMember.FORBIDDEN,
        },
        TITLE: 'Board',
    }
    private _stage: BoardStage = BoardStage.DISABLED;
    private _graphicsContexts: Record<string, GraphicsContext> = {};
    private _board: Map<string, BoardMember> = new Map();
    private _boardCellsGraphics: Map<string, Graphics> = new Map();
    private _isPointerDown = false;
    private _pointerDownCoords: { x: number, y: number };
    private _boardDirty: number[][] = [];
    private _hoveredSquares: Set<string> = new Set();
    private _changedSquares: Set<string> = new Set();
    private _cellLocatorText: Text = new Text({
        text: '',
        style: {
            fontSize: 20,
            fill: 0xffffff,
            fontFamily: 'PoetsenOne'
        },
        x: 0,
        y: 0,
    });

    constructor(
        private readonly container: Container,
        options: Partial<BoardOptions> = {},
    ) {
        document.addEventListener('pointerup', () => {
            this._isPointerDown = false;
            this._pointerDownCoords = null;
            setTimeout(() => {
                this._changedSquares.clear();
            }, 100)
        });
        this._options = {...this._options, ...options};
        this._generateTextures();
        this.container.addChild(this.boardContainer);
        this.container.addChild(this._cellLocatorText);
        this.boardContainer.eventMode = 'static';
        this.boardContainer.on('pointerout', () => {
            this._cellLocatorText.text = '';
        });
        this.createEmptyBoard();
        this.redrawBoard();
        this.drawBoardLetters();
    }

    get data(): Map<string, BoardMember> {
        return this._board;
    }

    get isDisabled(): boolean {
        return this._stage === BoardStage.DISABLED;
    }

    get isPlacing(): boolean {
        return this._stage === BoardStage.PLACEMENT;
    }

    get isMarking(): boolean {
        return this._stage === BoardStage.MARKING;
    }

    init(): void {
        this.reset();
        this.setDisabledStage();
        this.createEmptyBoard();
        this.redrawBoard();
        this.drawBoardLetters();
    }

    setPlacementStage(): void {
        this._stage = BoardStage.PLACEMENT;
    }

    setMarkingStage(): void {
        this._stage = BoardStage.MARKING;
    }

    setConclusionStage(): void {
        this._stage = BoardStage.DISABLED;
    }

    setDisabledStage(): void {
        this._stage = BoardStage.DISABLED;
    }

    reset(): void {
        this._board.clear();
        this._boardCellsGraphics.clear();
        this._boardDirty = [];
        this._hoveredSquares.clear();
        this._changedSquares.clear();
        this.boardContainer.removeChildren();
    }

    drawBoardLetters(): void {
        const boardLetters = 'ABCDOLMXVZ';

        for (let i = 0; i < this._options.BOARD_SIZE; i++) {
            const letter = new Text({
                text: boardLetters[i],
                style: {
                    fontSize: 20,
                    fill: 0xffffff,
                    fontFamily: 'PoetsenOne'
                },
                x: i * (this._options.SQUARE_SIZE + this._options.GRID_GAP) + this._options.SQUARE_SIZE / 2 - 5,
                y: -30,
            });

            this.boardContainer.addChild(letter);
        }

        for (let i = 0; i < this._options.BOARD_SIZE; i++) {
            const letter = new Text({
                text: i + 1,
                style: {
                    fontSize: 20,
                    fill: 0xffffff,
                    fontFamily: 'PoetsenOne'
                },
                x: -30,
                y: i * (this._options.SQUARE_SIZE + this._options.GRID_GAP) + this._options.SQUARE_SIZE / 2 - 10,
            });

            this.boardContainer.addChild(letter);
        }

        const title = new Text({
            text: this._options.TITLE,
            style: {
                fontSize: 20,
                fill: 0xffffff,
                fontFamily: 'PoetsenOne'
            },
            x: this._options.BOARD_SIZE * (this._options.SQUARE_SIZE + this._options.GRID_GAP) / 2 - 50,
            y: this._options.BOARD_SIZE * (this._options.SQUARE_SIZE + this._options.GRID_GAP) + 20,
        });
        this.boardContainer.addChild(title);
    }

    redrawBoard(): void {
        if (!this._boardCellsGraphics.size) {
            this.boardContainer.removeChildren();

            for (let i = 0; i < this._options.BOARD_SIZE; i++) {
                for (let j = 0; j < this._options.BOARD_SIZE; j++) {
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
            x: i * (this._options.SQUARE_SIZE + this._options.GRID_GAP),
            y: j * (this._options.SQUARE_SIZE + this._options.GRID_GAP),
        });

        square.cursor = 'pointer';
        square.eventMode = 'static';
        square.onmouseover = () => {
            if (this.isDisabled) {
                return;
            }

            square.context = this.getSquareGraphicsContext({
                isHovered: true,
                squareType,
            });

            this._hoveredSquares.add(this.getIndexOfSquare(i, j));
            this._boardDirty.push([i, j]);
            this.redrawBoard();
        }
        square.onpointermove = (event) => {
            if (this.isDisabled) {
                return;
            }

            this._cellLocatorText.text = `${'ABCDOLMXVZ'[i]}${j + 1}`;
            this._cellLocatorText.x = -10 - (this._cellLocatorText.text.length * 10);
            this._cellLocatorText.y = -30;

            if(!this._isPointerDown) {
                return;
            }

            const mouseDistance = calculateDistance(event.global.x, event.global.y, this._pointerDownCoords.x, this._pointerDownCoords.y);

            if (mouseDistance < 5) {
                return;
            }

            if (!this._changedSquares.has(this.getIndexOfSquare(i, j))) {
                const newBoardMemberType = switchCase({
                    ...(this.isPlacing) && {
                        [BoardMember.EMPTY]: BoardMember.SHIP,
                        [BoardMember.SHIP]: BoardMember.EMPTY,
                        [BoardMember.FORBIDDEN]: BoardMember.SHIP,
                    },
                    ...(this.isMarking) && this._options.MARKING_MAP,
                })(this._board.get(this.getIndexOfSquare(i, j)));

                this._changedSquares.add(this.getIndexOfSquare(i, j));
                this._board.set(this.getIndexOfSquare(i, j), newBoardMemberType);
                this._boardDirty.push([i, j]);

                if (this.isPlacing) {
                    this.markForbiddenSquares();
                }

                this.redrawBoard();
            }
        }
        square.onmouseout = () => {
            if (this.isDisabled) {
                return;
            }

            this._hoveredSquares.delete(this.getIndexOfSquare(i, j));
            this._changedSquares.delete(this.getIndexOfSquare(i, j));
            this._boardDirty.push([i, j]);
            this.redrawBoard();
        }
        square.onpointerdown = (event) => {
            if (this.isDisabled) {
                return;
            }

            this._isPointerDown = true;
            this._pointerDownCoords = {
                x: event.global.x,
                y: event.global.y,
            };
        }
        square.onpointerup = () => {
            if (this.isDisabled) {
                return;
            }

            this._isPointerDown = false;
            setTimeout(() => {
                this._changedSquares.clear();
            }, 100)
        }
        square.onclick = () => {
            if (this.isDisabled) {
                return;
            }

            const oldBoardMemberType = this._board.get(this.getIndexOfSquare(i, j));

            if (this.isMarking) {
                const newBoardMemberType = switchCase({
                    ...this._options.MARKING_MAP
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
                    if (x >= 0 && x < this._options.BOARD_SIZE && y >= 0 && y < this._options.BOARD_SIZE && this._board.get(this.getIndexOfSquare(x, y)) !== BoardMember.SHIP) {
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

        for (let i = 0; i < this._options.BOARD_SIZE; i++) {
            this._board[i] = [];
            for (let j = 0; j < this._options.BOARD_SIZE; j++) {
                this._board.set(this.getIndexOfSquare(i, j), BoardMember.EMPTY);
            }
        }
    }

    getIndexOfSquare(x: number, y: number): string {
        return `${x}_${y}`;
    }

    private _generateTextures(): void {
        this._graphicsContexts = {
            squareGraphicsContext: new GraphicsContext().roundRect(0, 0, this._options.SQUARE_SIZE, this._options.SQUARE_SIZE, this._options.SQUARE_RADIUS).fill({color: 0x4b5563}),
            forbiddenGraphicsContext: new GraphicsContext()
                .roundRect(0, 0, this._options.SQUARE_SIZE, this._options.SQUARE_SIZE, this._options.SQUARE_RADIUS)
                .fill({color: 0x4b5563})
                .moveTo(this._options.SQUARE_SIZE / 3, this._options.SQUARE_SIZE / 3)
                .lineTo(this._options.SQUARE_SIZE * 2 / 3, this._options.SQUARE_SIZE * 2 / 3)
                .moveTo(this._options.SQUARE_SIZE * 2 / 3, this._options.SQUARE_SIZE / 3)
                .lineTo(this._options.SQUARE_SIZE / 3, this._options.SQUARE_SIZE * 2 / 3)
                .stroke({width: 2, color: 0x111111}),
            hoveredForbiddenGraphicsContext: new GraphicsContext().roundRect(0, 0, this._options.SQUARE_SIZE, this._options.SQUARE_SIZE, this._options.SQUARE_RADIUS).fill({color: 0x4b5563}),
            shipSquareGraphicsContext: new GraphicsContext()
                .roundRect(0, 0, this._options.SQUARE_SIZE, this._options.SQUARE_SIZE, this._options.SQUARE_RADIUS)
                .fill({color: 0x1f2937})
                .circle(this._options.SQUARE_SIZE / 2, this._options.SQUARE_SIZE / 2, this._options.SHIP_SIZE)
                .fill({color: 0xf59e0b}),
            hoveredShipSquareGraphicsContext: new GraphicsContext()
                .roundRect(0, 0, this._options.SQUARE_SIZE, this._options.SQUARE_SIZE, this._options.SQUARE_RADIUS)
                .fill({color: 0x222222})
                .circle(this._options.SQUARE_SIZE / 2, this._options.SQUARE_SIZE / 2, this._options.SHIP_SIZE)
                .fill({color: 0xf59e0b}),
            hitSquareGraphicsContext: new GraphicsContext()
                .roundRect(0, 0, this._options.SQUARE_SIZE, this._options.SQUARE_SIZE, this._options.SQUARE_RADIUS)
                .fill({color: 0x4b5563})
                .moveTo(this._options.SQUARE_SIZE / 3, this._options.SQUARE_SIZE / 3)
                .lineTo(this._options.SQUARE_SIZE * 2 / 3, this._options.SQUARE_SIZE * 2 / 3)
                .moveTo(this._options.SQUARE_SIZE * 2 / 3, this._options.SQUARE_SIZE / 3)
                .lineTo(this._options.SQUARE_SIZE / 3, this._options.SQUARE_SIZE * 2 / 3)
                .stroke({width: 3, color: 0xF44336}),
            hitShipSquareGraphicsContext: new GraphicsContext()
                .roundRect(0, 0, this._options.SQUARE_SIZE, this._options.SQUARE_SIZE, this._options.SQUARE_RADIUS)
                .fill({color: 0x1f2937})
                .circle(this._options.SQUARE_SIZE / 2, this._options.SQUARE_SIZE / 2, this._options.SHIP_SIZE)
                .fill({color: 0xF44336}),
            hitForbiddenSquareGraphicsContext: new GraphicsContext()
                .roundRect(0, 0, this._options.SQUARE_SIZE, this._options.SQUARE_SIZE, this._options.SQUARE_RADIUS)
                .fill({color: 0x4b5563})
                .moveTo(this._options.SQUARE_SIZE / 3, this._options.SQUARE_SIZE / 3)
                .lineTo(this._options.SQUARE_SIZE * 2 / 3, this._options.SQUARE_SIZE * 2 / 3)
                .moveTo(this._options.SQUARE_SIZE * 2 / 3, this._options.SQUARE_SIZE / 3)
                .lineTo(this._options.SQUARE_SIZE / 3, this._options.SQUARE_SIZE * 2 / 3)
                .stroke({width: 3, color: 0xF44336}),
            hoveredSquareGraphicsContext: new GraphicsContext().roundRect(0, 0, this._options.SQUARE_SIZE, this._options.SQUARE_SIZE, this._options.SQUARE_RADIUS).fill({color: 0x6b7280}),
        }
    }
}