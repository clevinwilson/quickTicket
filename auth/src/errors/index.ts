/**
 * One import site for every custom error:
 *
 *   import { DatabaseConnectionError, RequestValidationError } from "../errors/index.ts";
 *
 * Adding an error means adding a `<domain>.error.ts` file and one line here -
 * no call site changes.
 *
 * This folder holds error *definitions* only. Helpers that happen to throw one
 * (parseResponse, for instance) belong with the other utilities - keeping them
 * out is what stops `errors/` turning into a second utils folder.
 */
export { DatabaseConnectionError } from "./database.error.ts";
export {
    RequestValidationError,
    ResponseValidationError,
} from "./validation.error.ts";
