import express from 'express';
import { createServer as createViteServer } from 'vite';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Initialize SQLite database
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      displayName TEXT,
      role TEXT,
      subjects TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT,
      studentName TEXT,
      teacherId TEXT,
      teacherName TEXT,
      subject TEXT,
      date TEXT,
      startTime TEXT,
      endTime TEXT,
      status TEXT,
      roomId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Middleware to authenticate JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const uid = Math.random().toString(36).substring(2, 15);
      
      await db.run(
        'INSERT INTO users (uid, email, password, displayName) VALUES (?, ?, ?, ?)',
        [uid, email, hashedPassword, name]
      );
      
      const token = jwt.sign({ uid, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { uid, email, displayName: name } });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'このメールアドレスは既に登録されています。' });
      } else {
        res.status(500).json({ error: '登録エラーが発生しました。' });
      }
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(400).json({ error: 'メールアドレスまたはパスワードが間違っています。' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'メールアドレスまたはパスワードが間違っています。' });
      }
      
      const token = jwt.sign({ uid: user.uid, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ 
        token, 
        user: { 
          uid: user.uid, 
          email: user.email, 
          displayName: user.displayName,
          role: user.role,
          subjects: user.subjects ? JSON.parse(user.subjects) : undefined
        } 
      });
    } catch (error) {
      res.status(500).json({ error: 'ログインエラーが発生しました。' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await db.get('SELECT uid, email, displayName, role, subjects, createdAt FROM users WHERE uid = ?', [req.user.uid]);
      if (!user) return res.sendStatus(404);
      
      res.json({
        ...user,
        subjects: user.subjects ? JSON.parse(user.subjects) : undefined
      });
    } catch (error) {
      res.status(500).json({ error: 'ユーザー情報の取得に失敗しました。' });
    }
  });

  app.put('/api/users/profile', authenticateToken, async (req: any, res) => {
    const { role, subjects, name } = req.body;
    try {
      const subjectsJson = subjects ? JSON.stringify(subjects) : null;
      
      if (name) {
        await db.run(
          'UPDATE users SET role = ?, subjects = ?, displayName = ? WHERE uid = ?',
          [role, subjectsJson, name, req.user.uid]
        );
      } else {
        await db.run(
          'UPDATE users SET role = ?, subjects = ? WHERE uid = ?',
          [role, subjectsJson, req.user.uid]
        );
      }
      
      const user = await db.get('SELECT uid, email, displayName, role, subjects, createdAt FROM users WHERE uid = ?', [req.user.uid]);
      res.json({
        ...user,
        subjects: user.subjects ? JSON.parse(user.subjects) : undefined
      });
    } catch (error) {
      res.status(500).json({ error: 'プロフィールの更新に失敗しました。' });
    }
  });

  app.get('/api/users', authenticateToken, async (req, res) => {
    try {
      const users = await db.all('SELECT uid, email, displayName, role, subjects, createdAt FROM users');
      res.json(users.map(u => ({
        ...u,
        subjects: u.subjects ? JSON.parse(u.subjects) : undefined
      })));
    } catch (error) {
      res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました。' });
    }
  });

  // Requests Routes
  app.get('/api/requests', authenticateToken, async (req: any, res) => {
    try {
      const user = await db.get('SELECT role FROM users WHERE uid = ?', [req.user.uid]);
      let requests = [];
      
      if (user.role === 'manager') {
        requests = await db.all('SELECT * FROM requests ORDER BY createdAt DESC');
      } else if (user.role === 'teacher') {
        requests = await db.all('SELECT * FROM requests WHERE teacherId = ? ORDER BY createdAt DESC', [req.user.uid]);
      } else {
        requests = await db.all('SELECT * FROM requests WHERE studentId = ? ORDER BY createdAt DESC', [req.user.uid]);
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'リクエストの取得に失敗しました。' });
    }
  });

  app.post('/api/requests', authenticateToken, async (req: any, res) => {
    const { teacherId, teacherName, subject, date, startTime, endTime } = req.body;
    try {
      const user = await db.get('SELECT displayName FROM users WHERE uid = ?', [req.user.uid]);
      
      const result = await db.run(
        `INSERT INTO requests (studentId, studentName, teacherId, teacherName, subject, date, startTime, endTime, status, roomId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_teacher', '')`,
        [req.user.uid, user.displayName, teacherId, teacherName, subject, date, startTime, endTime]
      );
      
      const newRequest = await db.get('SELECT * FROM requests WHERE id = ?', [result.lastID]);
      res.json(newRequest);
    } catch (error) {
      res.status(500).json({ error: 'リクエストの作成に失敗しました。' });
    }
  });

  app.put('/api/requests/:id', authenticateToken, async (req: any, res) => {
    const { status, roomId } = req.body;
    const { id } = req.params;
    try {
      await db.run(
        'UPDATE requests SET status = ?, roomId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [status, roomId || '', id]
      );
      
      const updatedRequest = await db.get('SELECT * FROM requests WHERE id = ?', [id]);
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ error: 'リクエストの更新に失敗しました。' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
