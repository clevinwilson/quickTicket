import { z } from "zod";

/**
 * Request and response schemas for the auth endpoints. Keeping them in one file
 * means the shape of every endpoint is readable in one place, and the inferred
 * types below are the single source of truth - no hand-written interface can
 * drift away from what is actually validated.
 */

/**
 * Normalise first, then validate: `z.email().trim()` would reject
 * " a@b.com " before the space is removed, so the string is cleaned up and
 * piped into the email check.
 */
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const passwordSchema = z
    .string()
    .min(8, "must be at least 8 characters")
    .max(128, "must be at most 128 characters");

/**
 * `strictObject` rejects unknown keys instead of stripping them silently, which
 * surfaces a typo like `{ passwrod: ... }` as a 400 rather than as a confusing
 * "password is required".
 */
export const signupBodySchema = z.strictObject({
    email: emailSchema,
    password: passwordSchema,
});

/**
 * Login deliberately does NOT reuse passwordSchema: an account created before
 * the rules tightened must still be able to sign in. Length rules belong to
 * signup only.
 */
export const loginBodySchema = z.strictObject({
    email: emailSchema,
    password: z.string().min(1, "is required"),
});

/** The identity shape /api/users/currentuser returns when a session exists. */
export const currentUserSchema = z.object({
    // Tighten to z.uuid() once ids are generated as UUIDs.
    id: z.string().min(1),
    email: z.email(),
});

/**
 * The full response body of GET /api/users/currentuser.
 *
 * `nullable`, not `optional`: the key is always present, and a signed-out
 * visitor gets `{ "currentUser": null }` with a 200. That is what lets a
 * frontend ask "who am I?" on page load without treating "nobody" as an error.
 */
export const currentUserResponseSchema = z.object({
    currentUser: currentUserSchema.nullable(),
});

// Types inferred from the schemas - never written out by hand.
export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>;
