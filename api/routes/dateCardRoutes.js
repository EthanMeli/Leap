import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getDateCard } from "../controllers/dateCardController.js";

const router = express.Router();

router.use(protectRoute);

router.get("/:matchId", getDateCard);

export default router;
