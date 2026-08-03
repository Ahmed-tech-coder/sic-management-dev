import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { z } from "zod";
import { auditEmitter } from "../utils/auditLogger";
import { prisma } from "../lib/prisma";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone number must be in E.164 format (e.g. +201127346022)",
    ),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["leader", "head", "hr"]),
  head_type: z.enum(["head", "vice_head"]).optional().nullable(),
  track_id: z.string().uuid().optional().nullable(),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone number must be in E.164 format (e.g. +201228895185)",
    ),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .nullable(),
  role: z.enum(["leader", "head", "hr"]),
  head_type: z.enum(["head", "vice_head"]).optional().nullable(),
  track_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean(),
});

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      role,
      head_type,
      track_id,
      search,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) where.role = role as string;
    if (head_type) where.head_type = head_type as string;
    if (track_id) where.track_id = track_id as string;
    if (search) {
      const searchStr = search as string;
      where.OR = [
        { name: { contains: searchStr, mode: "insensitive" } },
        { email: { contains: searchStr, mode: "insensitive" } },
        { phone: { contains: searchStr, mode: "insensitive" } },
      ];
    }

    const [users, count] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          tracks: true,
        },
        orderBy: {
          name: "asc",
        },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      users,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: count ? Math.ceil(count / limitNum) : 0,
    });
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || "Validation error" });
    }

    const { name, phone, email, password, role, head_type, track_id } =
      parsed.data;

    // Enforce business rules
    if (role === "head" && !track_id) {
      return res
        .status(400)
        .json({ error: "Heads must be assigned to a track" });
    }

    // Check if user already exists locally
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "A user with this email or phone number already exists",
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user profile directly in Prisma
    const newProfile = await prisma.user.create({
      data: {
        name,
        phone: phone.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role,
        head_type: role === "head" ? head_type : null,
        track_id: role === "head" ? track_id : null,
        is_active: true,
      },
      include: { tracks: true },
    });

    auditEmitter.emitLog({
      userId: req.user?.id || "",
      action: "Created User",
      entityType: "users",
      entityId: newProfile.id,
      description: `Created user ${name} (${role})`,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: newProfile,
    });
  } catch (err) {
    console.error("Create user error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || "Validation error" });
    }

    const {
      name,
      phone,
      email,
      password,
      role,
      head_type,
      track_id,
      is_active,
    } = parsed.data;

    if (role === "head" && !track_id) {
      return res
        .status(400)
        .json({ error: "Heads must be assigned to a track" });
    }

    // Check if another user has the updated email or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        id: { not: id as string },
        OR: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "A user with this email or phone number already exists",
      });
    }

    const dataToUpdate: any = {
      name,
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      role,
      head_type: role === "head" ? head_type : null,
      track_id: role === "head" ? track_id : null,
      is_active,
      updated_at: new Date(),
    };

    if (password) {
      dataToUpdate.password_hash = await bcrypt.hash(password, 10);
    }

    const updatedProfile = await prisma.user.update({
      where: { id: id as string },
      data: dataToUpdate,
      include: {
        tracks: true,
      },
    });

    // Log administrative action asynchronously
    auditEmitter.emitLog({
      userId: req.user?.id || "",
      action: "Updated User",
      entityType: "users",
      entityId: id as string,
      description: `Updated user ${name} (${role}${head_type ? " - " + head_type : ""})`,
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedProfile,
    });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch user details first for logging via Prisma
    const user = await prisma.user.findUnique({
      where: { id: id as string },
      select: { name: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user from local database
    await prisma.user.delete({ where: { id: id as string } });

    // Log administrative action asynchronously
    auditEmitter.emitLog({
      userId: req.user?.id || "",
      action: "Deleted User",
      entityType: "users",
      entityId: id as string,
      description: `Deleted user ${user.name} (${user.role})`,
    });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
