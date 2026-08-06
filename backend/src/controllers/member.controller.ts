import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { auditEmitter } from '../utils/auditLogger';
import { memoryCache } from '../utils/cache';
import { prisma } from '../lib/prisma';

const createMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  email: z.string().email('Invalid email address'),
  track_id: z.string().uuid().optional().nullable(),
});

const updateMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  email: z.string().email('Invalid email address'),
  track_id: z.string().uuid().optional().nullable(),
});

export const getMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { track_id, search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Enforce track constraints based on role
    if (req.user?.role === 'head') {
      where.track_id = req.user.track_id;
    } else if (track_id) {
      where.track_id = track_id as string;
    }

    // Search filter
    if (search) {
      const searchStr = search as string;
      where.OR = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { email: { contains: searchStr, mode: 'insensitive' } },
        { phone: { contains: searchStr, mode: 'insensitive' } },
      ];
    }

    const [members, count] = await Promise.all([
      prisma.technicalMember.findMany({
        where,
        include: {
          tracks: true,
        },
        orderBy: {
          name: 'asc',
        },
        skip,
        take: limitNum,
      }),
      prisma.technicalMember.count({ where }),
    ]);

    return res.status(200).json({
      members,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: count ? Math.ceil(count / limitNum) : 0,
    });
  } catch (err) {
    console.error('Get members error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const { name, phone, email } = parsed.data;
    let { track_id } = parsed.data;

    // Resolve Track ID based on role
    if (req.user?.role === 'head') {
      track_id = req.user.track_id;
    } else if (!track_id) {
      return res.status(400).json({ error: 'Track must be specified' });
    }

    let member;
    try {
      member = await prisma.technicalMember.create({
        data: {
          name,
          phone,
          email,
          track_id: track_id || null,
        },
        include: {
          tracks: true,
        },
      });
    } catch (dbErr: any) {
      if (dbErr.code === 'P2002') {
        return res.status(400).json({ error: 'There is technical member with this email or phone number already exists' });
      }
      throw dbErr;
    }

    // Log admin action asynchronously
    auditEmitter.emitLog({
      userId: req.user?.id || '',
      action: 'Added Technical Member',
      entityType: 'technical_members',
      entityId: member.id,
      description: `Added technical member ${name} to track ${member.tracks?.name}`,
    });

    // Invalidate dashboard metrics cache
    memoryCache.clearPattern(/^dashboard-metrics:/);

    return res.status(201).json({
      message: 'Technical member added successfully',
      member,
    });
  } catch (err) {
    console.error('Create member error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const { name, phone, email } = parsed.data;
    let { track_id } = parsed.data;

    // Fetch existing member details to check permission and track changes
    const existingMember = await prisma.technicalMember.findUnique({
      where: { id: id as string },
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Technical member not found or access denied' });
    }

    // Enforce track constraints based on role
    if (req.user?.role === 'head') {
      track_id = req.user.track_id; // head cannot change track of member
    } else if (!track_id) {
      track_id = existingMember.track_id;
    }

    let member;
    try {
      member = await prisma.technicalMember.update({
        where: { id: id as string },
        data: {
          name,
          phone,
          email,
          track_id: track_id || null,
          updated_at: new Date(),
        },
        include: {
          tracks: true,
        },
      });
    } catch (dbErr: any) {
      if (dbErr.code === 'P2002') {
        return res.status(400).json({ error: 'A technical member with this email or phone number already exists' });
      }
      throw dbErr;
    }

    // Log admin action asynchronously
    auditEmitter.emitLog({
      userId: req.user?.id || '',
      action: 'Updated Technical Member',
      entityType: 'technical_members',
      entityId: id as string,
      description: `Updated technical member ${name}`,
    });

    // Invalidate dashboard metrics cache
    memoryCache.clearPattern(/^dashboard-metrics:/);

    return res.status(200).json({
      message: 'Technical member updated successfully',
      member,
    });
  } catch (err) {
    console.error('Update member error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch existing member details for logging and permission check
    const member = await prisma.technicalMember.findUnique({
      where: { id: id as string },
      select: { name: true, track_id: true },
    });

    if (!member) {
      return res.status(404).json({ error: 'Technical member not found or access denied' });
    }

    await prisma.technicalMember.delete({
      where: { id: id as string },
    });

    // Log admin action asynchronously
    auditEmitter.emitLog({
      userId: req.user?.id || '',
      action: 'Deleted Technical Member',
      entityType: 'technical_members',
      entityId: id as string,
      description: `Deleted technical member ${member.name}`,
    });

    // Invalidate dashboard metrics cache
    memoryCache.clearPattern(/^dashboard-metrics:/);

    return res.status(200).json({ message: 'Technical member deleted successfully' });
  } catch (err) {
    console.error('Delete member error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
