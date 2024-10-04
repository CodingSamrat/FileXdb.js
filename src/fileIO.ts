import { BSON } from 'bson';
import fs from 'fs';
import path from 'path';


// Utility functions to handle JSON files
export async function writeJson(fileName: string, data: any): Promise<void> {
    const jsonData = JSON.stringify(data);
    await fs.writeFileSync(fileName, jsonData);
}

export async function readJson(fileName: string): Promise<any> {
    const data = await fs.readFileSync(fileName, 'utf-8');
    const parsedData = await JSON.parse(data);
    return parsedData;
}


// Handler class for BSON database operations
export class Handler {
    _dbName: string;

    constructor(dbName: string) {
        this._dbName = dbName;

        // Immediately create the database file asynchronously
        createFile(this._dbName);

    }

    /**
     * Write the database to local file
     * @param {Map<any, any>} data 
     */
    async write(data: Map<any, any>): Promise<void> {
        try {
            fs.writeFileSync(this._dbName, BSON.serialize(data));
        } catch (err: any) {
            console.error(`Error writing to Database: ${err.message}`);
        }
    }

    /**
     * Read the database from local file
     * @returns {Promise<Map<any, any>>} database
     */
    async read(): Promise<Map<any, any>> {
        try {
            // Read the BSON data from the file
            const fileData = fs.readFileSync(this._dbName);
            const data = BSON.deserialize(fileData) as Map<any, any>;

            return data;
        } catch (err: any) {
            console.error(`Error reading from Database: ${err.message}`);
            throw err;
        }
    }
}


/**
 * Create a new file (database) 
 * @param {string} file 
 * @returns {Promise<void>}
 */
async function createFile(file: string): Promise<void> {
    // Early return if the file already exists
    if (fs.existsSync(file)) return;

    const dirName = path.dirname(file);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    // Create an empty file with serialized BSON data
    try {
        const serializedData = BSON.serialize({});

        // Write the empty BSON file to the disk
        fs.writeFileSync(file, serializedData);
    } catch (err: any) {
        console.error(`Error creating Database: ${err.message}`);
    }
}
