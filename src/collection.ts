// ----------------------------------------------------------
// Name         : collection
// Author       : Sam (Coding Samrat)
// Description  : ...
// ----------------------------------------------------------

import { ObjectId } from 'bson';
import { readJson, writeJson } from './fileIO';
import { Handler } from './fileIO';

interface Document {
    _id: ObjectId;
    [key: string]: any;
}

export default class Collection {
    #_database: Promise<Record<string, any>> | null = null;
    #_collection: Promise<Document[]> | null = null;
    #_handler: Handler | null = null;
    #_colName: string = '';

    constructor(colName: string, handler: Handler) {
        this.#_colName = colName.toLowerCase();
        this.#_handler = handler;

        this.#_database = this.#_getDatabase();

        // Initiating Collection
        this.#_collection = this.#_getCollection();
    }




    // -------------------------------------------------------------------

    /**
     * Insert a single document to the collection
     * @param {Record<string, any>} document - The document to insert.
     * @returns {Promise<Record<string, any>>} - Returns the inserted document.
     */
    async insertOne(document: Record<string, any>): Promise<Record<string, any>> {
        this.#_database = await this.#_getDatabase();
        let _document: Record<string, any> = {};

        // Early return if no query
        if (!document) {
            throw new Error("Query can't be null");
        }

        // Ensure the document is an object
        if (typeof document !== 'object' || Array.isArray(document)) {
            throw new Error('Invalid Document');
        }

        // Check if the document has key "_id"
        if (document.hasOwnProperty("_id")) {
            // Check if the document already exists
            if (await this.#_docExists(document._id)) {
                throw new Error(`A document with id \`${document._id}\` already exists`);
            }

            _document = document;
        } else {
            // Add a new ObjectId if "_id" is not provided
            _document = {
                _id: new ObjectId(),
                ...document
            };
        }

        // Push document to the database
        const _col = await this.#_collection;
        _col.push(_document);

        // Update the database with the new collection
        this.#_database.set(this.#_colName, _col);

        // Write to the database
        await this.#_handler.write(this.#_database);

        return _document;
    }




    // -------------------------------------------------------------------
    async #_getDatabase(): Promise<Record<string, any>> {
        // Return the database from the handler
        return this.#_handler!.read();
    }

    async #_getCollection(): Promise<Document[]> {
        const database = await this.#_database!;

        if (database.hasOwnProperty(this.#_colName)) {
            return database[this.#_colName];
        } else {
            database[this.#_colName] = [];
            return [];
        }
    }

    async #_docExists(docId: ObjectId): Promise<boolean> {
        const collection = await this.#_collection!;
        return collection.some((doc: Document) => doc._id.toString() === docId.toString());
    }

    #_matchesQuery(doc: Document, query: Partial<Document>): boolean {
        return Object.entries(query).every(([key, value]) => {
            if (key === '_id') {
                // If the key is _id, compare it after converting it to string
                return doc[key].toString() === value.toString();
            }
            return doc[key] === value;
        });
    }


    async #_updateCollection(value: Document[]): Promise<void> {
        // Update the collection
        this.#_collection = Promise.resolve(value);

        // Update the database
        const database = await this.#_handler!.read();
        database.set([this.#_colName], value);
        await writeJson(this.#_handler!._dbName, database);
    }
}
