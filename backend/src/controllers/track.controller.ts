import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { memoryCache } from '../utils/cache';
import { prisma } from '../lib/prisma';

export const getTracks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cacheKey = 'tracks';
    const cachedData = memoryCache.get(cacheKey);
    
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const tracks = await prisma.track.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    const responseData = { tracks };
    // Cache for 30 minutes
    memoryCache.set(cacheKey, responseData, 30 * 60 * 1000);

    return res.status(200).json(responseData);
  } catch (err) {
    console.error('Get tracks error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
