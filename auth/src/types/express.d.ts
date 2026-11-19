/**
 * Declares the property the validate middleware attaches to a request, so
 * `req.validated` typechecks everywhere instead of needing a cast per file.
 *
 * Values are `unknown` on purpose - only the route that registered the schema
 * knows the real shape, which is what `getValidated<T>()` is for.
 */
declare global {
    namespace Express {
        interface Request {
            validated?: {
                body?: unknown;
                params?: unknown;
                query?: unknown;
            };
        }
    }
}

export {};
