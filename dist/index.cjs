"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// src/collection.ts
var import_bson2 = require("bson");

// src/fileIO.ts
var import_bson = require("bson");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
async function writeJson(fileName, data) {
  const jsonData = JSON.stringify(data);
  await import_fs.default.writeFileSync(fileName, jsonData);
}
var Handler = class {
  _dbName;
  constructor(dbName) {
    this._dbName = dbName;
    createFile(this._dbName);
  }
  /**
   * Write the database to local file
   * @param {Map<any, any>} data 
   */
  async write(data) {
    try {
      import_fs.default.writeFileSync(this._dbName, import_bson.BSON.serialize(data));
    } catch (err) {
      console.error(`Error writing to Database: ${err.message}`);
    }
  }
  /**
   * Read the database from local file
   * @returns {Promise<Map<any, any>>} database
   */
  async read() {
    try {
      const fileData = import_fs.default.readFileSync(this._dbName);
      const data = import_bson.BSON.deserialize(fileData);
      return data;
    } catch (err) {
      console.error(`Error reading from Database: ${err.message}`);
      throw err;
    }
  }
};
async function createFile(file) {
  if (import_fs.default.existsSync(file)) return;
  const dirName = import_path.default.dirname(file);
  if (!import_fs.default.existsSync(dirName)) {
    import_fs.default.mkdirSync(dirName, { recursive: true });
  }
  try {
    const serializedData = import_bson.BSON.serialize({});
    import_fs.default.writeFileSync(file, serializedData);
  } catch (err) {
    console.error(`Error creating Database: ${err.message}`);
  }
}

// src/collection.ts
var Collection = class {
  #_database = null;
  #_collection = null;
  #_handler = null;
  #_colName = "";
  constructor(colName, handler) {
    this.#_colName = colName.toLowerCase();
    this.#_handler = handler;
    this.#_database = this.#_getDatabase();
    this.#_collection = this.#_getCollection();
  }
  // -------------------------------------------------------------------
  /**
   * Insert a single document to the collection
   * @param {Record<string, any>} document - The document to insert.
   * @returns {Promise<Record<string, any>>} - Returns the inserted document.
   */
  async insertOne(document) {
    this.#_database = await this.#_getDatabase();
    let _document = {};
    if (!document) {
      throw new Error("Query can't be null");
    }
    if (typeof document !== "object" || Array.isArray(document)) {
      throw new Error("Invalid Document");
    }
    if (document.hasOwnProperty("_id")) {
      if (await this.#_docExists(document._id)) {
        throw new Error(`A document with id \`${document._id}\` already exists`);
      }
      _document = document;
    } else {
      _document = {
        _id: new import_bson2.ObjectId(),
        ...document
      };
    }
    const _col = await this.#_collection;
    _col.push(_document);
    this.#_database.set(this.#_colName, _col);
    await this.#_handler.write(this.#_database);
    return _document;
  }
  // -------------------------------------------------------------------
  async #_getDatabase() {
    return this.#_handler.read();
  }
  async #_getCollection() {
    const database = await this.#_database;
    if (database.hasOwnProperty(this.#_colName)) {
      return database[this.#_colName];
    } else {
      database[this.#_colName] = [];
      return [];
    }
  }
  async #_docExists(docId) {
    const collection = await this.#_collection;
    return collection.some((doc) => doc._id.toString() === docId.toString());
  }
  #_matchesQuery(doc, query) {
    return Object.entries(query).every(([key, value]) => {
      if (key === "_id") {
        return doc[key].toString() === value.toString();
      }
      return doc[key] === value;
    });
  }
  async #_updateCollection(value) {
    this.#_collection = Promise.resolve(value);
    const database = await this.#_handler.read();
    database.set([this.#_colName], value);
    await writeJson(this.#_handler._dbName, database);
  }
};

// src/database.ts
var fxColName = "_fx";
var Database = class {
  _handler;
  _database;
  constructor(dbName = "filex.db") {
    this._handler = new Handler(dbName);
    this._database = this._show();
    prettify();
  }
  /**
   * Create a new collection 
   * @param {string} colName 
   * @returns {Promise<Collection>} Collection
   */
  async collection(colName) {
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
  async listCollection() {
    const database = await this._database;
    let collections = [];
    for (let i = 0; i < Object.keys(database).length; i++) {
      const coll = Object.keys(database)[i];
      if (coll === fxColName) continue;
      collections.push(coll);
    }
    return collections;
  }
  async _show() {
    this._database = this._handler.read();
    return this._database;
  }
};
function prettify() {
  Object.defineProperty(Object.prototype, "prettify", {
    value: function() {
      return JSON.stringify(this, null, 2);
    },
    writable: true,
    configurable: true,
    enumerable: false
  });
}

// src/index.ts
var src_default = Database;
