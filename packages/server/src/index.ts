import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { config, validateConfig } from './config/env';
import { initializeAuthentikClient } from './config/authentik';
import authRoutes from './routes/auth.routes';
import accountBooksRoutes from './routes/accountBooks.routes';
import accountsRoutes from './routes/accounts.routes';

async function startServer() {
  // Validate configuration
  validateConfig();

  // Initialize Authentik client
  try {
    await initializeAuthentikClient();
  } catch (error) {
    console.error('Failed to initialize Authentik client. Server will start but authentication will not work.');
  }

  const app = express();

  // Middleware
  app.use(cors({
    origin: config.clientUrl,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    },
  }));

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/account-books', accountBooksRoutes);
  app.use('/api/accounts', accountsRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes (protected)
  app.get('/api/protected', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    res.json({
      success: true,
      message: 'This is a protected route',
      user: req.session.user,
    });
  });

  // Start server
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

startServer().catch(console.error);
