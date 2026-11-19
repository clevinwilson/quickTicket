import { ApiError } from "../utils/api-error.ts";

/**
 * The database is unreachable: the connection dropped, the pool is exhausted,
 * DNS for the host failed, the replica set has no primary.
 *
 * 503, not 500: the request was perfectly valid and will probably succeed when
 * retried, which is a different instruction to the caller (and to a load
 * balancer) than "this request is broken". 500 means "we have a bug", 503 means
 * "come back shortly".
 *
 * Extends ApiError on purpose: the error handler in middlewares/error-handler.ts
 * already branches on `instanceof ApiError`, so this class needs no change
 * there at all. That is the whole payoff of having one base error.
 *
 * The client-facing message is deliberately vague. The original driver error is
 * kept on `cause` for the logs only - a connection string, host name or replica
 * set topology in a response body is free reconnaissance for an attacker.
 *
 * Throw it where the connection is made or used, never in a controller:
 *
 *   // db/connect.ts
 *   try {
 *     await mongoose.connect(env.MONGO_URI);
 *   } catch (err) {
 *     throw new DatabaseConnectionError(err);
 *   }
 *
 *   // a model / repository call
 *   try {
 *     return await User.findOne({ email });
 *   } catch (err) {
 *     if (isConnectionIssue(err)) throw new DatabaseConnectionError(err);
 *     throw err;
 *   }
 */
class DatabaseConnectionError extends ApiError {
    /** Seconds to put in the Retry-After header, if you choose to send one. */
    static readonly RETRY_AFTER_SECONDS = 5;

    constructor(cause?: unknown) {
        super(503, "Service temporarily unavailable");

        this.name = "DatabaseConnectionError";
        // ES2022 error cause: carries the driver error for logging without ever
        // being serialized into the response.
        this.cause = cause;
    }
}

export { DatabaseConnectionError };
