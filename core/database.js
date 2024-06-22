// ----------------------------------------------------------
// Name         : database
// Author       : Sam (Coding Samrat)
// Description  : ...
// ----------------------------------------------------------


import Collection from './collection.js';
import { Handler } from './fileIO.js';
import { prettify } from '../helpers/plugins.js'
const fxColName = '_fx'



export default class Database {
    #_handler = null
    #_database = null
    constructor(dbName = 'filex.db') {
        this.#_handler = new Handler(dbName);
        this.#_database = this.#_show();


        // plugins ---------------
        prettify()
    }



    /**
     * Create new collection 
     * @param {String} colName 
     * @returns Collection
     */
    async collection(colName) {
        colName = colName.toLowerCase()
        if (colName === fxColName) {
            throw new Error(`invalid collection name - ${fxColName} `)
        }
        return new Collection(colName, this.#_handler);
    }



    /**
     * List all collection of the database
     * @returns list of collection name
     */
    async listCollection() {
        const database = await this.#_database
        let collections = []
        for (let i = 0; i < Object.keys(database).length; i++) {
            const coll = Object.keys(database)[i];

            if (coll === fxColName) continue

            collections.push(coll)
        }

        return collections
    }


    async #_show() {
        this.#_database = this.#_handler.read();
        return this.#_database;
    }
}

