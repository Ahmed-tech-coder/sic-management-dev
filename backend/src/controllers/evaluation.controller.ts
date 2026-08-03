import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { Readable } from 'stream';
import { auditEmitter } from '../utils/auditLogger';
import { memoryCache } from '../utils/cache';
import { prisma } from '../lib/prisma';

const createEvaluationSchema = z.object({
  task_name: z.string().min(2, 'Task name must be at least 2 characters'),
  technical_member_id: z.string().uuid('Invalid technical member ID'),
  score: z.number().min(0, 'Score must be at least 0'),
  max_score: z.number().min(1, 'Max score must be at least 1').default(100),
  notes: z.string().optional().nullable(),
}).refine(data => data.score <= (data.max_score ?? 100), {
  message: 'Score cannot exceed the task max score',
  path: ['score'],
});

const updateEvaluationSchema = z.object({
  task_name: z.string().min(2, 'Task name must be at least 2 characters'),
  technical_member_id: z.string().uuid('Invalid technical member ID'),
  score: z.number().min(0, 'Score must be at least 0'),
  max_score: z.number().min(1, 'Max score must be at least 1').default(100),
  notes: z.string().optional().nullable(),
}).refine(data => data.score <= (data.max_score ?? 100), {
  message: 'Score cannot exceed the task max score',
  path: ['score'],
});

export const getEvaluations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { track_id, search, task, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Track filter condition
    const whereTrack: any = {};
    if (req.user?.role === 'head') {
      whereTrack.technical_members = { track_id: req.user.track_id };
    } else if (track_id) {
      whereTrack.technical_members = { track_id: track_id as string };
    }

    // Fetch unique task names for filters
    const allTasks = await prisma.evaluation.findMany({
      where: whereTrack,
      select: { task_name: true },
      distinct: ['task_name'],
    });
    const uniqueTasks = Array.from(new Set(allTasks.map((t) => t.task_name))).sort();

    const where: any = { ...whereTrack };

    if (task) {
      where.task_name = task as string;
    }

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { task_name: { contains: searchStr, mode: 'insensitive' } },
        { technical_members: { name: { contains: searchStr, mode: 'insensitive' } } },
      ];
    }

    const [rawEvaluations, count] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        include: {
          technical_members: {
            include: {
              tracks: true,
            },
          },
          users: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.evaluation.count({ where }),
    ]);

    // Map `users` relation to `evaluator` to match frontend expected response contract
    const evaluations = rawEvaluations.map((ev) => ({
      ...ev,
      evaluator: ev.users,
    }));

    return res.status(200).json({
      evaluations,
      tasks: uniqueTasks,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: count ? Math.ceil(count / limitNum) : 0,
    });
  } catch (err) {
    console.error('Get evaluations error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createEvaluation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createEvaluationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const { task_name, technical_member_id, score, max_score, notes } = parsed.data;

    // 1. Fetch member to check existence and track permissions
    const member = await prisma.technicalMember.findUnique({
      where: { id: technical_member_id },
      select: { track_id: true, name: true },
    });

    if (!member) {
      return res.status(404).json({ error: 'Technical member not found or access denied' });
    }

    // Verify Head is creating evaluation for their own track
    if (req.user?.role === 'head' && member.track_id !== req.user.track_id) {
      return res.status(403).json({ error: 'Forbidden: You can only evaluate members of your own track' });
    }

    // Check for duplicate: same student + same task
    const existingEval = await prisma.evaluation.findFirst({
      where: {
        technical_member_id,
        task_name,
      },
      select: { id: true },
    });

    if (existingEval) {
      return res.status(409).json({ error: `This student has already been evaluated for "${task_name}"` });
    }

    // 2. Create evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        task_name,
        technical_member_id,
        evaluator_id: req.user?.id || null,
        score,
        max_score: max_score ?? 100,
        notes: notes || null,
      },
      include: {
        technical_members: {
          select: { name: true, track_id: true },
        },
      },
    });

    // Log admin action asynchronously
    auditEmitter.emitLog({
      userId: req.user?.id || '',
      action: 'Created Evaluation',
      entityType: 'evaluations',
      entityId: evaluation.id,
      description: `Evaluated ${member.name} for task "${task_name}" with score ${score}/${max_score ?? 100}`,
    });

    // Invalidate dashboard metrics cache
    memoryCache.clearPattern(/^dashboard-metrics:/);

    return res.status(201).json({
      message: 'Evaluation created successfully',
      evaluation,
    });
  } catch (err) {
    console.error('Create evaluation error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateEvaluation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateEvaluationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const { task_name, technical_member_id, score, max_score, notes } = parsed.data;

    // 1. Fetch existing evaluation
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: { id: id as string },
      include: {
        technical_members: {
          select: { track_id: true },
        },
      },
    });

    if (!existingEvaluation) {
      return res.status(404).json({ error: 'Evaluation not found or access denied' });
    }

    // 2. Fetch target member details
    const member = await prisma.technicalMember.findUnique({
      where: { id: technical_member_id },
      select: { track_id: true, name: true },
    });

    if (!member) {
      return res.status(404).json({ error: 'Technical member not found' });
    }

    // Verify Head is evaluating their own track
    if (req.user?.role === 'head' && member.track_id !== req.user.track_id) {
      return res.status(403).json({ error: 'Forbidden: You can only evaluate members of your own track' });
    }

    // 3. Update evaluation
    const evaluation = await prisma.evaluation.update({
      where: { id: id as string },
      data: {
        task_name,
        technical_member_id,
        score,
        max_score: max_score ?? 100,
        notes: notes || null,
        updated_at: new Date(),
      },
      include: {
        technical_members: {
          select: { name: true },
        },
      },
    });

    // Log admin action asynchronously
    auditEmitter.emitLog({
      userId: req.user?.id || '',
      action: 'Updated Evaluation',
      entityType: 'evaluations',
      entityId: id as string,
      description: `Updated evaluation for ${member.name} - task "${task_name}" - score ${score}/${max_score ?? 100}`,
    });

    // Invalidate dashboard metrics cache
    memoryCache.clearPattern(/^dashboard-metrics:/);

    return res.status(200).json({
      message: 'Evaluation updated successfully',
      evaluation,
    });
  } catch (err) {
    console.error('Update evaluation error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteEvaluation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch existing evaluation details for logging
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: id as string },
      include: {
        technical_members: {
          select: { name: true },
        },
      },
    });

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found or access denied' });
    }

    await prisma.evaluation.delete({
      where: { id: id as string },
    });

    // Log admin action asynchronously
    auditEmitter.emitLog({
      userId: req.user?.id || '',
      action: 'Deleted Evaluation',
      entityType: 'evaluations',
      entityId: id as string,
      description: `Deleted evaluation of ${evaluation.technical_members?.name || 'Unknown'} for task "${evaluation.task_name}"`,
    });

    // Invalidate dashboard metrics cache
    memoryCache.clearPattern(/^dashboard-metrics:/);

    return res.status(200).json({ message: 'Evaluation deleted successfully' });
  } catch (err) {
    console.error('Delete evaluation error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Helper generator function for CSV streaming with Prisma
async function* getEvaluationsCsvGenerator(trackId: any, search?: string, task?: string) {
  yield 'Person Name,Task Name,Score\n';

  let page = 0;
  const limit = 500;
  let hasMore = true;

  const where: any = {};
  if (trackId) {
    where.technical_members = { track_id: trackId };
  }
  if (task) {
    where.task_name = task;
  }
  if (search) {
    const searchStr = search;
    where.OR = [
      { task_name: { contains: searchStr, mode: 'insensitive' } },
      { technical_members: { name: { contains: searchStr, mode: 'insensitive' } } },
    ];
  }

  while (hasMore) {
    const data = await prisma.evaluation.findMany({
      where,
      select: {
        task_name: true,
        score: true,
        technical_members: {
          select: {
            name: true,
            track_id: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: page * limit,
      take: limit,
    });

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const ev of data) {
      const row = [
        ev.technical_members?.name || '',
        ev.task_name,
        ev.score,
      ];

      const csvRow = row
        .map((value) => {
          const strValue = String(value ?? '').replace(/"/g, '""');
          return strValue.includes(',') || strValue.includes('\n') || strValue.includes('\r') || strValue.includes('"')
            ? `"${strValue}"`
            : strValue;
        })
        .join(',') + '\n';

      yield csvRow;
    }

    if (data.length < limit) {
      hasMore = false;
    } else {
      page++;
    }
  }
}

export const exportEvaluations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { track_id, search, task } = req.query;

    const effectiveTrackId = req.user?.role === 'head' ? req.user.track_id : track_id;

    res.setHeader('Content-Disposition', `attachment; filename=Evaluations_Report.csv`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    const csvStream = Readable.from(getEvaluationsCsvGenerator(effectiveTrackId, search as string | undefined, task as string | undefined));

    csvStream.on('error', (err) => {
      console.error('CSV Stream processing error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error during streaming' });
      } else {
        res.end();
      }
    });

    csvStream.pipe(res);
  } catch (err) {
    console.error('Export evaluations error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

// Bulk import evaluations from parsed CSV data
const importRowSchema = z.object({
  assessment_name: z.string().min(1, 'Assessment name is required'),
  student_name: z.string().min(1, 'Student name is required'),
  total_grade: z.number().min(1, 'Total grade must be at least 1'),
  student_grade: z.number().min(0, 'Student grade must be at least 0'),
});

export const importEvaluations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No data rows provided' });
    }

    if (rows.length > 500) {
      return res.status(400).json({ error: 'Cannot import more than 500 rows at once' });
    }

    const trackId = req.user?.track_id;

    // 1. Fetch all members across all tracks for name matching
    const trackMembers = await prisma.technicalMember.findMany({
      select: { id: true, name: true, track_id: true },
    });

    // Build a name -> id lookup map (case-insensitive, trimmed)
    const memberMap = new Map<string, string>();
    for (const m of trackMembers || []) {
      memberMap.set(m.name.trim().toLowerCase(), m.id);
    }

    // 2. Pre-process rows to find students that need to be auto-created
    const missingNames = new Set<string>();
    for (const raw of rows) {
      const name = raw.student_name?.toString().trim().toLowerCase();
      if (name && !memberMap.has(name)) {
        missingNames.add(raw.student_name?.toString().trim());
      }
    }

    // Auto-create missing students in the head's track
    if (missingNames.size > 0) {
      for (const name of Array.from(missingNames)) {
        const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'student';
        const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const randomPhone = `01${Math.floor(10000000 + Math.random() * 90000000)}`;

        const createdMember = await prisma.technicalMember.create({
          data: {
            name,
            track_id: trackId || null,
            email: `${cleanName}_${uniqueSuffix}@temporary.com`,
            phone: randomPhone,
          },
          select: { id: true, name: true },
        });

        memberMap.set(createdMember.name.trim().toLowerCase(), createdMember.id);
      }
    }

    // 3. Fetch existing evaluations for duplicate detection
    const memberIds = Array.from(memberMap.values());
    const existingSet = new Set<string>();
    if (memberIds.length > 0) {
      const existingEvals = await prisma.evaluation.findMany({
        where: { technical_member_id: { in: memberIds } },
        select: { task_name: true, technical_member_id: true },
      });

      for (const ev of existingEvals || []) {
        existingSet.add(`${ev.technical_member_id}::${ev.task_name.trim().toLowerCase()}`);
      }
    }

    // Track duplicates within the CSV itself
    const csvSeenSet = new Set<string>();

    const results: { row: number; status: 'success' | 'error'; error?: string }[] = [];
    const insertPayloads: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const parsed = importRowSchema.safeParse({
        assessment_name: raw.assessment_name?.toString().trim(),
        student_name: raw.student_name?.toString().trim(),
        total_grade: Number(raw.total_grade),
        student_grade: Number(raw.student_grade),
      });

      if (!parsed.success) {
        results.push({ row: i + 1, status: 'error', error: parsed.error.issues[0]?.message || 'Validation error' });
        continue;
      }

      const { assessment_name, student_name, total_grade, student_grade } = parsed.data;

      if (student_grade > total_grade) {
        results.push({ row: i + 1, status: 'error', error: `Student grade (${student_grade}) exceeds total grade (${total_grade})` });
        continue;
      }

      const memberId = memberMap.get(student_name.toLowerCase());
      if (!memberId) {
        results.push({ row: i + 1, status: 'error', error: `Could not resolve student "${student_name}"` });
        continue;
      }

      // Check for duplicate in existing DB records
      const dupeKey = `${memberId}::${assessment_name.trim().toLowerCase()}`;
      if (existingSet.has(dupeKey)) {
        results.push({ row: i + 1, status: 'error', error: `"${student_name}" already evaluated for "${assessment_name}"` });
        continue;
      }

      // Check for duplicate within the same CSV file
      if (csvSeenSet.has(dupeKey)) {
        results.push({ row: i + 1, status: 'error', error: `Duplicate entry in CSV: "${student_name}" for "${assessment_name}"` });
        continue;
      }
      csvSeenSet.add(dupeKey);

      insertPayloads.push({
        index: i,
        data: {
          task_name: assessment_name,
          technical_member_id: memberId,
          evaluator_id: req.user?.id || null,
          score: student_grade,
          max_score: total_grade,
          notes: null,
        },
      });
    }

    // 4. Bulk insert valid rows
    if (insertPayloads.length > 0) {
      try {
        await prisma.evaluation.createMany({
          data: insertPayloads.map((p) => p.data),
        });

        for (const p of insertPayloads) {
          results.push({ row: p.index + 1, status: 'success' });
        }

        // Log admin action
        auditEmitter.emitLog({
          userId: req.user?.id || '',
          action: 'Imported Evaluations',
          entityType: 'evaluations',
          entityId: '',
          description: `Bulk imported ${insertPayloads.length} evaluations from CSV`,
        });

        // Invalidate caches
        memoryCache.clearPattern(/^dashboard-metrics:/);
      } catch (bulkError) {
        for (const p of insertPayloads) {
          results.push({ row: p.index + 1, status: 'error', error: 'Database insert failed' });
        }
      }
    }

    // Sort results by row number
    results.sort((a, b) => a.row - b.row);

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return res.status(200).json({
      message: `Import completed: ${successCount} succeeded, ${errorCount} failed`,
      successCount,
      errorCount,
      totalRows: rows.length,
      results,
    });
  } catch (err) {
    console.error('Import evaluations error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
