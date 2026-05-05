import express from 'express';
import type { Request, Response } from 'express';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Middleware
app.use(express.json());

// Mock data storage
let tokenCounter = 1;

const generateMockToken = (): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: 'user-' + tokenCounter,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  })).toString('base64');
  tokenCounter++;
  return `${header}.${payload}.mock_signature`;
};

// ─── Public Endpoints ─────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Email and password are required',
    });
  }

  const userId = `user-${Date.now()}`;
  const accessToken = generateMockToken();
  const refreshToken = generateMockToken();

  res.status(200).json({
    status: 'success',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        name: email.split('@')[0],
        role: 'client',
      },
    },
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Email and password are required',
    });
  }

  res.status(201).json({
    status: 'success',
    data: {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      role: role || 'client',
    },
  });
});

app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      status: 'error',
      message: 'Refresh token is required',
    });
  }

  const newAccessToken = generateMockToken();
  const newRefreshToken = generateMockToken();

  res.status(200).json({
    status: 'success',
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});

// ─── Protected Endpoints ─────────────────────────

const validateToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: No valid token',
    });
  }

  const token = authHeader.substring(7);
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Invalid token',
    });
  }

  next();
};

app.get('/api/auth/profile', validateToken, (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      id: 'user-123',
      email: 'testing120145@gmail.com',
      name: 'Testing User',
      role: 'client',
      createdAt: '2025-11-12T10:10:00Z',
      updatedAt: new Date().toISOString(),
    },
  });
});

app.put('/api/auth/profile', validateToken, (req: Request, res: Response) => {
  const { name, password } = req.body;

  res.status(200).json({
    status: 'success',
    data: {
      id: 'user-123',
      email: 'testing120145@gmail.com',
      name: name || 'Testing User',
      role: 'client',
      updatedAt: new Date().toISOString(),
    },
  });
});

app.post('/api/auth/logout', validateToken, (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

// ─── Internal Endpoints ─────────────────────────

app.get('/internal/users/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;

  res.status(200).json({
    status: 'success',
    data: {
      id: userId,
      email: 'user@example.com',
      name: 'Example User',
      role: 'client',
      createdAt: '2025-11-12T10:10:00Z',
    },
  });
});

app.post('/internal/validate-token', (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      status: 'error',
      message: 'Token is required',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      valid: true,
      decoded: {
        sub: 'user-123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      },
    },
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
