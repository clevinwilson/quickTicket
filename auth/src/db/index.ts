import mongoose from "mongoose";

import { DatabaseConnectionError } from "../errors/index.ts";

/**
 * Startup order is never guaranteed in Kubernetes: this pod can be scheduled
 * and running seconds before the Mongo pod is accepting connections, and Mongo
 * can be rescheduled at any time afterwards. Exiting on the first failure means
 * the service stays dead even though the database shows up moments later, so
 * the initial connect is retried with a backoff.
 *
 * Only the *first* connection is handled here. After it succeeds, mongoose
 * reconnects on its own and buffers commands while a connection is down.
 */

const MAX_ATTEMPTS = 10;
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 10_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    // A missing URI is a configuration mistake, not a timing problem - retrying
    // would never fix it, so fail immediately and loudly.
    if (!uri) {
        throw new Error("MONGO_URI environment variable is not defined");
    }

    let delay = INITIAL_DELAY_MS;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            await mongoose.connect(uri, {
                // Default is 30s: too long to wait before a retry, and it hides
                // a down database behind a hung startup.
                serverSelectionTimeoutMS: 5000,
            });

            console.log("Auth MongoDB connected");
            return;
        } catch (error) {
            if (attempt === MAX_ATTEMPTS) {
                // Out of patience: this is a real outage, not a slow start.
                throw new DatabaseConnectionError(error);
            }

            console.warn(
                `Mongo not ready (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delay}ms`
            );

            await wait(delay);
            // Exponential backoff, capped: quick retries while the database is
            // still starting, slow ones once it is clearly not coming back.
            delay = Math.min(delay * 2, MAX_DELAY_MS);
        }
    }
};

export default connectDB;
