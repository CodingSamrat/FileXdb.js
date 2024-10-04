// ----------------------------------------------------------
// Name         : database
// Author       : Sam (Coding Samrat)
// Description  : ...
// ----------------------------------------------------------

import Collection from './collection.js';
import { Handler } from './fileIO.js';
const fxColName = '_fx';

export default class Database {
    private _handler: Handler;
    private _database: Promise<any>;

    constructor(dbName: string = 'filex.db') {
        this._handler = new Handler(dbName);
        this._database = this._show();

        // plugins ---------------
        prettify();
    }

    /**
     * Create a new collection 
     * @param {string} colName 
     * @returns {Promise<Collection>} Collection
     */
    async collection(colName: string): Promise<Collection> {
        colName = colName.toLowerCase();
        if (colName === fxColName) {
            throw new Error(`invalid collection name - ${fxColName}`);
        }
        return new Collection(colName, this._handler);
    }

    /**
     * List all collections of the database
     * @returns {Promise<string[]>} list of collection names
     */
    async listCollection(): Promise<string[]> {
        const database = await this._database!;
        let collections: string[] = [];

        for (let i = 0; i < Object.keys(database).length; i++) {
            const coll = Object.keys(database)[i];
            if (coll === fxColName) continue;
            collections.push(coll);
        }

        return collections;
    }

    private async _show(): Promise<any> {
        this._database = this._handler!.read();
        return this._database;
    }
}

// plugins ---------------
function prettify() {
    Object.defineProperty(Object.prototype, 'prettify', {
        value: function () {
            return JSON.stringify(this, null, 2);
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}
