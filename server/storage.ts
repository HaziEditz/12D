import { db } from "./db";
import { eq, desc, and, isNull } from "drizzle-orm";
import { 
  users, lessons, lessonProgress, trades, portfolioItems, assignments, strategies,
  type User, type InsertUser, type Lesson, type InsertLesson, type LessonProgress,
  type Trade, type InsertTrade, type PortfolioItem, type InsertPortfolioItem,
  type Assignment, type InsertAssignment
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  createUser(data: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getLeaderboard(): Promise<User[]>;
  getStudentsByTeacher(teacherId: string): Promise<User[]>;
  
  // Lessons
  createLesson(data: InsertLesson): Promise<Lesson>;
  getLessons(): Promise<Lesson[]>;
  getLessonById(id: string): Promise<Lesson | undefined>;
  updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<void>;
  
  // Lesson Progress
  getLessonProgress(userId: string): Promise<LessonProgress[]>;
  updateLessonProgress(userId: string, lessonId: string, completed: boolean): Promise<void>;
  
  // Trades
  createTrade(data: InsertTrade): Promise<Trade>;
  getOpenTrades(userId: string): Promise<Trade[]>;
  closeTrade(id: string, exitPrice: number): Promise<Trade | undefined>;
  getTradesByUser(userId: string): Promise<Trade[]>;
  getTotalTradesCount(): Promise<number>;
  
  // Portfolio
  getPortfolio(userId: string): Promise<PortfolioItem[]>;
  createPortfolioItem(data: InsertPortfolioItem): Promise<PortfolioItem>;
  updatePortfolioItem(id: string, data: Partial<PortfolioItem>): Promise<PortfolioItem | undefined>;
  deletePortfolioItem(id: string): Promise<void>;
  
  // Assignments
  createAssignment(data: InsertAssignment): Promise<Assignment>;
  getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]>;
  
  // Admin stats
  getUsersCount(): Promise<number>;
  getLessonsCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async createUser(data: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const [user] = await db.insert(users).values({
      ...data,
      password: hashedPassword,
    }).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getLeaderboard(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.totalProfit)).limit(50);
  }

  async getStudentsByTeacher(teacherId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.teacherId, teacherId));
  }

  // Lessons
  async createLesson(data: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(data).returning();
    return lesson;
  }

  async getLessons(): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.isPublished, true)).orderBy(lessons.order);
  }

  async getLessonById(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    return lesson;
  }

  async updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson | undefined> {
    const [lesson] = await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
    return lesson;
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  // Lesson Progress
  async getLessonProgress(userId: string): Promise<LessonProgress[]> {
    return db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
  }

  async updateLessonProgress(userId: string, lessonId: string, completed: boolean): Promise<void> {
    const existing = await db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
      .limit(1);
    
    if (existing.length > 0) {
      await db.update(lessonProgress)
        .set({ completed, completedAt: completed ? new Date() : null })
        .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));
    } else {
      await db.insert(lessonProgress).values({
        userId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
      });
    }
  }

  // Trades
  async createTrade(data: InsertTrade): Promise<Trade> {
    const [trade] = await db.insert(trades).values(data).returning();
    return trade;
  }

  async getOpenTrades(userId: string): Promise<Trade[]> {
    return db.select().from(trades)
      .where(and(eq(trades.userId, userId), eq(trades.status, "open")));
  }

  async closeTrade(id: string, exitPrice: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id)).limit(1);
    if (!trade) return undefined;

    const profit = trade.type === "buy" 
      ? (exitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - exitPrice) * trade.quantity;

    const [updatedTrade] = await db.update(trades)
      .set({ 
        status: "closed", 
        exitPrice, 
        closedAt: new Date(),
        profit,
      })
      .where(eq(trades.id, id))
      .returning();

    // Update user balance and total profit
    if (updatedTrade) {
      const user = await this.getUserById(trade.userId);
      if (user) {
        await this.updateUser(user.id, {
          simulatorBalance: user.simulatorBalance + profit,
          totalProfit: (user.totalProfit ?? 0) + profit,
        });
      }
    }

    return updatedTrade;
  }

  async getTradesByUser(userId: string): Promise<Trade[]> {
    return db.select().from(trades).where(eq(trades.userId, userId));
  }

  async getTotalTradesCount(): Promise<number> {
    const result = await db.select().from(trades);
    return result.length;
  }

  // Portfolio
  async getPortfolio(userId: string): Promise<PortfolioItem[]> {
    return db.select().from(portfolioItems).where(eq(portfolioItems.userId, userId));
  }

  async createPortfolioItem(data: InsertPortfolioItem): Promise<PortfolioItem> {
    const [item] = await db.insert(portfolioItems).values(data).returning();
    return item;
  }

  async updatePortfolioItem(id: string, data: Partial<PortfolioItem>): Promise<PortfolioItem | undefined> {
    const [item] = await db.update(portfolioItems).set(data).where(eq(portfolioItems.id, id)).returning();
    return item;
  }

  async deletePortfolioItem(id: string): Promise<void> {
    await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
  }

  // Assignments
  async createAssignment(data: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db.insert(assignments).values(data).returning();
    return assignment;
  }

  async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    return db.select().from(assignments).where(eq(assignments.teacherId, teacherId));
  }

  // Admin stats
  async getUsersCount(): Promise<number> {
    const result = await db.select().from(users);
    return result.length;
  }

  async getLessonsCount(): Promise<number> {
    const result = await db.select().from(lessons);
    return result.length;
  }
}

export const storage = new DatabaseStorage();
