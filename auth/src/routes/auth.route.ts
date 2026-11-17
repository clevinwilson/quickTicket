import { Router } from "express";

const router = Router();

router.route("/register").get((req, res) => {
  res.send("Register route");
});

router.route("/login").post((req, res) => {
  res.send("Login route");
});

export default router;