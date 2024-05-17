export enum BoardMember {
    EMPTY = 'empty',
    SHIP = 'ship',
    HIT = 'hit',
    HIT_SHIP = 'hit_ship',
    HIT_FORBIDDEN = 'hit_forbidden',
    FORBIDDEN = 'forbidden',
}

export type BoardOptions = {
    BOARD_SIZE: number;
    SQUARE_SIZE: number;
    GRID_GAP: number;
    SQUARE_RADIUS: number;
    SHIP_SIZE: number;
    MARKING_MAP: Partial<Record<BoardMember, BoardMember>>;
}

export enum BoardStage {
    DISABLED = 'disabled',
    PLACEMENT = 'placement',
    MARKING = 'marking',
}

export type WithId<T> = T & { id: number };
