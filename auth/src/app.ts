import express from "express";

import { errorHandler, notFoundHandler } from "./middlewares/error-handler.ts";
import authRoutes from "./routes/auth.route.ts";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));



app.use("/api/users", authRoutes);

// These two must stay last, and in this order: anything unmatched becomes a
// 404, then every error - thrown or passed to next() - leaves through the one
// handler that turns it into JSON.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
