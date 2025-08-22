import { Router } from "express";
import { z } from "zod";
import { ID } from "../utils.js";
import { getDb } from "../db.js";

export const router = Router();

router.get("/", async (req, res) => {
    let limit = typeof req.query.limit === "string" ? parseInt(req.query.limit) || 50 : 50;
    let offset = typeof req.query.offset === "string" ? parseInt(req.query.offset) || 0 : 0;

    const db = await getDb();
    const result = await db.all<{ id: string, name: string }[]>("SELECT id, name FROM branches ORDER BY branch_id DESC LIMIT ? OFFSET ?", limit, offset);

    res.send(result);
});

router.get("/:branch_id", async (req, res) => {
    ID.assertKind(req.params.branch_id, "branch");

    const db = await getDb();
    const result = await db.get<{ id: string, name: string }>(
        "SELECT id, name FROM branches WHERE id = :branch_id",
        { ":branch_id": req.params.branch_id }
    );

    if (result) {
        res.send(result);
    } else {
        res.status(404).send();
    }
});

router.post("/", async (req, res) => {
    const bodySchema = z.object({
        name: z.string(),
    });

    const body = bodySchema.parse(req.body);

    const id = ID.newId("branch");

    const db = await getDb();
    await db.run("INSERT INTO branches (id, name) VALUES (:id, :name)", {
        ":id": id,
        ":name": body.name,
    })

    res.send(id);
});