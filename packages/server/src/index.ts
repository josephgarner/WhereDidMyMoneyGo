import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import morgan from 'morgan';
import { config, validateConfig } from './config/env';
import { initializeAuthentikClient } from './config/authentik';
import { logger, morganStream } from './utils/logger';
import authRoutes from './routes/auth.routes';
import accountBooksRoutes from './routes/accountBooks.routes';
import accountsRoutes from './routes/accounts.routes';
import rulesRoutes from './routes/rules.routes';
import budgetsRoutes from './routes/budgets.routes';

async function startServer() {
  // Validate configuration
  validateConfig();
  logger.info('Configuration validated successfully');

  // Initialize Authentik client
  try {
    await initializeAuthentikClient();
    logger.info('Authentik client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Authentik client. Server will start but authentication will not work.', { error });
  }

  const app = express();

  // HTTP request logging
  app.use(morgan('combined', { stream: morganStream }));

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
      secure: false, // Set to true only when using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      domain: undefined, // Don't set domain for localhost
    },
    proxy: config.nodeEnv === 'production', // Trust proxy headers in production
  }));

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/account-books', accountBooksRoutes);
  app.use('/api/account-books', rulesRoutes);
  app.use('/api/account-books', budgetsRoutes);
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

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(err.status || 500).json({
      success: false,
      error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    });
  });

  // Start server
  app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
