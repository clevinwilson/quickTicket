import type { Request, RequestHandler } from "express";
import type { ZodType } from "zod";

import { RequestValidationError } from "../errors/index.ts";
import { ApiError, type ApiErrorDetail } from "../utils/api-error.ts";

/** The three parts of a request that can carry client input. */
type ValidationTarget = "body" | "params" | "query";

/** One schema per part. Pass only the parts an endpoint actually accepts. */
type ValidationSchemas = Partial<Record<ValidationTarget, ZodType>>;

/**
 * Validates request input against zod schemas, then hands the *parsed* value
 * on: unknown keys stripped, strings trimmed, numbers coerced.
 *
 * Every target is checked before anything is reported, so one request gets one
 * response listing all of its problems - not the first one only.
 *
 * Where the parsed value ends up:
 *   - `req.body`   is replaced (writable in Express 5)
 *   - `req.params` is updated in place (writable)
 *   - `req.query`  CANNOT be touched - Express 5 exposes it through a memoized
 *                  getter, so both assignment and mutation silently do nothing
 *
 */
export const validate = (schemas: ValidationSchemas): RequestHandler => {
    return (req, _res, next) => {
        const errors: ApiErrorDetail[] = [];
        const validated: Record<string, unknown> = {};

        for (const target of ["body", "params", "query"] as const) {
            const schema = schemas[target];
            if (!schema) continue;

            const result = schema.safeParse(req[target]);

            if (!result.success) {
                errors.push(
                    ...RequestValidationError.detailsFromZod(result.error, target)
                );
                continue;
            }

            validated[target] = result.data;

            if (target === "body") {
                req.body = result.data;
            } else if (target === "params") {
                // In place: req.params is writable, but replacing the object
                // would detach it from the router's own reference.
                Object.assign(req.params, result.data);
            }
        }

        if (errors.length > 0) {
            next(new RequestValidationError(errors));
            return;
        }

        req.validated = validated;
        next();
    };
};

/**
 * Typed read of a validated value.
 *
 * The cast is safe exactly when the matching schema was passed to `validate`
 * for this route - the one assumption, named in one place, instead of an `as`
 * scattered through every controller.
 *
 *   const { email, password } = getValidated<SignupBody>(req);
 *   const { page } = getValidated<ListQuery>(req, "query");
 */
export function getValidated<T>(
    req: Request,
    target: ValidationTarget = "body"
): T {
    const value = req.validated?.[target];

    if (value === undefined) {
        // A programming mistake, not bad input: the schema was never registered.
        throw new ApiError(
            500,
            `No validated ${target} on this request - did you add validate({ ${target}: schema }) to the route?`
        );
    }

    return value as T;
}
