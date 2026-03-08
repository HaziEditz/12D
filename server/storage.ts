import { db } from "./db";
import { eq, desc, asc, and, isNull, ilike, or, sql } from "drizzle-orm";
import { 
  users, lessons, lessonProgress, trades, portfolioItems, assignments, strategies,
  schools, classes, classStudents, achievements, userAchievements, tradingTips, marketInsights,
  friendships, chatMessages, watchlistItems, journalEntries, notifications, promoCodes,
  quizzes, quizAttempts, priceAlerts, classroomEvents, funZoneScores,
  type User, type InsertUser, type Lesson, type InsertLesson, type LessonProgress,
  type Trade, type InsertTrade, type PortfolioItem, type InsertPortfolioItem,
  type Assignment, type InsertAssignment, type School, type InsertSchool,
  type Class, type InsertClass, type ClassStudent, type InsertClassStudent,
  type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement,
  type TradingTip, type InsertTradingTip, type MarketInsight, type InsertMarketInsight,
  type Friendship, type InsertFriendship, type Strategy, type InsertStrategy,
  type ChatMessage, type InsertChatMessage,
  type WatchlistItem, type InsertWatchlistItem, type JournalEntry, type InsertJournalEntry,
  type Notification, type InsertNotification,
  type PromoCode, type InsertPromoCode,
  type Quiz, type InsertQuiz, type QuizAttempt, type InsertQuizAttempt,
  type PriceAlert, type InsertPriceAlert,
  type ClassroomEvent, type InsertClassroomEvent,
  type FunZoneScore, type InsertFunZoneScore
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  createUser(data: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getLeaderboard(scope?: string, userId?: string): Promise<User[]>;
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
  getAssignmentsByClass(classId: string): Promise<Assignment[]>;
  getAssignmentProgress(assignmentId: string): Promise<AssignmentProgress[]>;
  getAssignmentProgressForStudent(studentId: string): Promise<AssignmentProgress[]>;
  updateAssignmentProgress(data: InsertAssignmentProgress): Promise<AssignmentProgress>;
  getAssignmentById(id: string): Promise<Assignment | undefined>;
  
  // Admin stats
  getUsersCount(): Promise<number>;
  getLessonsCount(): Promise<number>;
  
  // Schools
  createSchool(data: InsertSchool): Promise<School>;
  getSchoolByAdmin(adminUserId: string): Promise<School | undefined>;
  updateSchool(id: string, data: Partial<School>): Promise<School | undefined>;
  
  // Schools
  getSchools(): Promise<School[]>;

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
  upsertAchievement(data: InsertAchievement): Promise<Achievement>;
  getAchievements(): Promise<Achievement[]>;
  getAchievementById(id: string): Promise<Achievement | undefined>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement>;
  updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<void>;
  createUserAchievement(data: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievement(id: string, updates: Partial<UserAchievement>): Promise<UserAchievement | undefined>;
  getAchievementStats(): Promise<{achievementId: string, count: number, percentage: number}[]>;
  
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
  getMarketInsightsCount(): Promise<number>;

  // Strategies
  createStrategy(data: InsertStrategy): Promise<Strategy>;
  getStrategies(): Promise<Strategy[]>;
  getAllStrategies(): Promise<Strategy[]>;
  getStrategyById(id: string): Promise<Strategy | undefined>;
  updateStrategy(id: string, data: Partial<Strategy>): Promise<Strategy | undefined>;
  deleteStrategy(id: string): Promise<void>;
  
  // Friends
  getFriends(userId: string): Promise<{friendship: Friendship, friend: User}[]>;
  getFriendRequests(userId: string): Promise<{friendship: Friendship, sender: User}[]>;
  sendFriendRequest(userId: string, friendId: string): Promise<Friendship>;
  acceptFriendRequest(id: string): Promise<Friendship | undefined>;
  rejectFriendRequest(id: string): Promise<void>;
  removeFriend(id: string, userId: string): Promise<void>;
  getFriendshipById(id: string): Promise<Friendship | undefined>;
  getFriendCount(userId: string): Promise<number>;
  
  // Simulated Prices
  getSimulatedPrices(): Promise<Record<string, number>>;
  updateSimulatedPrice(symbol: string, price: number): Promise<void>;
  
  // Chat Messages
  getChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]>;
  sendChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
  
  // Watchlist
  getWatchlist(userId: string): Promise<WatchlistItem[]>;
  addWatchlistItem(data: InsertWatchlistItem): Promise<WatchlistItem>;
  removeWatchlistItem(userId: string, symbol: string): Promise<void>;
  
  // Journal
  getJournalEntries(userId: string): Promise<JournalEntry[]>;
  createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: string): Promise<void>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<void>;

  createPromoCode(data: InsertPromoCode): Promise<PromoCode>;
  getPromoCodes(): Promise<PromoCode[]>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode | undefined>;
  deletePromoCode(id: string): Promise<void>;
  incrementPromoCodeUsed(id: string): Promise<void>;

  createQuiz(data: InsertQuiz): Promise<Quiz>;
  getQuizByLessonId(lessonId: string): Promise<Quiz | undefined>;
  updateQuiz(id: string, data: Partial<Quiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<void>;
  createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]>;
  getBestQuizAttempt(userId: string, lessonId: string): Promise<QuizAttempt | undefined>;

  createPriceAlert(data: InsertPriceAlert): Promise<PriceAlert>;
  getPriceAlertsByUser(userId: string): Promise<PriceAlert[]>;
  deletePriceAlert(id: string, userId: string): Promise<void>;
  triggerPriceAlert(id: string): Promise<void>;
  getActivePriceAlerts(): Promise<PriceAlert[]>;

  getUserByUsername(username: string): Promise<User | undefined>;
  getFinancialStats(): Promise<{ totalUsers: number; activeSubscribers: number; trialUsers: number; byTier: Record<string, number>; recentSignups: User[] }>;
  createClassroomEvent(data: InsertClassroomEvent): Promise<ClassroomEvent>;
  getClassroomEvents(classId: string): Promise<ClassroomEvent[]>;
  deleteClassroomEvent(id: string): Promise<void>;
  addClassroomTokens(userId: string, tokens: number): Promise<void>;
  saveFunZoneScore(data: InsertFunZoneScore): Promise<FunZoneScore>;
  getFunZoneLeaderboard(game: string): Promise<{ userId: string; displayName: string; score: number }[]>;
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

  async getLeaderboard(scope?: string, userId?: string): Promise<User[]> {
    if (scope === "class" && userId) {
      const enrollments = await db.select().from(classStudents).where(eq(classStudents.studentId, userId));
      if (enrollments.length > 0) {
        const classIds = enrollments.map(e => e.classId);
        const classmateEnrollments = await db.select().from(classStudents).where(sql`${classStudents.classId} IN ${classIds}`);
        const classmateIds = [...new Set(classmateEnrollments.map(e => e.studentId))];
        return db.select().from(users).where(sql`${users.id} IN ${classmateIds}`).orderBy(desc(users.totalProfit));
      }
    } else if (scope === "friends" && userId) {
      const friendsData = await this.getFriends(userId);
      const friendIds = friendsData.map(f => f.friend.id);
      friendIds.push(userId); // Include self in friends leaderboard
      return db.select().from(users).where(sql`${users.id} IN ${friendIds}`).orderBy(desc(users.totalProfit));
    }
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

    const leverage = trade.leverage ?? 1;
    const baseProfit = trade.type === "buy" 
      ? (exitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - exitPrice) * trade.quantity;
    const profit = baseProfit * leverage;

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

  async getAssignmentsByClass(classId: string): Promise<Assignment[]> {
    return db.select().from(assignments).where(eq(assignments.classId, classId));
  }

  async getAssignmentProgress(assignmentId: string): Promise<AssignmentProgress[]> {
    return db.select().from(assignmentProgress).where(eq(assignmentProgress.assignmentId, assignmentId));
  }

  async getAssignmentProgressForStudent(studentId: string): Promise<AssignmentProgress[]> {
    return db.select().from(assignmentProgress).where(eq(assignmentProgress.studentId, studentId));
  }

  async updateAssignmentProgress(data: InsertAssignmentProgress): Promise<AssignmentProgress> {
    const existing = await db.select().from(assignmentProgress)
      .where(and(eq(assignmentProgress.assignmentId, data.assignmentId), eq(assignmentProgress.studentId, data.studentId)))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(assignmentProgress)
        .set(data)
        .where(eq(assignmentProgress.id, existing[0].id))
        .returning();
      return updated;
    }

    const [inserted] = await db.insert(assignmentProgress).values(data).returning();
    return inserted;
  }

  async getAssignmentById(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
    return assignment;
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

  async getSchools(): Promise<School[]> {
    return db.select().from(schools);
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

  async upsertAchievement(data: InsertAchievement): Promise<Achievement> {
    const existing = await this.getAchievementById(data.id);
    if (existing) {
      const [updated] = await db.update(achievements)
        .set(data)
        .where(eq(achievements.id, data.id))
        .returning();
      return updated;
    }
    return this.createAchievement(data);
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

  async getAchievementStats(): Promise<{achievementId: string, count: number, percentage: number}[]> {
    const allTraders = await db.select().from(users).where(eq(users.role, "student"));
    const traderCount = allTraders.length || 1;
    const allUserAchievements = await db.select().from(userAchievements).where(eq(userAchievements.progress, 100));
    const countMap = new Map<string, number>();
    for (const ua of allUserAchievements) {
      countMap.set(ua.achievementId, (countMap.get(ua.achievementId) || 0) + 1);
    }
    const allAchievements = await db.select().from(achievements);
    return allAchievements.map(a => ({
      achievementId: a.id,
      count: countMap.get(a.id) || 0,
      percentage: Math.round(((countMap.get(a.id) || 0) / traderCount) * 100)
    }));
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

  async getMarketInsightsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(marketInsights);
    return Number(result[0].count);
  }

  // Strategies
  async createStrategy(data: InsertStrategy): Promise<Strategy> {
    const [strategy] = await db.insert(strategies).values(data).returning();
    return strategy;
  }

  async getStrategies(): Promise<Strategy[]> {
    return db.select().from(strategies).where(eq(strategies.isPublished, true)).orderBy(desc(strategies.createdAt));
  }

  async getAllStrategies(): Promise<Strategy[]> {
    return db.select().from(strategies).orderBy(desc(strategies.createdAt));
  }

  async getStrategyById(id: string): Promise<Strategy | undefined> {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id)).limit(1);
    return strategy;
  }

  async updateStrategy(id: string, data: Partial<Strategy>): Promise<Strategy | undefined> {
    const [strategy] = await db.update(strategies).set(data).where(eq(strategies.id, id)).returning();
    return strategy;
  }

  async deleteStrategy(id: string): Promise<void> {
    await db.delete(strategies).where(eq(strategies.id, id));
  }

  // Friends
  async getFriends(userId: string): Promise<{friendship: Friendship, friend: User}[]> {
    const sent = await db.select().from(friendships).where(and(eq(friendships.userId, userId), eq(friendships.status, "accepted")));
    const received = await db.select().from(friendships).where(and(eq(friendships.friendId, userId), eq(friendships.status, "accepted")));
    
    const result: {friendship: Friendship, friend: User}[] = [];
    for (const f of sent) {
      const friend = await this.getUserById(f.friendId);
      if (friend) result.push({ friendship: f, friend });
    }
    for (const f of received) {
      const friend = await this.getUserById(f.userId);
      if (friend) result.push({ friendship: f, friend });
    }
    return result;
  }

  async getFriendRequests(userId: string): Promise<{friendship: Friendship, sender: User}[]> {
    const requests = await db.select().from(friendships).where(and(eq(friendships.friendId, userId), eq(friendships.status, "pending")));
    const result: {friendship: Friendship, sender: User}[] = [];
    for (const f of requests) {
      const sender = await this.getUserById(f.userId);
      if (sender) result.push({ friendship: f, sender });
    }
    return result;
  }

  async sendFriendRequest(userId: string, friendId: string): Promise<Friendship> {
    // Check if friendship already exists in either direction
    const existingSent = await db.select().from(friendships).where(
      and(eq(friendships.userId, userId), eq(friendships.friendId, friendId))
    ).limit(1);
    const existingReceived = await db.select().from(friendships).where(
      and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
    ).limit(1);
    
    if (existingSent.length > 0 || existingReceived.length > 0) {
      throw new Error("Friendship already exists or pending");
    }
    
    const [friendship] = await db.insert(friendships).values({ userId, friendId, status: "pending" }).returning();
    return friendship;
  }

  async acceptFriendRequest(id: string): Promise<Friendship | undefined> {
    const [friendship] = await db.update(friendships).set({ status: "accepted" }).where(eq(friendships.id, id)).returning();
    return friendship;
  }

  async rejectFriendRequest(id: string): Promise<void> {
    await db.delete(friendships).where(eq(friendships.id, id));
  }

  async removeFriend(id: string, userId: string): Promise<void> {
    const f = await this.getFriendshipById(id);
    if (f && (f.userId === userId || f.friendId === userId)) {
      await db.delete(friendships).where(eq(friendships.id, id));
    }
  }

  async getFriendshipById(id: string): Promise<Friendship | undefined> {
    const [f] = await db.select().from(friendships).where(eq(friendships.id, id)).limit(1);
    return f;
  }

  async getFriendCount(userId: string): Promise<number> {
    const friends = await this.getFriends(userId);
    return friends.length;
  }

  // Simulated Prices
  private simulatedPrices: Record<string, number> = {};

  async getSimulatedPrices(): Promise<Record<string, number>> {
    return this.simulatedPrices;
  }

  async updateSimulatedPrice(symbol: string, price: number): Promise<void> {
    this.simulatedPrices[symbol] = price;
  }

  // Chat Messages
  async getChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(
        or(
          and(eq(chatMessages.senderId, userId1), eq(chatMessages.receiverId, userId2)),
          and(eq(chatMessages.senderId, userId2), eq(chatMessages.receiverId, userId1))
        )
      )
      .orderBy(asc(chatMessages.createdAt));
  }

  async sendChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(data).returning();
    return message;
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await db.update(chatMessages)
      .set({ isRead: true })
      .where(and(eq(chatMessages.senderId, senderId), eq(chatMessages.receiverId, receiverId)));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(and(eq(chatMessages.receiverId, userId), eq(chatMessages.isRead, false)));
    return result[0]?.count ?? 0;
  }

  // Watchlist
  async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    return db.select().from(watchlistItems).where(eq(watchlistItems.userId, userId)).orderBy(desc(watchlistItems.addedAt));
  }

  async addWatchlistItem(data: InsertWatchlistItem): Promise<WatchlistItem> {
    const [item] = await db.insert(watchlistItems).values(data).returning();
    return item;
  }

  async removeWatchlistItem(userId: string, symbol: string): Promise<void> {
    await db.delete(watchlistItems).where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.symbol, symbol)));
  }

  // Journal
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    return db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt));
  }

  async createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry> {
    const [entry] = await db.insert(journalEntries).values(data).returning();
    return entry;
  }

  async updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const [entry] = await db.update(journalEntries).set(data).where(eq(journalEntries.id, id)).returning();
    return entry;
  }

  async deleteJournalEntry(id: string): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count ?? 0;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async markNotificationRead(id: string, userId: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId))).returning();
    return notification;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async createPromoCode(data: InsertPromoCode): Promise<PromoCode> {
    const [code] = await db.insert(promoCodes).values({ ...data, code: data.code.toUpperCase() }).returning();
    return code;
  }

  async getPromoCodes(): Promise<PromoCode[]> {
    return await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [result] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
    return result;
  }

  async updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode | undefined> {
    const [result] = await db.update(promoCodes).set(data).where(eq(promoCodes.id, id)).returning();
    return result;
  }

  async deletePromoCode(id: string): Promise<void> {
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }

  async incrementPromoCodeUsed(id: string): Promise<void> {
    await db.update(promoCodes).set({ usedCount: sql`${promoCodes.usedCount} + 1` }).where(eq(promoCodes.id, id));
  }

  async createQuiz(data: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(data).returning();
    return quiz;
  }

  async getQuizByLessonId(lessonId: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
    return quiz;
  }

  async updateQuiz(id: string, data: Partial<Quiz>): Promise<Quiz | undefined> {
    const [quiz] = await db.update(quizzes).set(data).where(eq(quizzes.id, id)).returning();
    return quiz;
  }

  async deleteQuiz(id: string): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  async createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(data).returning();
    return attempt;
  }

  async getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(desc(quizAttempts.completedAt));
  }

  async getBestQuizAttempt(userId: string, lessonId: string): Promise<QuizAttempt | undefined> {
    const attempts = await db.select().from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.lessonId, lessonId)))
      .orderBy(desc(quizAttempts.score));
    return attempts[0];
  }

  async createPriceAlert(data: InsertPriceAlert): Promise<PriceAlert> {
    const [alert] = await db.insert(priceAlerts).values(data).returning();
    return alert;
  }

  async getPriceAlertsByUser(userId: string): Promise<PriceAlert[]> {
    return await db.select().from(priceAlerts).where(eq(priceAlerts.userId, userId)).orderBy(desc(priceAlerts.createdAt));
  }

  async deletePriceAlert(id: string, userId: string): Promise<void> {
    await db.delete(priceAlerts).where(and(eq(priceAlerts.id, id), eq(priceAlerts.userId, userId)));
  }

  async triggerPriceAlert(id: string): Promise<void> {
    await db.update(priceAlerts).set({ triggered: true }).where(eq(priceAlerts.id, id));
  }

  async getActivePriceAlerts(): Promise<PriceAlert[]> {
    return await db.select().from(priceAlerts).where(eq(priceAlerts.triggered, false));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getFinancialStats(): Promise<{ totalUsers: number; activeSubscribers: number; trialUsers: number; byTier: Record<string, number>; recentSignups: User[] }> {
    const allUsers = await db.select().from(users).where(sql`${users.role} != 'admin'`);
    const totalUsers = allUsers.length;
    const activeSubscribers = allUsers.filter(u => u.membershipStatus === "active").length;
    const trialUsers = allUsers.filter(u => u.membershipStatus !== "active").length;
    const byTier: Record<string, number> = { school: 0, casual: 0, premium: 0 };
    for (const u of allUsers.filter(u => u.membershipStatus === "active" && u.membershipTier)) {
      const tier = u.membershipTier!;
      byTier[tier] = (byTier[tier] || 0) + 1;
    }
    const recentSignups = await db.select().from(users).where(sql`${users.role} != 'admin'`).orderBy(desc(users.trialStartDate)).limit(10);
    return { totalUsers, activeSubscribers, trialUsers, byTier, recentSignups };
  }

  async createClassroomEvent(data: InsertClassroomEvent): Promise<ClassroomEvent> {
    const [event] = await db.insert(classroomEvents).values(data).returning();
    return event;
  }

  async getClassroomEvents(classId: string): Promise<ClassroomEvent[]> {
    return db.select().from(classroomEvents).where(and(eq(classroomEvents.classId, classId), eq(classroomEvents.isActive, true))).orderBy(desc(classroomEvents.createdAt));
  }

  async deleteClassroomEvent(id: string): Promise<void> {
    await db.update(classroomEvents).set({ isActive: false }).where(eq(classroomEvents.id, id));
  }

  async addClassroomTokens(userId: string, tokens: number): Promise<void> {
    await db.update(users).set({ classroomTokens: sql`${users.classroomTokens} + ${tokens}` }).where(eq(users.id, userId));
  }

  async saveFunZoneScore(data: InsertFunZoneScore): Promise<FunZoneScore> {
    const [score] = await db.insert(funZoneScores).values(data).returning();
    return score;
  }

  async getFunZoneLeaderboard(game: string): Promise<{ userId: string; displayName: string; score: number }[]> {
    const results = await db.select({ userId: funZoneScores.userId, score: funZoneScores.score, displayName: users.displayName })
      .from(funZoneScores)
      .innerJoin(users, eq(funZoneScores.userId, users.id))
      .where(eq(funZoneScores.game, game))
      .orderBy(desc(funZoneScores.score))
      .limit(20);
    return results;
  }

  async checkAndAwardAchievements(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) return;

    const trades = await this.getTradesByUser(userId);
    const lessonProgress = await this.getLessonProgress(userId);
    const completedLessons = lessonProgress.filter(lp => lp.completed).length;
    const balance = Number(user.simulatorBalance ?? 5000);
    
    const achievements = await this.getAchievements();
    const userAchievements = await this.getUserAchievements(userId);

    for (const achievement of achievements) {
      const existingUa = userAchievements.find(ua => ua.achievementId === achievement.id);
      if (existingUa && existingUa.progress === 100) continue;

      let currentProgress = 0;

      switch (achievement.category) {
        case "trading":
          if (achievement.id === "first-trade") {
            currentProgress = trades.length >= 1 ? 100 : 0;
          } else if (achievement.id === "day-trader") {
            currentProgress = Math.min(100, (trades.length / 10) * 100);
          }
          break;
        case "learning":
          if (achievement.id === "student") {
            currentProgress = completedLessons >= 1 ? 100 : 0;
          }
          break;
        case "balance":
          if (achievement.id === "starter") {
            currentProgress = balance >= 6000 ? 100 : 0;
          } else if (achievement.id === "growing") {
            currentProgress = balance >= 10000 ? 100 : 0;
          }
          break;
      }

      if (currentProgress > (existingUa?.progress ?? 0)) {
        await this.updateAchievementProgress(userId, achievement.id, currentProgress);
      }
    }
  }
}

export const storage = new DatabaseStorage();
