import { db } from "./db";
import { eq, desc, and, isNull, ilike, or } from "drizzle-orm";
import { 
  users, lessons, lessonProgress, trades, portfolioItems, assignments, strategies,
  schools, classes, classStudents, achievements, userAchievements, tradingTips, marketInsights,
  type User, type InsertUser, type Lesson, type InsertLesson, type LessonProgress,
  type Trade, type InsertTrade, type PortfolioItem, type InsertPortfolioItem,
  type Assignment, type InsertAssignment, type School, type InsertSchool,
  type Class, type InsertClass, type ClassStudent, type InsertClassStudent,
  type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement,
  type TradingTip, type InsertTradingTip, type MarketInsight, type InsertMarketInsight
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
  searchUsers(query: string): Promise<User[]>;
  
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
  getPendingTrades(userId: string): Promise<Trade[]>;
  getAllActiveTrades(userId: string): Promise<Trade[]>;
  updateTrade(id: string, data: Partial<Trade>): Promise<Trade | undefined>;
  closeTrade(id: string, exitPrice: number): Promise<Trade | undefined>;
  cancelTrade(id: string): Promise<Trade | undefined>;
  getTradesByUser(userId: string): Promise<Trade[]>;
  getTotalTradesCount(): Promise<number>;
  getTradeById(id: string): Promise<Trade | undefined>;
  
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
  
  // Schools
  createSchool(data: InsertSchool): Promise<School>;
  getSchoolByAdmin(adminUserId: string): Promise<School | undefined>;
  updateSchool(id: string, data: Partial<School>): Promise<School | undefined>;
  
  // Classes
  createClass(data: InsertClass): Promise<Class>;
  getClassesByTeacher(teacherId: string): Promise<Class[]>;
  getClassById(id: string): Promise<Class | undefined>;
  getClassByJoinCode(joinCode: string): Promise<Class | undefined>;
  deleteClass(id: string): Promise<void>;
  
  // Class Students
  addStudentToClass(data: InsertClassStudent): Promise<ClassStudent>;
  getStudentsByClass(classId: string): Promise<User[]>;
  removeStudentFromClass(classId: string, studentId: string): Promise<void>;
  getClassesByStudent(studentId: string): Promise<Class[]>;
  
  // Achievements
  createAchievement(data: InsertAchievement): Promise<Achievement>;
  getAchievements(): Promise<Achievement[]>;
  getAchievementById(id: string): Promise<Achievement | undefined>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement>;
  updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<void>;
  createUserAchievement(data: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievement(id: string, updates: Partial<UserAchievement>): Promise<UserAchievement | undefined>;
  
  // Trading Tips
  createTradingTip(data: InsertTradingTip): Promise<TradingTip>;
  getTradingTips(): Promise<TradingTip[]>;
  getAllTradingTips(): Promise<TradingTip[]>;
  getTradingTipById(id: string): Promise<TradingTip | undefined>;
  updateTradingTip(id: string, data: Partial<TradingTip>): Promise<TradingTip | undefined>;
  deleteTradingTip(id: string): Promise<void>;
  
  // Market Insights
  createMarketInsight(data: InsertMarketInsight): Promise<MarketInsight>;
  getMarketInsights(): Promise<MarketInsight[]>;
  getAllMarketInsights(): Promise<MarketInsight[]>;
  getMarketInsightById(id: string): Promise<MarketInsight | undefined>;
  updateMarketInsight(id: string, data: Partial<MarketInsight>): Promise<MarketInsight | undefined>;
  deleteMarketInsight(id: string): Promise<void>;
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

  async searchUsers(query: string): Promise<User[]> {
    const searchPattern = `%${query}%`;
    return db.select().from(users)
      .where(
        or(
          ilike(users.displayName, searchPattern),
          ilike(users.email, searchPattern)
        )
      )
      .limit(20);
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
    
    const wasCompleted = existing.length > 0 && existing[0].completed;
    const isNewCompletion = completed && !wasCompleted;
    const isUncompletion = !completed && wasCompleted;
    
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
    
    // Update user's lessonsCompleted count
    if (isNewCompletion || isUncompletion) {
      const user = await this.getUserById(userId);
      if (user) {
        const currentCount = user.lessonsCompleted ?? 0;
        const newCount = isNewCompletion ? currentCount + 1 : Math.max(0, currentCount - 1);
        await this.updateUser(userId, { lessonsCompleted: newCount });
      }
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

  async getPendingTrades(userId: string): Promise<Trade[]> {
    return db.select().from(trades)
      .where(and(eq(trades.userId, userId), eq(trades.status, "pending")));
  }

  async getAllActiveTrades(userId: string): Promise<Trade[]> {
    return db.select().from(trades)
      .where(and(
        eq(trades.userId, userId),
        or(eq(trades.status, "open"), eq(trades.status, "pending"))
      ));
  }

  async updateTrade(id: string, data: Partial<Trade>): Promise<Trade | undefined> {
    const [trade] = await db.update(trades).set(data).where(eq(trades.id, id)).returning();
    return trade;
  }

  async getTradeById(id: string): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id)).limit(1);
    return trade;
  }

  async cancelTrade(id: string): Promise<Trade | undefined> {
    const [trade] = await db.update(trades)
      .set({ status: "cancelled", closedAt: new Date() })
      .where(eq(trades.id, id))
      .returning();
    return trade;
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

  // Schools
  async createSchool(data: InsertSchool): Promise<School> {
    const [school] = await db.insert(schools).values(data).returning();
    return school;
  }

  async getSchoolByAdmin(adminUserId: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.adminUserId, adminUserId)).limit(1);
    return school;
  }

  async updateSchool(id: string, data: Partial<School>): Promise<School | undefined> {
    const [school] = await db.update(schools).set(data).where(eq(schools.id, id)).returning();
    return school;
  }

  // Classes
  async createClass(data: InsertClass): Promise<Class> {
    const [cls] = await db.insert(classes).values(data).returning();
    return cls;
  }

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return db.select().from(classes).where(eq(classes.teacherId, teacherId));
  }

  async getClassById(id: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
    return cls;
  }

  async getClassByJoinCode(joinCode: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.joinCode, joinCode)).limit(1);
    return cls;
  }

  async deleteClass(id: string): Promise<void> {
    await db.delete(classStudents).where(eq(classStudents.classId, id));
    await db.delete(classes).where(eq(classes.id, id));
  }

  // Class Students
  async addStudentToClass(data: InsertClassStudent): Promise<ClassStudent> {
    const [cs] = await db.insert(classStudents).values(data).returning();
    return cs;
  }

  async getStudentsByClass(classId: string): Promise<User[]> {
    const studentLinks = await db.select().from(classStudents).where(eq(classStudents.classId, classId));
    const studentIds = studentLinks.map(s => s.studentId);
    if (studentIds.length === 0) return [];
    const students = await db.select().from(users);
    return students.filter(u => studentIds.includes(u.id));
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    await db.delete(classStudents).where(
      and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId))
    );
  }

  async getClassesByStudent(studentId: string): Promise<Class[]> {
    const enrollments = await db.select().from(classStudents).where(eq(classStudents.studentId, studentId));
    const classIds = enrollments.map(e => e.classId);
    if (classIds.length === 0) return [];
    const allClasses = await db.select().from(classes);
    return allClasses.filter(c => classIds.includes(c.id));
  }

  // Achievements
  async createAchievement(data: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db.insert(achievements).values(data).returning();
    return achievement;
  }

  async getAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }

  async getAchievementById(id: string): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id)).limit(1);
    return achievement;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    const existing = await db.select().from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
      .limit(1);
    if (existing.length > 0) {
      return existing[0];
    }
    const [ua] = await db.insert(userAchievements).values({
      userId,
      achievementId,
      progress: 100,
    }).returning();
    return ua;
  }

  async updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<void> {
    const existing = await db.select().from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
      .limit(1);
    if (existing.length > 0) {
      await db.update(userAchievements)
        .set({ progress, unlockedAt: progress >= 100 ? new Date() : null })
        .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)));
    } else {
      await db.insert(userAchievements).values({
        userId,
        achievementId,
        progress,
        unlockedAt: progress >= 100 ? new Date() : null,
      });
    }
  }

  async createUserAchievement(data: InsertUserAchievement): Promise<UserAchievement> {
    const [ua] = await db.insert(userAchievements).values(data).returning();
    return ua;
  }

  async updateUserAchievement(id: string, updates: Partial<UserAchievement>): Promise<UserAchievement | undefined> {
    const [ua] = await db.update(userAchievements).set(updates).where(eq(userAchievements.id, id)).returning();
    return ua;
  }

  async deleteUserAccount(userId: string): Promise<void> {
    // Delete user achievements
    await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
    
    // Delete trades
    await db.delete(trades).where(eq(trades.userId, userId));
    
    // Delete portfolio items
    await db.delete(portfolioItems).where(eq(portfolioItems.userId, userId));
    
    // Delete lesson progress
    await db.delete(lessonProgress).where(eq(lessonProgress.userId, userId));
    
    // Remove from class enrollments
    await db.delete(classStudents).where(eq(classStudents.studentId, userId));
    
    // If teacher, delete their classes
    await db.delete(classes).where(eq(classes.teacherId, userId));
    
    // Delete assignments created by this user (if teacher)
    await db.delete(assignments).where(eq(assignments.teacherId, userId));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  // Trading Tips
  async createTradingTip(data: InsertTradingTip): Promise<TradingTip> {
    const [tip] = await db.insert(tradingTips).values(data).returning();
    return tip;
  }

  async getTradingTips(): Promise<TradingTip[]> {
    return db.select().from(tradingTips).where(eq(tradingTips.isPublished, true)).orderBy(desc(tradingTips.createdAt));
  }

  async getAllTradingTips(): Promise<TradingTip[]> {
    return db.select().from(tradingTips).orderBy(desc(tradingTips.createdAt));
  }

  async getTradingTipById(id: string): Promise<TradingTip | undefined> {
    const [tip] = await db.select().from(tradingTips).where(eq(tradingTips.id, id)).limit(1);
    return tip;
  }

  async updateTradingTip(id: string, data: Partial<TradingTip>): Promise<TradingTip | undefined> {
    const [tip] = await db.update(tradingTips).set(data).where(eq(tradingTips.id, id)).returning();
    return tip;
  }

  async deleteTradingTip(id: string): Promise<void> {
    await db.delete(tradingTips).where(eq(tradingTips.id, id));
  }

  // Market Insights
  async createMarketInsight(data: InsertMarketInsight): Promise<MarketInsight> {
    const [insight] = await db.insert(marketInsights).values(data).returning();
    return insight;
  }

  async getMarketInsights(): Promise<MarketInsight[]> {
    return db.select().from(marketInsights).where(eq(marketInsights.isPublished, true)).orderBy(desc(marketInsights.createdAt));
  }

  async getAllMarketInsights(): Promise<MarketInsight[]> {
    return db.select().from(marketInsights).orderBy(desc(marketInsights.createdAt));
  }

  async getMarketInsightById(id: string): Promise<MarketInsight | undefined> {
    const [insight] = await db.select().from(marketInsights).where(eq(marketInsights.id, id)).limit(1);
    return insight;
  }

  async updateMarketInsight(id: string, data: Partial<MarketInsight>): Promise<MarketInsight | undefined> {
    const [insight] = await db.update(marketInsights).set(data).where(eq(marketInsights.id, id)).returning();
    return insight;
  }

  async deleteMarketInsight(id: string): Promise<void> {
    await db.delete(marketInsights).where(eq(marketInsights.id, id));
  }
}

export const storage = new DatabaseStorage();
