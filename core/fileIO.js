
import { BSON } from 'bson';
import fs from 'fs'
import path from 'path'



export async function writeJson(fileName, data) {
    const jsonData = JSON.stringify(data)
    await fs.writeFileSync(fileName, jsonData);
}

export async function readJson(fileName) {
    const data = await fs.readFileSync(fileName)
    const parsedData = await JSON.parse(data)
    return parsedData
}




export class Handler {
    constructor(dbName) {

        this.dbName = dbName;

        (async () => (
            await createFile(this.dbName)
        ))()
    }




    /**
     * Write  the database to local file
     * @param {Map} data 
     */
    async write(data) {
        try {
            fs.writeFileSync(this.dbName, BSON.serialize(data));

        } catch (err) {
            console.error(`Error writing to Database: ${err.message}`);
        }
    }



    /**
     * Read the database from local file
     * @returns database
     */
    async read() {
        try {
            // Read the BSON data from the file
            const fileData = fs.readFileSync(this.dbName);
            const data = BSON.deserialize(fileData)

            return data;
        } catch (err) {
            console.error(`Error reading from Database: ${err.message}`);
            throw err;
        }
    }

}





/**
 * Create new file (database) 
 * @param {*} file 
 * @returns 
 */
function createFile(file) {

    // Early return if the file already exists
    if (fs.existsSync(file)) return;

    // const fileName = pathArray[pathArray.length - 1]
    const dirName = path.dirname(file)

    // console.log('object', fs.existsSync(dirName))


    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }


    // Create an empty file at FilePath
    try {
        // Create an empty BSON file using BSON.serialize
        const serializedData = BSON.serialize({});

        // Write to the file
        fs.writeFileSync(file, serializedData);
    } catch (err) {
        console.error(`Error creating Database: ${err.message}`);
    }
}
