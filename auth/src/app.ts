import express from "express";

import authRoutes from "./routes/auth.route.ts";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));



app.use("/api/users", authRoutes);

export default app;
