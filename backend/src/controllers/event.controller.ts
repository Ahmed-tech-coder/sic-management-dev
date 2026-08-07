import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { z } from "zod";
import { auditEmitter } from "../utils/auditLogger";
import { prisma } from "../lib/prisma";

const createEventSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  date: z.preprocess((val) => new Date(val as string), z.date()),
  location: z.string().min(1, "Location is required"),
  members: z.number().int().nonnegative("Participants count must be non-negative"),
  status: z.enum(["Upcoming", "Completed"]).default("Upcoming"),
});

const updateEventSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  date: z.preprocess((val) => new Date(val as string), z.date()),
  location: z.string().min(1, "Location is required"),
  members: z.number().int().nonnegative("Participants count must be non-negative"),
  status: z.enum(["Upcoming", "Completed"]),
});

export const getEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== "All") {
      where.status = status as string;
    }

    if (search) {
      where.name = { contains: search as string, mode: "insensitive" };
    }

    const [events, count, statsAggregate, upcomingCount] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.event.count({ where }),
      prisma.event.aggregate({
        _sum: {
          members: true,
        },
      }),
      prisma.event.count({
        where: {
          status: "Upcoming",
        },
      }),
    ]);

    return res.status(200).json({
      events,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: count ? Math.ceil(count / limitNum) : 0,
      stats: {
        totalEvents: count,
        totalParticipants: statsAggregate._sum.members || 0,
        upcomingEvents: upcomingCount,
      },
    });
  } catch (err) {
    console.error("Get events error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Validation error" });
    }

    const { name, date, location, members, status } = parsed.data;

    const newEvent = await prisma.event.create({
      data: {
        name,
        date,
        location,
        members,
        status,
      },
    });

    auditEmitter.emitLog({
      userId: req.user?.id || "",
      action: "Created Event",
      entityType: "events",
      entityId: newEvent.id,
      description: `Created event ${name}`,
    });

    return res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (err) {
    console.error("Create event error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Validation error" });
    }

    const { name, date, location, members, status } = parsed.data;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name,
        date,
        location,
        members,
        status,
        updated_at: new Date(),
      },
    });

    auditEmitter.emitLog({
      userId: req.user?.id || "",
      action: "Updated Event",
      entityType: "events",
      entityId: updatedEvent.id,
      description: `Updated event ${name}`,
    });

    return res.status(200).json({
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (err) {
    console.error("Update event error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    await prisma.event.delete({
      where: { id },
    });

    auditEmitter.emitLog({
      userId: req.user?.id || "",
      action: "Deleted Event",
      entityType: "events",
      entityId: id,
      description: `Deleted event ${event.name}`,
    });

    return res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (err) {
    console.error("Delete event error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
