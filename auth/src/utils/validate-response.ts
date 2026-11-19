import type { ZodType } from "zod";

import { ResponseValidationError } from "../errors/index.ts";

/**
 * Checks an outgoing payload against its schema before it is sent.
 *
 * This guards the contract in the other direction: validate() stops bad input
 * from clients, this stops a refactor from quietly changing what clients
 * receive - a renamed field, a leaked `passwordHash`, an `undefined` where the
 * frontend expects null.
 *
 *   res.status(200).json(
 *     parseResponse(currentUserResponseSchema, { currentUser })
 *   );
 *
 * On failure it raises a ResponseValidationError (500) carrying zod's issues on
 * `cause`, so the error handler logs exactly which field broke while the client
 * sees only "Something went wrong".
 */
export function parseResponse<T>(schema: ZodType<T>, payload: unknown): T {
    const result = schema.safeParse(payload);

    if (!result.success) {
        throw new ResponseValidationError(result.error.issues);
    }

    return result.data;
}
