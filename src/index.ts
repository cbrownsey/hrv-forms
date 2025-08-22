import argon2 from "argon2";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import { customAlphabet } from "nanoid";
import { nolookalikesSafe } from "nanoid-dictionary";
import { z } from "zod";

import { ID } from "./utils.js"
import { getDb } from "./db.js"
import { router as branchRouter } from "./routers/branch.js";



const FORMS = Object.freeze({
    VENTILATION_SERVICE: "form_mdnjkwMjpNKTfL",
    HEATPUMP_SERVICE: "form_nHtc6dgCmJtCLc",
});

const user_codes = new Map<string, string>();

class SessionStore {
    static readonly duration = 18 /* hours */ * 60 * 60 * 100;

    sessions: Map<string, { id: string, created: Date }>;

    constructor() {
        this.sessions = new Map();
    }

    get(session_id: string): string | null {
        ID.assertKind(session_id, "session");

        let session = this.sessions.get(session_id);
        if (!session) {
            return null;
        } else {
            return session.id;
        }
    }

    destroy(session_id: string) { }

    create(user_id: string, expires?: number): string {
        ID.assertKind(user_id, "user");

        let session_id = ID.newId("session");

        this.sessions.set(session_id, {
            id: user_id,
            created: new Date(),
        })

        return session_id;
    }
}

const sessions = new SessionStore();

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());

app.get('/', async (_req, res) => {
    res.send('OK');
});

app.use('/branch', branchRouter);

app.post('/login', async (req, res) => {
    const BODY_SCHEMA = z.object({
        email: z.email(),
        password: z.string(),
    });

    let body = BODY_SCHEMA.parse(req.body);

    const db = await getDb();
    let user = await db.get("SELECT user_id, id, password FROM users WHERE email = ?", body.email);

    console.log(user);

    if (!user) {
        res.status(500).send("not implemented")
    } else {
        if (user.password == null) {
            let session_id = sessions.create(user.id);
            res.cookie("user_session", session_id, {
                maxAge: SessionStore.duration,
            });
            let hashed = await argon2.hash(body.password);
            await db.run('UPDATE users SET password = ? WHERE user_id = ?', hashed, user.user_id);

            res.send(session_id);
        } else {
            if (await argon2.verify(user.password, body.password)) {
                let session_id = sessions.create(user.id);
                res.cookie("user_session", session_id, {
                    maxAge: SessionStore.duration,
                });
                res.send(session_id);
            } else {
                res.status(401).send();
            }
        }
    }
});

app.get('/user/me', async (req, res) => {
    console.log(sessions.sessions);
    let session_id = req.cookies.session_id;
    console.log(session_id);
    if (typeof session_id == "string") {
        let user_id = sessions.get(session_id);
        if (user_id) {
            const db = await getDb();
            let response = await db.all('SELECT id, name, email FROM users WHERE id = ?', user_id);

            if (response !== undefined) {
                res.send(response);
            }
        }
    }

    res.status(404).send();
})

app.get('/users', async (req, res) => {
    const QUERY_SCHEMA = z.object({
        limit: z.string().optional(),
        offset: z.string().optional(),
    });

    const query = QUERY_SCHEMA.safeParse(req.query);

    if (!query.success) {
        res.status(500).send();
        return;
    }

    const limit = query.data.limit ? Number.parseInt(query.data.limit) || -1 : 50;
    const offset = query.data.offset ? Number.parseInt(query.data.offset) || -1 : -1;

    const db = await getDb();
    let response = await db.all(`SELECT id, name, email, password FROM users ORDER BY user_id DESC LIMIT ? OFFSET ?`, limit, offset);

    response = response.map(({ id, name, email, password }) => {
        return { id, name, email, is_activated: password != null };
    });

    res.send(response);
})

app.post('/user', async (req, res) => {
    const BODY_SCHEMA = z.object({
        name: z.string().nonempty(),
        email: z.email(),
    });

    let body = BODY_SCHEMA.safeParse(req.body);

    if (!body.success) {
        res.status(500).send();
        return;
    }

    let { name, email } = body.data;

    let user_id = ID.newId("user");

    const db = await getDb();
    let x = await db.get('INSERT INTO users VALUES (null, ?, ?, ?, null)', user_id, name, email);

    res.send(user_id);
})

app.get('/user/:user_id', async (req, res) => {
    const db = await getDb();
    let response = await db.get(`SELECT id, name, email, password FROM users WHERE id = ?;`, req.params.user_id);

    if (!response) {
        res.status(404).json({
            "message": "No user with that ID exists."
        });
    } else {
        response.activated = response.password != null;
        delete response.password;

        res.json({
            id: response.id,
            name: response.name,

        }).send();
    }
});

app.get('/responses', async (req, res) => {
    const db = await getDb();
    if (req.query.user_id == undefined) {
        let response = await db.all('SELECT responses.id, users.id as user_id, form_data, submitted FROM responses JOIN users USING (user_id) ORDER BY submitted DESC');
        res.json(response);
    } else if (typeof req.query.user_id === "string") {
        let response = await db.all('SELECT responses.id, users.id as user_id, form_data, submitted FROM responses JOIN users USING (user_id) WHERE users.id = ? ORDER BY submitted DESC', req.query.user_id);
        res.json(response);
    } else {
        res.status(500).send();
    }
});

app.post('/response', async (req, res) => {
    const BODY_SCHEMA = z.object({
        user_id: z.string().startsWith('user_'),
        to_form: z.string().startsWith('form_'),
        form_data: z.json(),
    });

    let body = BODY_SCHEMA.safeParse(req.body);

    if (body.success) {
        const db = await getDb();
        let id = ID.newId("response");
        let user = await db.get('SELECT user_id AS id FROM users WHERE id = ?', body.data.user_id);

        const result = db.run('INSERT INTO responses (id, form_data, user_id) VALUES (?, ?, ?)', id, JSON.stringify(body.data.form_data), user.id);

        res.send(id);
    } else {
        res.status(500).send();
    }
})

app.get('/forms', (_req, res) => {
    res.send([
        {
            id: FORMS.HEATPUMP_SERVICE,
            name: "Heatpump Service",
        },
        {
            id: FORMS.VENTILATION_SERVICE,
            name: "Ventilation Service",
        }
    ])
});

app.listen(8080, async (err) => {
    (await getDb()).migrate()

    if (err == null) {
        console.log("Listening on port 8080.");
    } else {
        console.log(err);
    }
})