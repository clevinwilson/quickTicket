import app from "./app.ts";
import dotenv from "dotenv";

dotenv.config({path: "./.env"});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Auth server is running on port ${PORT}`);
});