import { Router } from "express";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticate, getEvents);
router.post(
  "/",
  authenticate,
  authorize(["leader", "head", "hr"]),
  createEvent,
);
router.put(
  "/:id",
  authenticate,
  authorize(["leader", "head", "hr"]),
  updateEvent,
);
router.delete(
  "/:id",
  authenticate,
  authorize(["leader", "head", "hr"]),
  deleteEvent,
);

export default router;
