import "reflect-metadata";
import knex from "knex";
import { describe, expect, it } from "vitest";
import { validateQuery } from "../../validation/validate";
import { ValidationError } from "../../validation/validation.error";
import { ListRestaurantsQueryDTO } from "../../../app/restaurant/dto/restaurant.query.dto";
import {
    applyCursorPagination,
    buildPaginationResult,
    decodeCursor,
} from "./cursor-pagination";

const db = knex({ client: "pg" });
const issue = (payload: unknown) =>
    Buffer.from(JSON.stringify(payload)).toString("base64");

describe("decodeCursor", () => {
    it("round-trips cursors issued by buildPaginationResult", () => {
        const rows = [
            { id: 1, name: "B" },
            { id: 2, name: "A" },
            { id: 3, name: "C" },
        ];
        const { meta } = buildPaginationResult(rows, 2, "name");
        expect(meta.nextCursor).not.toBeNull();
        expect(decodeCursor(meta.nextCursor)).toEqual({ id: 2, value: "A" });
    });

    it("treats missing/empty cursor as no cursor", () => {
        expect(decodeCursor(undefined)).toBeUndefined();
        expect(decodeCursor("")).toBeUndefined();
    });

    it.each([
        ["non-string", 123],
        ["bad base64", "!!!not-base64!!!"],
        ["bad JSON", Buffer.from("hello").toString("base64")],
        ["JSON array", issue([1, 2])],
        ["missing id", issue({ value: "A" })],
        ["missing value", issue({ id: 1 })],
        ["object id", issue({ id: {}, value: "A" })],
        ["null value", issue({ id: 1, value: null })],
    ])("rejects %s with 400", (_label, raw) => {
        try {
            decodeCursor(raw);
            expect.unreachable("should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationError);
            expect((err as ValidationError).statusCode).toBe(400);
        }
    });
});

describe("applyCursorPagination", () => {
    const params = (cursor?: { id: number; value: string }, sortOrder: "asc" | "desc" = "asc") => ({
        cursor,
        limit: 2,
        sortBy: "name",
        sortOrder,
    });

    it("asc: filters strictly after (value, id) with id tie-breaker", () => {
        const q = applyCursorPagination(db("restaurants").select("*"), params({ id: 2, value: "A" }));
        const { sql, bindings } = q.toSQL();
        expect(sql).toContain('"name" > ?');
        expect(sql).toContain('"name" = ?');
        expect(sql).toContain('"id" > ?');
        expect(bindings).toEqual(["A", "A", 2, 3]); // where x3 + limit + 1
        expect(sql).toContain('order by "name" asc, "id" asc');
    });

    it("desc: flips the sort comparison but keeps the id tie-breaker ascending", () => {
        const q = applyCursorPagination(db("restaurants").select("*"), params({ id: 2, value: "A" }, "desc"));
        const { sql, bindings } = q.toSQL();
        expect(sql).toContain('"name" < ?');
        expect(sql).toContain('"id" > ?');
        expect(bindings).toEqual(["A", "A", 2, 3]); // where x3 + limit + 1
        expect(sql).toContain('order by "name" desc, "id" asc');
    });

    it("applies no where clause without a cursor", () => {
        const { sql } = applyCursorPagination(db("restaurants").select("*"), params()).toSQL();
        expect(sql).not.toContain("where");
    });

    it("never leaks the encoded cursor blob into bindings (encode/decode consistency)", () => {
        const rows = [
            { id: 1, name: "B" },
            { id: 2, name: "A" },
            { id: 3, name: "C" },
        ];
        const { data, meta } = buildPaginationResult(rows, 2, "name");
        const last = data[data.length - 1];
        const { sql, bindings } = applyCursorPagination(
            db("restaurants").select("*"),
            { cursor: decodeCursor(meta.nextCursor), limit: 2, sortBy: "name", sortOrder: "asc" },
        ).toSQL();
        expect(meta.nextCursor).not.toBeNull();
        expect(bindings).toContain(last.name);
        expect(bindings).toContain(last.id);
        expect(bindings).not.toContain(meta.nextCursor);
        expect(sql).toContain('"id" > ?');
    });
});

describe("list query DTO cursor handling", () => {
    it("rejects a malformed cursor with 400 via validateQuery", async () => {
        await expect(validateQuery(ListRestaurantsQueryDTO, { cursor: "junk" })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it("passes a valid cursor through as a decoded keyset", async () => {
        const query = await validateQuery(ListRestaurantsQueryDTO, {
            limit: "2",
            cursor: issue({ id: 7, value: "Pizza" }),
        });
        expect(query.toPaginationParams()).toEqual({
            cursor: { id: 7, value: "Pizza" },
            limit: 2,
            sortBy: "createdAt",
            sortOrder: "asc",
        });
    });
});
