import { Router } from "express";
import {pingDB} from "../../common/knex/knex.js";

export const healthRouter = Router();

healthRouter.get("/", async (req, res) => {
    try {
        await pingDB();
        res.status(200).send("OK");
    } catch (error) {
        res.status(500).send({
            message: "Database connection failed",
        });
    }
});