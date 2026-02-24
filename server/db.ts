import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  interviewSessions, 
  InsertInterviewSession,
  interviewQuestions,
  InsertInterviewQuestion,
  interviewResponses,
  InsertInterviewResponse,
  interviewFeedback,
  InsertInterviewFeedback
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Interview Session Queries

export async function createInterviewSession(session: InsertInterviewSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(interviewSessions).values(session);
  return result[0].insertId;
}

export async function getInterviewSession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(interviewSessions).where(eq(interviewSessions.id, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserInterviewSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .orderBy(desc(interviewSessions.createdAt));
}

export async function updateInterviewSession(sessionId: number, updates: Partial<InsertInterviewSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(interviewSessions).set(updates).where(eq(interviewSessions.id, sessionId));
}

// Interview Question Queries

export async function createInterviewQuestion(question: InsertInterviewQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(interviewQuestions).values(question);
  return result[0].insertId;
}

export async function getSessionQuestions(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(interviewQuestions)
    .where(eq(interviewQuestions.sessionId, sessionId))
    .orderBy(interviewQuestions.questionNumber);
}

export async function getQuestionById(questionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, questionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Interview Response Queries

export async function createInterviewResponse(response: InsertInterviewResponse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(interviewResponses).values(response);
  return result[0].insertId;
}

export async function getSessionResponses(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(interviewResponses)
    .where(eq(interviewResponses.sessionId, sessionId));
}

export async function getQuestionResponse(questionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(interviewResponses)
    .where(eq(interviewResponses.questionId, questionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInterviewResponse(responseId: number, updates: Partial<InsertInterviewResponse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(interviewResponses).set(updates).where(eq(interviewResponses.id, responseId));
}

// Interview Feedback Queries

export async function createInterviewFeedback(feedback: InsertInterviewFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(interviewFeedback).values(feedback);
  return result[0].insertId;
}

export async function getSessionFeedback(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(interviewFeedback)
    .where(eq(interviewFeedback.sessionId, sessionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Clear functions for restart interview

export async function clearSessionQuestions(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(interviewQuestions).where(eq(interviewQuestions.sessionId, sessionId));
}

export async function clearSessionResponses(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(interviewResponses).where(eq(interviewResponses.sessionId, sessionId));
}

export async function clearSessionFeedback(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(interviewFeedback).where(eq(interviewFeedback.sessionId, sessionId));
}
