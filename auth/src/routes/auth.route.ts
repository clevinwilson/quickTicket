import { Router } from "express";
import { signup } from '../controllers/auth.controller.ts'
import { validate } from "../middlewares/validate.ts";
import { signupBodySchema } from "../schemas/auth.schema.ts";

const router = Router();


router.route("/signup").post(validate({ body: signupBodySchema }), signup);

router.route("/login").post((req, res) => {
  res.send("Login route");
});

export default router;