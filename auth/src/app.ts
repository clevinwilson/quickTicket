import express from "express";
import cookieSession from "cookie-session";

import { errorHandler, notFoundHandler } from "./middlewares/error-handler.ts";
import authRoutes from "./routes/auth.route.ts";

const app = express();
app.set('trust proxy', true); // telling the express that the rust the proxy server nginx
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
    cookieSession({
        signed: false,
        secure: process.env.NODE_ENV === "production"
    })
)



app.use("/api/users", authRoutes);


app.use(notFoundHandler);
app.use(errorHandler);

export default app;
