import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const loginSchema = z.union([
  z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['leader', 'head', 'hr']).optional(),
  }),
  z.object({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g. +2012...)'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['leader', 'head', 'hr']).optional(),
  }),
]);

export const login = async (req: Request, res: Response) => {
  try {
    console.log('Received login payload:', {
      ...req.body,
      password: req.body.password ? '[REDACTED]' : undefined,
    });

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('Validation failed:', parsed.error.issues[0]?.message);
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const data = parsed.data;
    let identifierType: 'email' | 'phone';
    let profile: any = null;

    if ('email' in data) {
      identifierType = 'email';
      console.log(`Attempting email authentication for: ${data.email}`);
      profile = await prisma.user.findFirst({
        where: {
          email: {
            equals: data.email.toLowerCase().trim(),
            mode: 'insensitive',
          },
        },
        include: {
          tracks: true,
        },
      });
    } else {
      identifierType = 'phone';
      console.log(`Attempting phone authentication for: ${data.phone}`);
      profile = await prisma.user.findFirst({
        where: {
          phone: data.phone.trim(),
        },
        include: {
          tracks: true,
        },
      });
    }

    const errorMsg = identifierType === 'email'
      ? 'Invalid email or password'
      : 'Invalid phone number or password';

    if (!profile) {
      console.log('User profile not found in local database');
      return res.status(401).json({ error: errorMsg });
    }

    const isPasswordValid = await bcrypt.compare(data.password, profile.password_hash);
    if (!isPasswordValid) {
      console.log('Authentication failed: password mismatch');
      return res.status(401).json({ error: errorMsg });
    }

    console.log(`Local authentication succeeded. User ID: ${profile.id}`);

    const resolvedRole = profile.role === 'head' && profile.tracks?.name === 'HR' ? 'hr' : profile.role;

    if ('role' in data && data.role && resolvedRole !== data.role) {
      const portalNames = {
        leader: 'Community Leader',
        head: 'Track Head',
        hr: 'HR Auditor'
      };
      return res.status(403).json({
        error: `This account does not have access to the ${portalNames[data.role]} portal`
      });
    }

    if (!profile.is_active) {
      console.log(`Account is deactivated for user: ${profile.name} (${profile.id})`);
      return res.status(403).json({ error: 'This account has been deactivated' });
    }

    // Generate local JWT token
    const token = jwt.sign(
      { sub: profile.id, role: profile.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Logged in successfully',
      token: token,
      user: {
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        role: profile.role === 'head' && profile.tracks?.name === 'HR' ? 'hr' : profile.role,
        head_type: profile.head_type,
        track_id: profile.track_id,
        track_name: profile.tracks?.name,
        is_active: profile.is_active,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({ user: req.user });
};

export const logout = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
