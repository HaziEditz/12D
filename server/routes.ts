import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { insertUserSchema, insertLessonSchema, insertTradeSchema, insertPortfolioItemSchema, insertAssignmentSchema } from "@shared/schema";
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

  // PayPal routes
  app.get("/setup", loadPaypalDefault);
  app.post("/order", createPaypalOrder);
  app.post("/order/:orderID/capture", capturePaypalOrder);

  // Subscription payment routes
  const tierPrices: Record<string, string> = {
    school: "8.49",
    casual: "9.49",
    premium: "14.49",
  };

  app.post("/api/payments/create-subscription", requireAuth, async (req, res) => {
    try {
      const { tier } = req.body;
      const user = req.user as User;

      if (!tier || !tierPrices[tier]) {
        return res.status(400).json({ error: "Invalid subscription tier" });
      }

      const price = tierPrices[tier];
      
      // Create a PayPal order for the subscription
      const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
      
      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
      
      const orderResponse = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: "USD",
              value: price,
            },
            description: `12Digits ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan - Monthly Subscription`,
          }],
          application_context: {
            return_url: `${req.protocol}://${req.get('host')}/api/payments/capture-subscription?tier=${tier}`,
            cancel_url: `${req.protocol}://${req.get('host')}/pricing`,
            brand_name: "12Digits",
            user_action: "PAY_NOW",
          },
        }),
      });

      const orderData = await orderResponse.json();
      
      if (orderData.id) {
        // Find the approval URL
        const approvalLink = orderData.links?.find((link: any) => link.rel === "approve");
        if (approvalLink) {
          return res.json({ approvalUrl: approvalLink.href, orderId: orderData.id });
        }
      }

      res.status(500).json({ error: "Failed to create PayPal order" });
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  app.get("/api/payments/capture-subscription", requireAuth, async (req, res) => {
    try {
      const { token, tier } = req.query;
      const user = req.user as User;

      if (!token || !tier) {
        return res.redirect("/pricing?error=missing_params");
      }

      const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

      // Capture the order
      const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${token}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`,
        },
      });

      const captureData = await captureResponse.json();

      if (captureData.status === "COMPLETED") {
        // Update user's subscription status
        await storage.updateUser(user.id, {
          membershipTier: tier as string,
          membershipStatus: "active",
          subscriptionId: captureData.id,
        });
        
        return res.redirect("/dashboard?subscription=success");
      }

      res.redirect("/pricing?error=payment_failed");
    } catch (error) {
      console.error("Capture error:", error);
      res.redirect("/pricing?error=capture_failed");
    }
  });
}
