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

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Session setup
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
        secure: false,
      },
    })
  );

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

  // Ensure admin exists
  await ensureAdminUser();

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

  app.post("/api/lessons/:id/progress", requireAuth, async (req, res) => {
    const user = req.user as User;
    const { completed } = req.body;
    await storage.updateLessonProgress(user.id, req.params.id, completed);
    res.json({ success: true });
  });

  // Trades routes
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
      
      // Check if user has enough balance
      const cost = data.quantity * data.entryPrice;
      if (user.simulatorBalance < cost) {
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
      
      const { displayName, email, password } = req.body;
      
      // Check if student email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }
      
      // Create student account
      const student = await storage.createUser({
        email,
        password,
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
          email: student.email 
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
}
