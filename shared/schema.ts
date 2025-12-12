import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const membershipTiers = ["school", "casual", "premium"] as const;
export type MembershipTier = typeof membershipTiers[number];

export const userRoles = ["student", "teacher", "admin"] as const;
export type UserRole = typeof userRoles[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("student"),
  membershipTier: text("membership_tier"),
  membershipStatus: text("membership_status").default("inactive"),
  simulatorBalance: real("simulator_balance").default(10000),
  totalProfit: real("total_profit").default(0),
  lessonsCompleted: integer("lessons_completed").default(0),
  avatarUrl: text("avatar_url"),
  teacherId: varchar("teacher_id"),
  schoolEmail: text("school_email"),
});

export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  duration: integer("duration").notNull(),
  order: integer("order").notNull(),
  isPublished: boolean("is_published").default(true),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  lessonId: varchar("lesson_id").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(),
  quantity: real("quantity").notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  profit: real("profit"),
  status: text("status").notNull().default("open"),
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const portfolioItems = pgTable("portfolio_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  purchasePrice: real("purchase_price").notNull(),
  currentPrice: real("current_price").notNull(),
  quantity: real("quantity").notNull(),
  notes: text("notes"),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  targetProfit: real("target_profit"),
});

export const assignmentProgress = pgTable("assignment_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  studentId: varchar("student_id").notNull(),
  completed: boolean("completed").default(false),
  profit: real("profit").default(0),
  completedAt: timestamp("completed_at"),
});

export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  friendId: varchar("friend_id").notNull(),
  status: text("status").notNull().default("pending"),
});

export const strategies = pgTable("strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, openedAt: true });
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true });
export const insertAssignmentProgressSchema = createInsertSchema(assignmentProgress).omit({ id: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true });
export const insertStrategySchema = createInsertSchema(strategies).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignmentProgress = z.infer<typeof insertAssignmentProgressSchema>;
export type AssignmentProgress = typeof assignmentProgress.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Strategy = typeof strategies.$inferSelect;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  role: z.enum(userRoles).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
