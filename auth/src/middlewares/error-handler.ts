import type { ErrorRequestHandler, RequestHandler } from "express";

import { ApiError, type ApiErrorDetail } from "../utils/api-error.ts";

/**
 * The single exit point for every failure in the service.
 *
 * Without this, Express falls back to its built-in handler, which renders an
 * HTML page containing the stack trace - absolute file paths and the
 * node_modules layout included - and throws away the `errors` array ApiError
 * carries. That is what Postman was showing.
 *
 * Express recognises an error handler by its FOUR parameters. Dropping `next`
 * turns this back into a normal middleware that never runs, so it has to stay
 * in the signature even when unused.
 */

const isProduction = process.env.NODE_ENV === "production";

/** `express.json()` rejects malformed JSON before any route runs. */
type BodyParserError = Error & {
    status?: number;
    statusCode?: number;
    type?: string;
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    // The response is already on the wire - all we can do is let Node destroy
    // the socket rather than try to write a second set of headers.
    if (res.headersSent) {
        next(err);
        return;
    }

    let statusCode = 500;
    let message = "Something went wrong";
    let errors: ApiErrorDetail[] = [];

    if (err instanceof ApiError) {
        // Expected, client-visible outcome: everything needed is on the error.
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;

        // A 4xx is the caller's problem and needs no log line. A 5xx is ours -
        // a DatabaseConnectionError, say - so log it with the driver error
        // carried on `cause`, which never reaches the response body.
        if (statusCode >= 500) {
            console.error(`[${err.name}] ${err.message}`, err.cause ?? "");
        }
    } else {
        const parserError = err as BodyParserError;
        const parserStatus = parserError.status ?? parserError.statusCode;

        if (
            parserError.type === "entity.parse.failed" ||
            parserError.type === "entity.too.large" ||
            (typeof parserStatus === "number" &&
                parserStatus >= 400 &&
                parserStatus < 500)
        ) {
            // Bad JSON or an oversized body: the client's fault, so report it
            // as such instead of turning it into a 500.
            statusCode = parserStatus ?? 400;
            message =
                parserError.type === "entity.too.large"
                    ? "Request body is too large"
                    : "Request body is not valid JSON";
        } else {
            // Anything else is a bug: log it in full, tell the client nothing.
            // Stack traces and driver messages are a gift to an attacker.
            console.error("[unhandled error]", err);
        }
    }

    res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errors,
        data: null,
        // Development only, and only ever the message - never the stack.
        ...(isProduction || statusCode < 500
            ? {}
            : { debug: err instanceof Error ? err.message : String(err) }),
    });
};

/**
 * Mounted after all routes: anything unmatched becomes a JSON 404 in the same
 * shape, instead of Express's HTML "Cannot GET /x" page.
 */
export const notFoundHandler: RequestHandler = (req) => {
    throw new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`);
};
