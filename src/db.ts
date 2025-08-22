import { customAlphabet } from "nanoid";
import { nolookalikesSafe } from "nanoid-dictionary";
import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import { ID } from "./utils.js";

export async function getDb(): Promise<Database> {
    return await open({
        filename: "./database.db",
        driver: sqlite3.cached.Database,
    })
}

export class Branch {
    branch_id: number | undefined;
    id: string | undefined;
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    async fetchOne(id: string): Promise<Branch | undefined> {
        const db = await getDb();
        let result = await db.get<{ name: string }>("SELECT branch_id, id, name FROM branches WHERE id = ?", id);

        if (result) {
            let branch = new Branch(result.name);
            branch.id = id;
        } else {
            return;
        }
    }

    async save() {
        const db = await getDb();
        if (this.branch_id === undefined) {
            const id = ID.newId("branch");
            let result = await db.get<{ branch_id: number }>("INSERT INTO branches (id, name) VALUES (?, ?) RETURNING branch_id", this.id, this.name);

            if (result) {
                this.branch_id = result.branch_id;
            }
        } else {
            await db.run("UPDATE branches SET name = ? WHERE branch_id = ?", this.name, this.branch_id);
        }
    }
}