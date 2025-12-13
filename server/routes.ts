import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { insertUserSchema, insertLessonSchema, insertTradeSchema, insertPortfolioItemSchema, insertAssignmentSchema, insertClassSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import memorystore from "memorystore";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

const MemoryStore = memorystore(session);

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      displayName: string;
      role: string;
    }
  }
}

// Create hardcoded admin user if not exists
async function ensureAdminUser() {
  const adminEmail = "admin@12digits.com";
  const existingAdmin = await storage.getUserByEmail(adminEmail);
  if (!existingAdmin) {
    await storage.createUser({
      email: adminEmail,
      password: "12digits!",
      displayName: "Admin",
      role: "admin",
    });
    console.log("Admin user created: admin@12digits.com / 12digits!");
  }
}

// Seed achievements
async function seedAchievements() {
  const existingAchievements = await storage.getAchievements();
  if (existingAchievements.length > 0) return;

  const achievementsList = [
    // Trading (1-10)
    { id: "first-trade", name: "First Trade", description: "Execute your first trade", icon: "TrendingUp", category: "trading", requirement: 1, xpReward: 10 },
    { id: "day-trader", name: "Day Trader", description: "Complete 10 trades", icon: "TrendingUp", category: "trading", requirement: 10, xpReward: 25 },
    { id: "active-trader", name: "Active Trader", description: "Complete 50 trades", icon: "TrendingUp", category: "trading", requirement: 50, xpReward: 50 },
    { id: "master-trader", name: "Master Trader", description: "Complete 100 trades", icon: "Zap", category: "trading", requirement: 100, xpReward: 100 },
    { id: "trading-legend", name: "Trading Legend", description: "Complete 500 trades", icon: "Award", category: "trading", requirement: 500, xpReward: 250 },
    { id: "first-profit", name: "First Profit", description: "Make your first profitable trade", icon: "DollarSign", category: "trading", requirement: 1, xpReward: 15 },
    { id: "winning-streak", name: "Winning Streak", description: "5 profitable trades in a row", icon: "Zap", category: "trading", requirement: 5, xpReward: 50 },
    { id: "double-down", name: "Double Down", description: "Make $1,000 total profit", icon: "DollarSign", category: "trading", requirement: 1000, xpReward: 75 },
    { id: "high-roller", name: "High Roller", description: "Make $5,000 total profit", icon: "DollarSign", category: "trading", requirement: 5000, xpReward: 150 },
    { id: "mogul", name: "Mogul", description: "Make $10,000 total profit", icon: "Award", category: "trading", requirement: 10000, xpReward: 300 },
    // Learning (11-15)
    { id: "student", name: "Student", description: "Complete your first lesson", icon: "BookOpen", category: "learning", requirement: 1, xpReward: 10 },
    { id: "scholar", name: "Scholar", description: "Complete 5 lessons", icon: "BookOpen", category: "learning", requirement: 5, xpReward: 30 },
    { id: "graduate", name: "Graduate", description: "Complete 10 lessons", icon: "GraduationCap", category: "learning", requirement: 10, xpReward: 60 },
    { id: "professor", name: "Professor", description: "Complete 25 lessons", icon: "GraduationCap", category: "learning", requirement: 25, xpReward: 125 },
    { id: "valedictorian", name: "Valedictorian", description: "Complete all available lessons", icon: "Award", category: "learning", requirement: 100, xpReward: 500 },
    // Balance (16-20)
    { id: "starter", name: "Starter", description: "Reach $6,000 balance", icon: "Wallet", category: "balance", requirement: 6000, xpReward: 20 },
    { id: "growing", name: "Growing", description: "Reach $10,000 balance", icon: "Wallet", category: "balance", requirement: 10000, xpReward: 50 },
    { id: "wealthy", name: "Wealthy", description: "Reach $15,000 balance", icon: "CreditCard", category: "balance", requirement: 15000, xpReward: 100 },
    { id: "rich", name: "Rich", description: "Reach $25,000 balance", icon: "DollarSign", category: "balance", requirement: 25000, xpReward: 200 },
    { id: "elite", name: "Elite", description: "Reach $50,000 balance", icon: "Crown", category: "balance", requirement: 50000, xpReward: 500 },
    // Social (21-25)
    { id: "public-profile", name: "Public Profile", description: "Add a bio to your profile", icon: "User", category: "social", requirement: 1, xpReward: 10 },
    { id: "picture-perfect", name: "Picture Perfect", description: "Add an avatar to your profile", icon: "Image", category: "social", requirement: 1, xpReward: 10 },
    { id: "networker", name: "Networker", description: "Add your first friend", icon: "UserPlus", category: "social", requirement: 1, xpReward: 15 },
    { id: "popular", name: "Popular", description: "Have 10 friends", icon: "Users", category: "social", requirement: 10, xpReward: 50 },
    { id: "influencer", name: "Influencer", description: "Have 25 friends", icon: "Heart", category: "social", requirement: 25, xpReward: 100 },
    // Milestones (26-30)
    { id: "early-bird", name: "Early Bird", description: "Log in for the first time", icon: "Star", category: "milestone", requirement: 1, xpReward: 5 },
    { id: "dedicated", name: "Dedicated", description: "Log in for 7 days", icon: "Star", category: "milestone", requirement: 7, xpReward: 35 },
    { id: "committed", name: "Committed", description: "Log in for 30 days", icon: "Trophy", category: "milestone", requirement: 30, xpReward: 150 },
    { id: "premium-member", name: "Premium Member", description: "Subscribe to a premium plan", icon: "Crown", category: "milestone", requirement: 1, xpReward: 50 },
    { id: "top-10", name: "Top 10", description: "Reach top 10 on the leaderboard", icon: "Trophy", category: "milestone", requirement: 1, xpReward: 200 },
  ];

  for (const achievement of achievementsList) {
    await storage.createAchievement(achievement);
  }
  console.log("Seeded 30 achievements");
}

// Retroactive achievement check - awards achievements based on current user stats
async function checkAndAwardAchievements(userId: string): Promise<void> {
  const user = await storage.getUserById(userId);
  if (!user) return;

  const trades = await storage.getTradesByUser(userId);
  const lessonProgress = await storage.getLessonProgress(userId);
  const completedLessons = lessonProgress.filter(lp => lp.completed).length;
  const balance = user.simulatorBalance ?? 10000;
  const totalProfit = user.totalProfit ?? 0;
  const profitableTrades = trades.filter(t => t.profit && t.profit > 0);

  const achievements = await storage.getAchievements();
  const userAchievements = await storage.getUserAchievements(userId);

  for (const achievement of achievements) {
    const existingUa = userAchievements.find(ua => ua.achievementId === achievement.id);
    if (existingUa && existingUa.progress === 100) continue;

    let currentProgress = 0;
    let shouldUnlock = false;

    switch (achievement.category) {
      case "trading":
        if (achievement.id === "first-trade") {
          currentProgress = trades.length >= 1 ? 100 : 0;
        } else if (achievement.id === "day-trader") {
          currentProgress = Math.min(100, (trades.length / 10) * 100);
        } else if (achievement.id === "active-trader") {
          currentProgress = Math.min(100, (trades.length / 50) * 100);
        } else if (achievement.id === "master-trader") {
          currentProgress = Math.min(100, (trades.length / 100) * 100);
        } else if (achievement.id === "trading-legend") {
          currentProgress = Math.min(100, (trades.length / 500) * 100);
        } else if (achievement.id === "first-profit") {
          currentProgress = profitableTrades.length >= 1 ? 100 : 0;
        } else if (achievement.id === "double-down") {
          currentProgress = Math.min(100, (totalProfit / 1000) * 100);
        } else if (achievement.id === "high-roller") {
          currentProgress = Math.min(100, (totalProfit / 5000) * 100);
        } else if (achievement.id === "mogul") {
          currentProgress = Math.min(100, (totalProfit / 10000) * 100);
        }
        break;

      case "learning":
        if (achievement.id === "student") {
          currentProgress = completedLessons >= 1 ? 100 : 0;
        } else if (achievement.id === "scholar") {
          currentProgress = Math.min(100, (completedLessons / 5) * 100);
        } else if (achievement.id === "graduate") {
          currentProgress = Math.min(100, (completedLessons / 10) * 100);
        } else if (achievement.id === "professor") {
          currentProgress = Math.min(100, (completedLessons / 25) * 100);
        }
        break;

      case "balance":
        if (achievement.id === "starter") {
          currentProgress = balance >= 6000 ? 100 : Math.min(99, (balance / 6000) * 100);
        } else if (achievement.id === "growing") {
          currentProgress = balance >= 10000 ? 100 : Math.min(99, (balance / 10000) * 100);
        } else if (achievement.id === "wealthy") {
          currentProgress = balance >= 15000 ? 100 : Math.min(99, (balance / 15000) * 100);
        } else if (achievement.id === "rich") {
          currentProgress = balance >= 25000 ? 100 : Math.min(99, (balance / 25000) * 100);
        } else if (achievement.id === "elite") {
          currentProgress = balance >= 50000 ? 100 : Math.min(99, (balance / 50000) * 100);
        }
        break;

      case "social":
        if (achievement.id === "public-profile") {
          currentProgress = user.bio ? 100 : 0;
        } else if (achievement.id === "picture-perfect") {
          currentProgress = user.avatarUrl ? 100 : 0;
        }
        break;

      case "milestone":
        if (achievement.id === "early-bird") {
          currentProgress = 100;
        } else if (achievement.id === "premium-member") {
          currentProgress = user.subscriptionId ? 100 : 0;
        }
        break;
    }

    shouldUnlock = currentProgress >= 100;
    const roundedProgress = Math.round(currentProgress);

    if (existingUa) {
      if (roundedProgress > (existingUa.progress ?? 0)) {
        await storage.updateUserAchievement(existingUa.id, {
          progress: roundedProgress,
          unlockedAt: shouldUnlock ? new Date() : null,
        });
        if (shouldUnlock) {
          await storage.updateUser(userId, {
            xp: (user.xp ?? 0) + achievement.xpReward,
          });
        }
      }
    } else if (roundedProgress > 0) {
      await storage.createUserAchievement({
        userId: userId,
        achievementId: achievement.id,
        progress: roundedProgress,
        unlockedAt: shouldUnlock ? new Date() : null,
      });
      if (shouldUnlock) {
        await storage.updateUser(userId, {
          xp: (user.xp ?? 0) + achievement.xpReward,
        });
      }
    }
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Session setup
  const isProduction = process.env.NODE_ENV === "production";
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "12digits-secret-key-change-in-prod",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: isProduction,
        sameSite: isProduction ? "lax" : "lax",
        httpOnly: true,
      },
      proxy: isProduction,
    })
  );
  
  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && (req.user as User)?.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  const requireTeacher = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    if (req.isAuthenticated() && (user?.role === "teacher" || user?.role === "admin")) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Ensure admin exists and seed achievements
  await ensureAdminUser();
  await seedAchievements();

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const user = await storage.createUser(data);
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
        }
        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Login failed" });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user as User;
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  // Lessons routes
  app.get("/api/lessons", async (req, res) => {
    const allLessons = await storage.getLessons();
    res.json(allLessons);
  });

  app.get("/api/lessons/progress", requireAuth, async (req, res) => {
    const user = req.user as User;
    const progress = await storage.getLessonProgress(user.id);
    res.json(progress);
  });

  app.get("/api/lessons/:id", async (req, res) => {
    const lesson = await storage.getLessonById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    res.json(lesson);
  });

  app.post("/api/lessons/:id/progress", requireAuth, async (req, res) => {
    const user = req.user as User;
    const { completed } = req.body;
    await storage.updateLessonProgress(user.id, req.params.id, completed);
    res.json({ success: true });
  });

  app.post("/api/lessons/:id/complete", requireAuth, async (req, res) => {
    const user = req.user as User;
    await storage.updateLessonProgress(user.id, req.params.id, true);
    res.json({ success: true });
  });

  // Trades routes
  app.get("/api/trades/limits", requireAuth, async (req, res) => {
    const user = req.user as User;
    const DEMO_DAILY_TRADE_LIMIT = 5;
    const isTrialUser = !user.subscriptionId && user.membershipStatus !== "active" && user.role !== "admin";
    
    if (!isTrialUser) {
      return res.json({ isLimited: false, remaining: -1, limit: -1 });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const lastTradeDate = user.lastTradeDate || "";
    let dailyCount = user.dailyTradesCount ?? 0;
    
    // Reset count if it's a new day
    if (lastTradeDate !== today) {
      dailyCount = 0;
    }
    
    res.json({
      isLimited: true,
      remaining: Math.max(0, DEMO_DAILY_TRADE_LIMIT - dailyCount),
      limit: DEMO_DAILY_TRADE_LIMIT,
      used: dailyCount
    });
  });

  app.get("/api/trades", requireAuth, async (req, res) => {
    const user = req.user as User;
    if (req.query.open) {
      const openTrades = await storage.getOpenTrades(user.id);
      res.json(openTrades);
    } else {
      const allTrades = await storage.getTradesByUser(user.id);
      res.json(allTrades);
    }
  });

  app.post("/api/trades", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const data = insertTradeSchema.parse({ ...req.body, userId: user.id });
      
      // Check if user is on trial (demo) and enforce trade limits
      const DEMO_DAILY_TRADE_LIMIT = 5;
      const isTrialUser = !user.subscriptionId && user.membershipStatus !== "active" && user.role !== "admin";
      
      if (isTrialUser) {
        const today = new Date().toISOString().split('T')[0];
        const lastTradeDate = user.lastTradeDate || "";
        let dailyCount = user.dailyTradesCount ?? 0;
        
        // Reset count if it's a new day
        if (lastTradeDate !== today) {
          dailyCount = 0;
        }
        
        if (dailyCount >= DEMO_DAILY_TRADE_LIMIT) {
          return res.status(400).json({ 
            message: `Demo accounts are limited to ${DEMO_DAILY_TRADE_LIMIT} trades per day. Upgrade to Casual or Premium for unlimited trades!`,
            tradeLimitReached: true
          });
        }
        
        // Update trade count
        await storage.updateUser(user.id, {
          dailyTradesCount: dailyCount + 1,
          lastTradeDate: today
        });
      }
      
      // Check if user has enough balance
      const cost = data.quantity * data.entryPrice;
      if ((user.simulatorBalance ?? 5000) < cost) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const trade = await storage.createTrade(data);
      res.json(trade);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/trades/:id/close", requireAuth, async (req, res) => {
    try {
      const { exitPrice } = req.body;
      const trade = await storage.closeTrade(req.params.id, exitPrice);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      res.json(trade);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Portfolio routes
  app.get("/api/portfolio", requireAuth, async (req, res) => {
    const user = req.user as User;
    const portfolio = await storage.getPortfolio(user.id);
    res.json(portfolio);
  });

  app.post("/api/portfolio", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const data = insertPortfolioItemSchema.parse({ ...req.body, userId: user.id });
      const item = await storage.createPortfolioItem(data);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/portfolio/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.updatePortfolioItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/portfolio/:id", requireAuth, async (req, res) => {
    await storage.deletePortfolioItem(req.params.id);
    res.json({ success: true });
  });

  // Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    const leaderboard = await storage.getLeaderboard();
    const safeLeaderboard = leaderboard.map(({ password, ...user }) => user);
    res.json(safeLeaderboard);
  });

  // Admin routes
  app.get("/api/admin/lessons", requireAdmin, async (req, res) => {
    const allLessons = await storage.getLessons();
    res.json(allLessons);
  });

  app.post("/api/admin/lessons", requireAdmin, async (req, res) => {
    try {
      const data = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(data);
      res.json(lesson);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/lessons/:id", requireAdmin, async (req, res) => {
    try {
      const lesson = await storage.updateLesson(req.params.id, req.body);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/lessons/:id", requireAdmin, async (req, res) => {
    await storage.deleteLesson(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    const [usersCount, lessonsCount, tradesCount] = await Promise.all([
      storage.getUsersCount(),
      storage.getLessonsCount(),
      storage.getTotalTradesCount(),
    ]);
    res.json({ users: usersCount, lessons: lessonsCount, trades: tradesCount });
  });

  // Teacher routes
  app.get("/api/teacher/students", requireTeacher, async (req, res) => {
    const user = req.user as User;
    const students = await storage.getStudentsByTeacher(user.id);
    const safeStudents = students.map(({ password, ...s }) => s);
    res.json(safeStudents);
  });

  app.post("/api/teacher/students", requireTeacher, async (req, res) => {
    try {
      const user = req.user as User;
      const { email } = req.body;
      const student = await storage.getUserByEmail(email);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      await storage.updateUser(student.id, { teacherId: user.id });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/teacher/assignments", requireTeacher, async (req, res) => {
    const user = req.user as User;
    const teacherAssignments = await storage.getAssignmentsByTeacher(user.id);
    res.json(teacherAssignments);
  });

  app.post("/api/teacher/assignments", requireTeacher, async (req, res) => {
    try {
      const user = req.user as User;
      const data = insertAssignmentSchema.parse({ ...req.body, teacherId: user.id });
      const assignment = await storage.createAssignment(data);
      res.json(assignment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Teacher Class Management Routes
  app.get("/api/teacher/classes", requireTeacher, async (req, res) => {
    const user = req.user as User;
    const teacherClasses = await storage.getClassesByTeacher(user.id);
    res.json(teacherClasses);
  });

  app.post("/api/teacher/classes", requireTeacher, async (req, res) => {
    try {
      const user = req.user as User;
      const { name, description } = req.body;
      
      // Generate a random join code
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Get or create school for this teacher
      let school = await storage.getSchoolByAdmin(user.id);
      if (!school) {
        school = await storage.createSchool({
          name: `${user.displayName}'s School`,
          adminUserId: user.id,
        });
      }
      
      const classData = {
        schoolId: school.id,
        teacherId: user.id,
        name,
        description: description || null,
        joinCode,
      };
      
      const newClass = await storage.createClass(classData);
      res.json(newClass);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/teacher/classes/:id", requireTeacher, async (req, res) => {
    try {
      const user = req.user as User;
      const cls = await storage.getClassById(req.params.id);
      if (!cls || cls.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to delete this class" });
      }
      await storage.deleteClass(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/teacher/classes/:id/students", requireTeacher, async (req, res) => {
    try {
      const user = req.user as User;
      const cls = await storage.getClassById(req.params.id);
      if (!cls || cls.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const students = await storage.getStudentsByClass(req.params.id);
      
      // Get progress data for each student
      const studentsWithProgress = await Promise.all(students.map(async (student) => {
        const progress = await storage.getLessonProgress(student.id);
        const trades = await storage.getTradesByUser(student.id);
        const completedLessons = progress.filter(p => p.completed).length;
        const totalTrades = trades.length;
        const profitableTrades = trades.filter(t => t.profit && t.profit > 0).length;
        
        return {
          id: student.id,
          displayName: student.displayName,
          email: student.email,
          lessonsCompleted: completedLessons,
          totalProfit: student.totalProfit ?? 0,
          simulatorBalance: student.simulatorBalance ?? 10000,
          totalTrades,
          profitableTrades,
        };
      }));
      
      res.json(studentsWithProgress);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/teacher/classes/:id/students", requireTeacher, async (req, res) => {
    try {
      const user = req.user as User;
      const cls = await storage.getClassById(req.params.id);
      if (!cls || cls.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const { displayName, email } = req.body;
      
      if (!displayName || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }
      
      // Check if student email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }
      
      // Generate secure random password server-side
      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
      
      // Create student account
      const student = await storage.createUser({
        email,
        password: generatedPassword,
        displayName,
        role: "student",
        membershipTier: "school",
        membershipStatus: "active",
        teacherId: user.id,
      });
      
      // Add student to class
      await storage.addStudentToClass({
        classId: req.params.id,
        studentId: student.id,
      });
      
      res.json({ 
        success: true, 
        student: { 
          id: student.id, 
          displayName: student.displayName, 
          email: student.email,
          temporaryPassword: generatedPassword,
        } 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/teacher/classes/:classId/students/:studentId", requireTeacher, async (req, res) => {
    try {
      const user = req.user as User;
      const cls = await storage.getClassById(req.params.classId);
      if (!cls || cls.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.removeStudentFromClass(req.params.classId, req.params.studentId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // PayPal routes with error handling
  app.get("/setup", async (req, res) => {
    try {
      await loadPaypalDefault(req, res);
    } catch (error) {
      console.error("PayPal setup error:", error);
      res.status(500).json({ error: "PayPal configuration error. Please check your credentials." });
    }
  });
  
  app.post("/order", async (req, res) => {
    try {
      await createPaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal order error:", error);
      res.status(500).json({ error: "Failed to create PayPal order" });
    }
  });
  
  app.post("/order/:orderID/capture", async (req, res) => {
    try {
      await capturePaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(500).json({ error: "Failed to capture PayPal order" });
    }
  });

  // Promo code redemption route
  app.post("/api/payments/redeem-promo", requireAuth, async (req, res) => {
    try {
      const { promoCode } = req.body;
      const user = req.user as User;

      // Define valid promo codes and their tiers
      const promoCodes: Record<string, { tier: string; message: string }> = {
        "12DIGITS!": { tier: "school", message: "Promo code redeemed! You now have free School Plan access." },
        "12DIGITS+": { tier: "premium", message: "Promo code redeemed! You now have free 12Digits+ Premium access." },
      };

      const promoConfig = promoCodes[promoCode];
      if (!promoConfig) {
        return res.status(400).json({ error: "Invalid promo code" });
      }

      // Check if user already has an active subscription
      if (user.membershipStatus === "active" && user.subscriptionId) {
        return res.status(400).json({ error: "You already have an active subscription" });
      }

      // Activate free subscription based on promo code
      await storage.updateUser(user.id, {
        membershipTier: promoConfig.tier,
        membershipStatus: "active",
        subscriptionId: `PROMO-${promoCode}-${Date.now()}`,
      });

      res.json({ success: true, message: promoConfig.message });
    } catch (error) {
      console.error("Promo redemption error:", error);
      res.status(500).json({ error: "Failed to redeem promo code" });
    }
  });

  // Subscription payment routes
  app.post("/api/payments/activate-subscription", requireAuth, async (req, res) => {
    try {
      const { tier, orderId } = req.body;
      const user = req.user as User;

      const validTiers = ["school", "casual", "premium"];
      if (!tier || !validTiers.includes(tier)) {
        return res.status(400).json({ error: "Invalid subscription tier" });
      }

      // Update user's subscription status
      await storage.updateUser(user.id, {
        membershipTier: tier,
        membershipStatus: "active",
        subscriptionId: orderId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Subscription activation error:", error);
      res.status(500).json({ error: "Failed to activate subscription" });
    }
  });

  // Profile routes
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { displayName, bio, avatarUrl } = req.body;
      
      const updates: Partial<User> = {};
      if (displayName !== undefined) updates.displayName = displayName;
      if (bio !== undefined) updates.bio = bio;
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
      
      await storage.updateUser(user.id, updates);
      const updatedUser = await storage.getUserById(user.id);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...safeUser } = updatedUser;
      res.json({ user: safeUser });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/user/password", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      
      const fullUser = await storage.getUserById(user.id);
      if (!fullUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const isValid = await bcrypt.compare(currentPassword, fullUser.password);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });
      
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const results = await storage.searchUsers(query);
      const safeResults = results.map(({ password, ...user }) => user);
      res.json(safeResults);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const publicProfile = {
        id: user.id,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
        membershipTier: user.membershipTier,
        lessonsCompleted: user.lessonsCompleted,
        totalProfit: user.totalProfit,
      };
      
      res.json(publicProfile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Achievements routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const allAchievements = await storage.getAchievements();
      res.json(allAchievements);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/user/achievements", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const userAchievementsList = await storage.getUserAchievements(user.id);
      const allAchievements = await storage.getAchievements();
      
      const achievementsWithProgress = allAchievements.map(achievement => {
        const userAchievement = userAchievementsList.find(ua => ua.achievementId === achievement.id);
        return {
          ...achievement,
          unlocked: !!userAchievement && (userAchievement.progress ?? 0) >= 100,
          unlockedAt: userAchievement?.unlockedAt,
          progress: userAchievement?.progress ?? 0,
        };
      });
      
      res.json(achievementsWithProgress);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:id/achievements", async (req, res) => {
    try {
      const userAchievementsList = await storage.getUserAchievements(req.params.id);
      const allAchievements = await storage.getAchievements();
      
      const unlockedAchievements = allAchievements
        .filter(achievement => {
          const ua = userAchievementsList.find(u => u.achievementId === achievement.id);
          return ua && (ua.progress ?? 0) >= 100;
        })
        .map(achievement => {
          const ua = userAchievementsList.find(u => u.achievementId === achievement.id);
          return {
            ...achievement,
            unlockedAt: ua?.unlockedAt,
          };
        });
      
      res.json(unlockedAchievements);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Object storage routes for profile picture uploads
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/user/avatar", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { avatarURL } = req.body;
      const objectStorageService = new ObjectStorageService();
      const avatarPath = objectStorageService.normalizeObjectEntityPath(avatarURL);
      await storage.updateUser(user.id, { avatarUrl: avatarPath });
      res.json({ avatarPath });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Retroactive achievement check endpoint
  app.post("/api/achievements/check", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      await checkAndAwardAchievements(user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete account endpoint
  app.delete("/api/user/account", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Delete all user-related data
      await storage.deleteUserAccount(user.id);
      
      // Logout the user
      req.logout(() => {
        res.json({ success: true });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
}
