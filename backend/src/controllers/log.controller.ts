import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';

export const getActivityLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, count] = await Promise.all([
      prisma.activityLog.findMany({
        include: {
          users: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.activityLog.count(),
    ]);

    return res.status(200).json({
      logs,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: count ? Math.ceil(count / limitNum) : 0,
    });
  } catch (err) {
    console.error('Get logs error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteActivityLog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.activityLog.delete({
      where: {
        id: id as string,
      },
    });

    return res.status(200).json({ message: 'Activity log has been deleted successfully' });
  } catch (err) {
    console.error('Delete log error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const clearActivityLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.activityLog.deleteMany();

    return res.status(200).json({ message: 'All activity logs have been cleared successfully' });
  } catch (err) {
    console.error('Clear logs error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
