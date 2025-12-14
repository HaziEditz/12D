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
  trialStartDate: timestamp("trial_start_date").defaultNow(),
  subscriptionId: text("subscription_id"),
  simulatorBalance: real("simulator_balance").default(5000),
  totalProfit: real("total_profit").default(0),
  lessonsCompleted: integer("lessons_completed").default(0),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  teacherId: varchar("teacher_id"),
  schoolEmail: text("school_email"),
  dailyTradesCount: integer("daily_trades_count").default(0),
  lastTradeDate: text("last_trade_date"),
  xp: integer("xp").default(0),
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
  orderType: text("order_type").notNull().default("market"),
  quantity: real("quantity").notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  triggerPrice: real("trigger_price"),
  stopLossPrice: real("stop_loss_price"),
  takeProfitPrice: real("take_profit_price"),
  trailingPercent: real("trailing_percent"),
  trailingHighPrice: real("trailing_high_price"),
  linkedTradeId: varchar("linked_trade_id"),
  leverage: real("leverage").default(1),
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
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  adminUserId: varchar("admin_user_id").notNull(),
  subscriptionId: text("subscription_id"),
  seatCount: integer("seat_count").default(0),
  seatsUsed: integer("seats_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  joinCode: text("join_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classStudents = pgTable("class_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  studentId: varchar("student_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  requirement: integer("requirement").notNull(),
  xpReward: integer("xp_reward").notNull().default(10),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  achievementId: varchar("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").default(0),
});

export const tradingTips = pgTable("trading_tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  iconName: text("icon_name").notNull().default("Lightbulb"),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketInsights = pgTable("market_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  sentiment: text("sentiment").notNull(),
  sector: text("sector").notNull(),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchlistItems = pgTable("watchlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tradeId: varchar("trade_id"),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  quantity: real("quantity").notNull(),
  pnl: real("pnl"),
  notes: text("notes"),
  strategy: text("strategy"),
  emotions: text("emotions"),
  lessons: text("lessons"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, openedAt: true });
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true });
export const insertAssignmentProgressSchema = createInsertSchema(assignmentProgress).omit({ id: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true });
export const insertStrategySchema = createInsertSchema(strategies).omit({ id: true, createdAt: true });
export const insertSchoolSchema = createInsertSchema(schools).omit({ id: true, createdAt: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
export const insertClassStudentSchema = createInsertSchema(classStudents).omit({ id: true, joinedAt: true });
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true });
export const insertTradingTipSchema = createInsertSchema(tradingTips).omit({ id: true, createdAt: true });
export const insertMarketInsightSchema = createInsertSchema(marketInsights).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertWatchlistItemSchema = createInsertSchema(watchlistItems).omit({ id: true, addedAt: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

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
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClassStudent = z.infer<typeof insertClassStudentSchema>;
export type ClassStudent = typeof classStudents.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertTradingTip = z.infer<typeof insertTradingTipSchema>;
export type TradingTip = typeof tradingTips.$inferSelect;
export type InsertMarketInsight = z.infer<typeof insertMarketInsightSchema>;
export type MarketInsight = typeof marketInsights.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

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
