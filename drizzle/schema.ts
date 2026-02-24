import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Interview sessions - tracks each mock interview attempt
 */
export const interviewSessions = mysqlTable("interview_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resumeUrl: text("resumeUrl").notNull(),
  resumeKey: varchar("resumeKey", { length: 512 }).notNull(),
  jobDescription: text("jobDescription").notNull(),
  jobRole: mysqlEnum("jobRole", ["programmer", "sales", "data_analyst"]).notNull(),
  resumeParsedData: json("resumeParsedData"), // Parsed resume information
  status: mysqlEnum("status", ["setup", "in_progress", "completed", "abandoned"]).default("setup").notNull(),
  overallScore: float("overallScore"),
  generalScore: float("generalScore"),
  roleSpecificScore: float("roleSpecificScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertInterviewSession = typeof interviewSessions.$inferInsert;

/**
 * Interview questions - AI-generated questions for each session
 */
export const interviewQuestions = mysqlTable("interview_questions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  questionNumber: int("questionNumber").notNull(),
  questionText: text("questionText").notNull(),
  questionContext: text("questionContext"), // Why this question was asked
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = typeof interviewQuestions.$inferInsert;

/**
 * Interview responses - user's audio responses and analysis
 */
export const interviewResponses = mysqlTable("interview_responses", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(),
  sessionId: int("sessionId").notNull(),
  audioUrl: text("audioUrl").notNull(),
  audioKey: varchar("audioKey", { length: 512 }).notNull(),
  transcription: text("transcription"),
  contentScore: float("contentScore"),
  toneScore: float("toneScore"),
  overallScore: float("overallScore"),
  analysis: json("analysis"), // Detailed AI analysis
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterviewResponse = typeof interviewResponses.$inferSelect;
export type InsertInterviewResponse = typeof interviewResponses.$inferInsert;

/**
 * Interview feedback - comprehensive feedback for completed sessions
 */
export const interviewFeedback = mysqlTable("interview_feedback", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().unique(),
  overallScore: float("overallScore").notNull(),
  generalScore: float("generalScore").notNull(),
  roleSpecificScore: float("roleSpecificScore").notNull(),
  strengths: json("strengths").notNull(), // Array of strength points
  weaknesses: json("weaknesses").notNull(), // Array of weakness points
  suggestions: json("suggestions").notNull(), // Array of actionable suggestions
  detailedAnalysis: json("detailedAnalysis"), // Per-question breakdown
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterviewFeedback = typeof interviewFeedback.$inferSelect;
export type InsertInterviewFeedback = typeof interviewFeedback.$inferInsert;
