import app from "./app.ts";
import dotenv from "dotenv";
import connectDB from "./db/index.ts";

dotenv.config({path: "./.env"});

const PORT = process.env.PORT || 3000;



connectDB().then(()=>{

  app.listen(PORT, () => {
    console.log(`Auth server is running on port ${PORT}`);
  });
})
.catch((err)=>{
  console.log(err);
  process.exit(1);
  
})
