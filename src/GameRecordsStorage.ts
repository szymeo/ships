import Dexie, {PromiseExtended, Table} from 'dexie';
import {DateTime} from 'luxon';
import {WithId} from "./models";

interface AddRecordDTO {
    data: {
        me: [string, string][];
        opponent: [string, string][];
    }
}

export type GameRecord = {
    data: {
        me: [string, string][];
        opponent: [string, string][];
    }
    createdAt: string;
}

export class GameRecordsStorage extends Dexie {
    records!: Table<WithId<GameRecord>>;

    private static _instance: GameRecordsStorage;

    private constructor() {
        super('com.szymeo.ships-game');

        this.version(1).stores({
            records: '++id, createdAt'
        });
    }

    static init(): void {
        this._instance = new GameRecordsStorage();
    }

    static getRecords(): PromiseExtended<WithId<GameRecord>[]> {
        return this._instance.records.toArray();
    }

    static addRecord(dto: AddRecordDTO) {
        return this._instance.records.add({
            data: dto.data,
            createdAt: DateTime.now().toISODate({ format: 'basic' }),
        } as WithId<GameRecord>);
    }

    static deleteRecord(id: WithId<GameRecord>['id']) {
        return this._instance.records.delete(id);
    }
}
