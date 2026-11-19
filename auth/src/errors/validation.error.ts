import type { ZodError } from "zod";

import { ApiError, type ApiErrorDetail } from "../utils/api-error.ts";

/**
 * The client sent something the schema rejected: a missing field, a bad email,
 * an unknown key.
 *
 * 400, and the only error in the service that fills the `errors` array - the
 * caller needs to know *which* fields failed, not just that validation did.
 *
 * Naming: "Request" is not decoration. A response that fails its own schema is
 * a completely different situation (our bug, 500, nothing disclosed), and that
 * is ResponseValidationError below. Calling this one just "ValidationError"
 * invites someone to reuse it for the other case and hand a client a 400 for a
 * server-side mistake.
 */
class RequestValidationError extends ApiError {
    constructor(errors: ApiErrorDetail[]) {
        super(400, "Request validation failed", errors);
        this.name = "RequestValidationError";
    }

    /**
     * Maps zod's issues to the `errors` array shape. Lives here, with the error
     * it belongs to, so the middleware stays a middleware and any other caller
     * (a service validating a payload, a queue consumer) gets the same shape.
     *
     * `field` is the dotted path ("address.city", "items.0.id"). When the whole
     * target failed - e.g. the body was not an object - the path is empty, so
     * the target name is used instead.
     */
    static detailsFromZod(
        error: ZodError,
        target: string
    ): ApiErrorDetail[] {
        return error.issues.map((issue) => ({
            field:
                issue.path.length > 0 ? issue.path.map(String).join(".") : target,
            message: issue.message,
        }));
    }

    /** Convenience for the single-target case. */
    static fromZod(error: ZodError, target = "body"): RequestValidationError {
        return new RequestValidationError(
            RequestValidationError.detailsFromZod(error, target)
        );
    }
}

/**
 * An outgoing payload did not match its own schema: a renamed field, a leaked
 * `passwordHash`, an `undefined` where the frontend expects null.
 *
 * 500 and deliberately mute. The caller did nothing wrong and can do nothing
 * about it, so the issues go to the logs (via `cause`) and never into the
 * response - the shape is already wrong, so disclosing it only helps an
 * attacker map the internals.
 */
class ResponseValidationError extends ApiError {
    constructor(cause?: unknown) {
        super(500, "Something went wrong");

        this.name = "ResponseValidationError";
        this.cause = cause;
    }
}

export { RequestValidationError, ResponseValidationError };
