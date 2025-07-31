import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { pomodoroSessions, pomodoroTasks, pomodoroConfigs } from '../db/schema';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { nanoid } from '../utils/nanoid';
import { springBootValidator } from '../utils/validation';
import { createErrorResponse, ErrorCodes, StatusCodes } from '../utils/spring-boot-compat';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Validation schemas
const createSessionSchema = z.object({
  workDuration: z.number().min(1),
  breakDuration: z.number().min(1),
  sessionType: z.string().optional(),
  tasks: z.array(z.object({
    todoId: z.number().optional(),
    description: z.string().min(1),
    orderIndex: z.number(),
  })).optional(),
});

const updateSessionSchema = z.object({
  action: z.enum(['START', 'PAUSE', 'RESUME', 'COMPLETE', 'CANCEL', 'SWITCH_TYPE']).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  completedCycles: z.number().optional(),
  endTime: z.string().optional(),
  sessionType: z.enum(['WORK', 'SHORT_BREAK', 'LONG_BREAK']).optional(),
});

const configSchema = z.object({
  workDuration: z.number().min(1).optional(),
  shortBreakDuration: z.number().min(1).optional(),
  longBreakDuration: z.number().min(1).optional(),
  cyclesBeforeLongBreak: z.number().min(1).optional(),
  alarmSound: z.string().optional(),
  alarmVolume: z.number().min(0).max(100).optional(),
  autoStartBreaks: z.boolean().optional(),
  autoStartWork: z.boolean().optional(),
});

const updateTaskSchema = z.object({
  completed: z.boolean(),
});

const createTaskSchema = z.object({
  todoId: z.number().optional(),
  description: z.string().min(1),
});

// GET /pomodoro/sessions
app.get('/sessions', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');
  
  try {
    const sessions = await db.select()
      .from(pomodoroSessions)
      .where(eq(pomodoroSessions.userId, userId as string))
      .orderBy(desc(pomodoroSessions.createdAt))
      .limit(limit)
      .offset(offset);
    
    return c.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// GET /pomodoro/sessions/active
app.get('/sessions/active', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    const session = await db.select()
      .from(pomodoroSessions)
      .where(and(
        eq(pomodoroSessions.userId, userId as string),
        eq(pomodoroSessions.status, 'ACTIVE')
      ))
      .get();
    
    if (!session) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'No active session'),
        404 as ContentfulStatusCode
      );
    }
    
    // Get tasks for the session
    const tasks = await db.select()
      .from(pomodoroTasks)
      .where(eq(pomodoroTasks.sessionId, session.id))
      .orderBy(pomodoroTasks.orderIndex);
    
    return c.json({ ...session, tasks });
  } catch (error) {
    console.error('Get active session error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// GET /pomodoro/sessions/:id
app.get('/sessions/:id', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  
  try {
    const session = await db.select()
      .from(pomodoroSessions)
      .where(and(
        eq(pomodoroSessions.id, sessionId),
        eq(pomodoroSessions.userId, userId as string)
      ))
      .get();
    
    if (!session) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Session not found'),
        404 as ContentfulStatusCode
      );
    }
    
    // Get tasks for the session
    const tasks = await db.select()
      .from(pomodoroTasks)
      .where(eq(pomodoroTasks.sessionId, sessionId))
      .orderBy(pomodoroTasks.orderIndex);
    
    return c.json({ ...session, tasks });
  } catch (error) {
    console.error('Get session error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// POST /pomodoro/sessions
app.post('/sessions', zValidator('json', createSessionSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    // Check if there's already an active session
    const activeSession = await db.select()
      .from(pomodoroSessions)
      .where(and(
        eq(pomodoroSessions.userId, userId as string),
        eq(pomodoroSessions.status, 'ACTIVE')
      ))
      .get();
    
    if (activeSession) {
      return c.json(
        createErrorResponse(ErrorCodes.CONFLICT, 'Already have an active session'),
        StatusCodes.CONFLICT as ContentfulStatusCode as ContentfulStatusCode
      );
    }
    
    const sessionId = nanoid();
    const now = new Date().toISOString();
    
    // Create session
    const newSession = {
      id: sessionId,
      userId: userId as string,
      startTime: null,
      workDuration: data.workDuration,
      breakDuration: data.breakDuration,
      status: 'ACTIVE' as const,
      sessionType: data.sessionType || 'WORK',
      completedCycles: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    await db.insert(pomodoroSessions).values(newSession);
    
    // Create tasks if provided
    if (data.tasks && data.tasks.length > 0) {
      const taskValues = data.tasks.map(task => ({
        id: nanoid(),
        sessionId,
        todoId: task.todoId,
        description: task.description,
        orderIndex: task.orderIndex,
        completed: false,
        createdAt: now,
        updatedAt: now,
      }));
      
      await db.insert(pomodoroTasks).values(taskValues);
    }
    
    const tasks = await db.select()
      .from(pomodoroTasks)
      .where(eq(pomodoroTasks.sessionId, sessionId))
      .orderBy(pomodoroTasks.orderIndex);
    
    return c.json({ ...newSession, tasks }, 201 as ContentfulStatusCode);
  } catch (error) {
    console.error('Create session error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /pomodoro/sessions/:id
app.put('/sessions/:id', zValidator('json', updateSessionSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const data = c.req.valid('json');
  
  try {
    const existing = await db.select()
      .from(pomodoroSessions)
      .where(and(
        eq(pomodoroSessions.id, sessionId),
        eq(pomodoroSessions.userId, userId as string)
      ))
      .get();
    
    if (!existing) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Session not found'),
        404 as ContentfulStatusCode
      );
    }
    
    const now = new Date().toISOString();
    let updateData: {
      updatedAt: string;
      startTime?: string;
      endTime?: string;
      status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
      sessionType?: string;
      completedCycles?: number;
    } = {
      updatedAt: now,
    };
    
    // Handle actions
    if (data.action) {
      switch (data.action) {
        case 'START':
          if (!existing.startTime) {
            updateData.startTime = now;
          }
          updateData.status = 'ACTIVE';
          break;
        case 'PAUSE':
          updateData.status = 'PAUSED';
          break;
        case 'RESUME':
          updateData.status = 'ACTIVE';
          break;
        case 'COMPLETE':
          updateData.status = 'COMPLETED';
          updateData.endTime = now;
          if (existing.sessionType === 'WORK') {
            updateData.completedCycles = (existing.completedCycles || 0) + 1;
          }
          break;
        case 'CANCEL':
          updateData.status = 'CANCELLED';
          updateData.endTime = now;
          break;
        case 'SWITCH_TYPE':
          if (data.sessionType) {
            updateData.sessionType = data.sessionType;
          }
          break;
      }
    } else {
      // Apply direct field updates
      Object.assign(updateData, data);
    }
    
    const result = await db.update(pomodoroSessions)
      .set(updateData)
      .where(and(
        eq(pomodoroSessions.id, sessionId),
        eq(pomodoroSessions.userId, userId as string)
      ))
      .returning();
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update session error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// POST /pomodoro/sessions/:sessionId/tasks
app.post('/sessions/:sessionId/tasks', zValidator('json', createTaskSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const data = c.req.valid('json');
  
  try {
    // Verify session belongs to user
    const session = await db.select()
      .from(pomodoroSessions)
      .where(and(
        eq(pomodoroSessions.id, sessionId),
        eq(pomodoroSessions.userId, userId as string)
      ))
      .get();
    
    if (!session) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Session not found'),
        404 as ContentfulStatusCode
      );
    }
    
    // Get current max orderIndex
    const maxOrderResult = await db.select({
      maxOrder: sql<number>`MAX(${pomodoroTasks.orderIndex})`
    })
      .from(pomodoroTasks)
      .where(eq(pomodoroTasks.sessionId, sessionId))
      .get();
    
    const orderIndex = (maxOrderResult?.maxOrder || 0) + 1;
    
    // Create task
    const taskId = nanoid();
    const now = new Date().toISOString();
    
    await db.insert(pomodoroTasks).values({
      id: taskId,
      sessionId,
      todoId: data.todoId,
      description: data.description,
      orderIndex,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
    
    const newTask = await db.select()
      .from(pomodoroTasks)
      .where(eq(pomodoroTasks.id, taskId))
      .get();
    
    return c.json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /pomodoro/sessions/:sessionId/tasks/:taskId
app.put('/sessions/:sessionId/tasks/:taskId', zValidator('json', updateTaskSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const taskId = c.req.param('taskId');
  const { completed } = c.req.valid('json');
  
  try {
    // Verify session belongs to user
    const session = await db.select()
      .from(pomodoroSessions)
      .where(and(
        eq(pomodoroSessions.id, sessionId),
        eq(pomodoroSessions.userId, userId as string)
      ))
      .get();
    
    if (!session) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Session not found'),
        404 as ContentfulStatusCode
      );
    }
    
    const result = await db.update(pomodoroTasks)
      .set({
        completed,
        updatedAt: new Date().toISOString(),
      })
      .where(and(
        eq(pomodoroTasks.id, taskId),
        eq(pomodoroTasks.sessionId, sessionId)
      ))
      .returning();
    
    if (!result.length) {
      return c.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Task not found'),
        404 as ContentfulStatusCode
      );
    }
    
    return c.json(result[0]);
  } catch (error) {
    console.error('Update task error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// GET /pomodoro/config
app.get('/config', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  
  try {
    const config = await db.select()
      .from(pomodoroConfigs)
      .where(eq(pomodoroConfigs.userId, userId as string))
      .get();
    
    if (!config) {
      // Return default config
      return c.json({
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        cyclesBeforeLongBreak: 4,
        alarmSound: 'default',
        alarmVolume: 50,
        autoStartBreaks: true,
        autoStartWork: false,
      });
    }
    
    return c.json(config);
  } catch (error) {
    console.error('Get config error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// PUT /pomodoro/config
app.put('/config', zValidator('json', configSchema, springBootValidator), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const data = c.req.valid('json');
  
  try {
    const existing = await db.select()
      .from(pomodoroConfigs)
      .where(eq(pomodoroConfigs.userId, userId as string))
      .get();
    
    const now = new Date().toISOString();
    
    if (existing) {
      // Update existing config
      const result = await db.update(pomodoroConfigs)
        .set({
          ...data,
          updatedAt: now,
        })
        .where(eq(pomodoroConfigs.userId, userId as string))
        .returning();
      
      return c.json(result[0]);
    } else {
      // Create new config
      const newConfig = {
        id: nanoid(),
        userId: userId as string,
        workDuration: data.workDuration ?? 25,
        shortBreakDuration: data.shortBreakDuration ?? 5,
        longBreakDuration: data.longBreakDuration ?? 15,
        cyclesBeforeLongBreak: data.cyclesBeforeLongBreak ?? 4,
        alarmSound: data.alarmSound ?? 'default',
        alarmVolume: data.alarmVolume ?? 50,
        autoStartBreaks: data.autoStartBreaks ?? true,
        autoStartWork: data.autoStartWork ?? false,
        createdAt: now,
        updatedAt: now,
      };
      
      const result = await db.insert(pomodoroConfigs).values(newConfig).returning();
      return c.json(result[0], StatusCodes.CREATED as ContentfulStatusCode as ContentfulStatusCode);
    }
  } catch (error) {
    console.error('Update config error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

// GET /pomodoro/stats
app.get('/stats', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  // const fromDate = c.req.query('fromDate');
  // const toDate = c.req.query('toDate');
  
  try {
    const conditions = [
      eq(pomodoroSessions.userId, userId as string),
      eq(pomodoroSessions.status, 'COMPLETED')
    ];
    
    // Get completed sessions
    const sessions = await db.select()
      .from(pomodoroSessions)
      .where(and(...conditions));
    
    // Calculate stats
    const totalSessions = sessions.length;
    const totalCycles = sessions.reduce((sum, s) => sum + s.completedCycles, 0);
    const totalWorkMinutes = sessions.reduce((sum, s) => 
      sum + (s.completedCycles * s.workDuration), 0
    );
    
    return c.json({
      totalSessions,
      totalCycles,
      totalWorkMinutes,
      averageCyclesPerSession: totalSessions > 0 ? totalCycles / totalSessions : 0,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR),
      500 as ContentfulStatusCode
    );
  }
});

export default app;