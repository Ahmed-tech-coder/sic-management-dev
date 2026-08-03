import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { memoryCache } from '../utils/cache';
import { prisma } from '../lib/prisma';

export const getDashboardMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const trackId = req.user?.track_id;
    const cacheKey = `dashboard-metrics:${role}:${trackId || 'all'}`;

    // 1. Check in memory cache
    const cachedData = memoryCache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // 2. Build filter conditions
    const membersWhere = role === 'head' && trackId ? { track_id: trackId } : {};
    const evaluationsWhere = role === 'head' && trackId ? { technical_members: { track_id: trackId } } : {};

    // 3. Fetch counts concurrently
    const [tracksCount, membersCount, evaluationsCount] = await Promise.all([
      prisma.track.count(),
      prisma.technicalMember.count({ where: membersWhere }),
      prisma.evaluation.count({ where: evaluationsWhere }),
    ]);

    const metrics = {
      tracksCount,
      membersCount,
      evaluationsCount,
    };

    // Cache metrics for 5 minutes (300,000 ms)
    memoryCache.set(cacheKey, metrics, 5 * 60 * 1000);

    return res.status(200).json(metrics);
  } catch (err) {
    console.error('Get dashboard metrics error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
