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
  authorize(["leader"]),
  createEvent,
);
router.put(
  "/:id",
  authenticate,
  authorize(["leader"]),
  updateEvent,
);
router.delete(
  "/:id",
  authenticate,
  authorize(["leader"]),
  deleteEvent,
);

export default router;
