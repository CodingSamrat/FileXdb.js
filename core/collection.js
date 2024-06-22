// ----------------------------------------------------------
// Name         : collection
// Author       : Sam (Coding Samrat)
// Description  : ...
// ----------------------------------------------------------

import { ObjectId } from 'bson'
import { readJson, writeJson } from './fileIO.js'

export default class Collection {
    #_database = null
    #_collection = null
    #_handler = null
    #_colName = ''

    constructor(colName, handler) {
        this.#_colName = colName.toLowerCase()
        this.#_handler = handler

        this.#_database = this.#_getDatabase()

        // Initiating Collection
        this.#_collection = this.#_getCollection()
    }





    /**
     *  Find documents of collection
     * @param {Map} query 
     * @param {Map} option 
     * @returns {Map} collections
     */
    async find(query = null, option = {}) {
        let limit = option?.limit
        let result = []


        // Ensure the query is an object
        if (query && (typeof query !== 'object' || Array.isArray(query))) {
            throw new Error('Invalid query')
        }

        // Ensure the limit is an Array
        if (limit && (!Array.isArray(limit) || limit.length !== 2)) {
            throw new Error('Invalid limit parameter')
        }

        let [limitStart, limitEnd] = [0, 0]
        if (limit) {
            [limitStart, limitEnd] = limit

            if (limitStart > limitEnd) {
                throw new Error("limit[0] must be less than limit[1]")
            }
        }


        if (!query) {
            result = limit ? this.#_collection.slice(limitStart, limitEnd) : this.#_collection
        } else {
            for (const doc of await this.#_collection) {
                if (this.#_matchesQuery(doc, query)) {
                    result.push(doc)

                    if (limit && result.length >= limitEnd) {
                        break
                    }
                }
            }
        }
        return result
    }



    /**
     * Find a single document of collection
     * @param {Map} query 
     * @returns document
     */
    async findOne(query) {
        let result = {}
        // Early return if no query
        if (!query) {
            throw new Error('Query cann\'t be null')
        }

        // Ensure the query is an object
        if (query && (typeof query !== 'object' || Array.isArray(query))) {
            throw new Error('Invalid query')
        }


        for (const doc of await this.#_collection) {
            if (this.#_matchesQuery(doc, query)) {
                result = doc
                break
            }
        }

        return result
    }



    /**
     * 
     * @param {ObjectId | String | Number} _id 
     * @returns 
     */
    async findById(_id) {
        for (const doc of await this.#_collection) {
            if (doc._id.toString() === _id.toString()) {
                return doc
            }
        }
    }



    /**
     * Insert a single document to the collection
     * @param {Map} document 
     * @returns document
     */
    async insertOne(document) {
        let _document = {}
        // Early return if no query
        if (!document) {
            throw new Error('Query cann\'t be null')
        }


        // Ensure the document is an object
        if (typeof document !== 'object' || Array.isArray(document)) {
            throw new Error('Invalid Document')
        }

        // console.log(document.hasOwnProperty("_id"))
        // Check if the document has key "_id"
        if (document.hasOwnProperty("_id")) {

            // Check if the document already exists
            if (await this.#_docExists(document._id)) {
                throw new Error(`A document with id \`${document._id}\` is already exists`)
            }

            _document = document
        } else {

            _document = {
                _id: new ObjectId(),
                ...document
            }
        }

        // Push document to the database
        const _col = await this.#_collection
        _col.push(_document)
        this.#_database[this.#_colName] = _col // Update database


        // Write to the database
        await this.#_handler.write(await this.#_database)


        return _document
    }




    /**
     * 
     * @param {[Map]} documents 
     * @returns 
     */
    async insertMany(documents) {
        const _col = await this.#_collection
        let docIds = []

        for (let i = 0; i < documents.length; i++) {
            const document = documents[i]

            // Ensure the document is an object
            if (typeof document !== 'object' || Array.isArray(document)) {
                throw new Error('Invalid Document')
            }


            // ...
            let _document = {}

            // Check if the document has key "_id"
            if (document.hasOwnProperty("_id")) {

                // Check if the document already exists
                if (await this.#_docExists(document._id)) {
                    throw new Error(`A document with id \`${document._id}\` is already exists`)
                }

                _document = document
            } else {

                _document = {
                    _id: new ObjectId(),
                    ...document
                }
            }


            // Push document to the database
            _col.push(_document)


            // Push docIds
            docIds.push(_document._id)
        }


        // Write to the database
        this.#_database[this.#_colName] = _col // Update database
        await this.#_handler.write(await this.#_database)


        return docIds
    }



    /**
     * Delete only the first match document. 
     * @param {Map} query 
     * @returns document id
     */
    async deleteOne(query) {

        // Early return if no query
        if (!query) {
            throw new Error('Query cann\'t be null')
        }
        // Get full collection
        let coll = await this.#_collection


        // Ensure the query is an object
        if (query && (typeof query !== 'object' || Array.isArray(query))) {
            throw new Error('Invalid query')
        }


        for (let i = 0; i < (await this.#_collection).length; i++) {
            const document = (await this.#_collection)[i]

            if (this.#_matchesQuery(document, query)) {
                coll.splice(i, 1)


                this.#_updateCollection(coll)

                // Write the database
                await this.#_handler.write(await this.#_database)

                return document
            }
        }

    }



    /**
     * Delete all document matches the query
     * @param {Map} query 
     * @returns list of ObjectIds
     */
    async deleteMany(query) {
        let deletedDocIds = []
        let coll = []


        if (query) {
            // Ensure the query is an object
            if (query && (typeof query !== 'object' || Array.isArray(query))) {
                throw new Error('Invalid query')
            }


            for (let i = 0; i < (await this.#_collection).length; i++) {
                const document = (await this.#_collection)[i]

                if (this.#_matchesQuery(document, query)) {
                    deletedDocIds.push(document._id)
                    continue
                } else {
                    coll.push(document)
                }
            }

            this.#_updateCollection(coll)

        } else {
            deletedDocIds = (await this.#_collection).map(obj => obj._id);
            this.#_updateCollection([])
        }

        // Write the database
        await this.#_handler.write(await this.#_database)

        return deletedDocIds
    }



    /**
     * 
     * @param {ObjectId} _id 
     * @returns deleted document
     */
    async findByIdAndDelete(_id) {
        // Early return if no query
        if (!_id) {
            throw new Error('Id is required')
        }

        // Query
        const query = { _id }
        return await this.deleteOne(query)
    }




    /**
     * Update the first match document
     * @param {Map} query 
     * @param {Map} payload 
     * @param {Map} option 
     * @returns updated document
     */
    async updateOne(query, payload, option = {}) {
        const hasQuery = Object.keys(query).length > 0
        let coll = await this.#_collection

        if (!hasQuery) {
            throw new Error('Query is required')
        }


        // Ensure the query is an object
        if (query && (typeof query !== 'object' || Array.isArray(query))) {
            throw new Error('Invalid query')
        }

        // Ensure the query is an object
        if (payload && (typeof payload !== 'object' || Array.isArray(payload))) {
            throw new Error('Invalid query')
        }



        for (let i = 0; i < coll.length; i++) {
            const document = coll[i];
            if (this.#_matchesQuery(document, query)) {

                const newDocument = {
                    ...document,
                    ...payload
                }

                coll[i] = newDocument

                await this.#_handler.write(await this.#_database)

                if (option?.new) {
                    console.log('new')
                    return newDocument
                } else {
                    console.log('old')
                    return document
                }
            }
        }
    }



    /**
    * Update the all matches documents
    * @param {Map} query 
    * @param {Map} payload 
    * @param {Map} option 
    * @returns updated documents id
    */
    async updateMany(query, payload, option = {}) {
        let docIds = []
        const hasQuery = Object.keys(query).length > 0
        let coll = await this.#_collection


        // Ensure the query is an object
        if (query && (typeof query !== 'object' || Array.isArray(query))) {
            throw new Error('Invalid query')
        }

        // Ensure the query is an object
        if (payload && (typeof payload !== 'object' || Array.isArray(payload))) {
            throw new Error('Invalid query')
        }


        // Loop through all collection
        for (let i = 0; i < coll.length; i++) {
            const document = coll[i];

            if (hasQuery) {
                if (this.#_matchesQuery(document, query)) {

                    const newDocument = {
                        ...document,
                        ...payload
                    }

                    coll[i] = newDocument
                    docIds.push(document._id)
                }
            }
            else {
                const newDocument = {
                    ...document,
                    ...payload
                }

                coll[i] = newDocument
                docIds.push(document._id)
            }

        }

        await this.#_handler.write(await this.#_database)
        return docIds
    }



    /**
     * Update the  document matches by _id 
     * @param {ObjectId} _id 
     * @param {Map} payload 
     * @param {Map} option 
     * @returns updated document
     */
    async findByIdAndUpdate(_id, payload, option = {}) {
        let coll = await this.#_collection


        if (!_id || !payload) {
            throw new Error('All args are required')
        }

        // Ensure the query is an object
        if (payload && (typeof payload !== 'object' || Array.isArray(payload))) {
            throw new Error('Invalid query')
        }

        // Ensure the query is an object
        if (option && (typeof option !== 'object' || Array.isArray(option))) {
            throw new Error('Invalid query')
        }


        for (let i = 0; i < coll.length; i++) {
            const document = coll[i];
            if (this.#_matchesQuery(document, { _id })) {

                const newDocument = {
                    ...document,
                    ...payload
                }

                coll[i] = newDocument

                await this.#_handler.write(await this.#_database)

                if (option?.new) {
                    console.log('new')
                    return newDocument
                } else {
                    console.log('old')
                    return document
                }
            }
        }
    }



    /**
     * Export the collection as JSON
     * @param {String} filename
     */
    async export(filename = '') {
        const coll = await this.#_collection
        filename = filename === '' ? `${this.#_colName}.json` : filename
        const payload = {}
        payload[this.#_colName] = coll
        await writeJson(filename, payload)
    }



    /**
     * Import the collection as JSON
     * @param {String} filename
     */
    async #import(filename) {
        let coll = await this.#_collection

        let data = await readJson(filename)
        data = data[this.#_colName]


        coll = [
            ...coll,
            ...data
        ];

        this.#_collection = coll;
        this.#_database[this.#_colName] = coll

        await this.#_handler.write(this.#_database) // don't use await

    }



    /**
     * Rename the collection
     * @param {String} newName 
     * @returns new name
     */
    async rename(newName) {
        let coll = await this.#_collection

        // Check if collection is empty or not
        if (coll.length > 0) {
            (await this.#_database)[newName] = coll;

            delete (await this.#_database)[this.#_colName]
        }


        await this.#_handler.write(await this.#_database)

        return newName
    }



    /**
     * Drop or Delete the collection from database
     */
    async drop() {

        delete (await this.#_database)[this.#_colName]

        await this.#_handler.write(await this.#_database)

    }



    /**
     * 
     * @returns length of collection
     */
    async count() {
        // console.log(await this.#_database)
        return (await this.#_collection).length
    }


    // -------------------------------------------------------------------
    async #_getDatabase() {
        // console.log(await this.#_handler.read())
        return this.#_handler.read()
    }

    async #_getCollection() {
        if ((await this.#_database).hasOwnProperty(this.#_colName)) {
            return (await this.#_database)[this.#_colName]
        } else {
            (await this.#_database)[this.#_colName] = Array()
            return Array()
        }
    }

    async #_docExists(docId) {
        return (await this.#_collection).some(doc => doc._id === docId)
    }

    #_matchesQuery(doc, query) {
        // console.log(doc, query)
        return Object.entries(query).every(([key, value]) => {
            if (key === '_id') {
                // If the key is _id, compare it after converting it to string
                return doc[key].toString() === value.toString();
            }
            return doc[key] === value;
        });
    }
    #_updateCollection(value) {
        // Update collection
        this.#_collection = value

        // Update database
        this.#_handler.read()[this.#_colName] = value
    }
}


