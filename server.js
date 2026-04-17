import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');

const isProd = process.env.NODE_ENV === 'production';
if (!process.env.JWT_SECRET && isProd) {
  throw new Error('生产环境必须设置 JWT_SECRET。');
}
const JWT_SECRET = process.env.JWT_SECRET || `dev-only-${crypto.randomBytes(24).toString('hex')}`;
if (!process.env.JWT_SECRET) {
  console.warn('[认证] 未设置 JWT_SECRET，当前使用仅用于开发环境的临时密钥。');
}

app.use(express.json({ limit: '10mb' }));

const usersFile = () => path.join(DATA_DIR, 'users.json');
const USERNAME_RE = /^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// Simple in-memory limiter for login brute-force mitigation.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map();

// Tiny async lock to avoid read-modify-write races on JSON files.
const locks = new Map();
const withLock = async (key, task) => {
  const previous = locks.get(key) || Promise.resolve();
  const next = previous.catch(() => {}).then(task);
  locks.set(
    key,
    next.finally(() => {
      if (locks.get(key) === next) locks.delete(key);
    }),
  );
  return next;
};

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

const assertValidUsername = (username) => {
  if (!USERNAME_RE.test(username || '')) {
    throw new Error('Invalid username');
  }
};

const normalizeIp = (ip) => (ip || '').replace(/^::ffff:/, '') || 'unknown';
const loginKey = (req, username) => `${normalizeIp(req.ip)}::${username || ''}`;

const getAttemptEntry = (key) => {
  const now = Date.now();
  const existing = loginAttempts.get(key);
  if (!existing || now - existing.start > LOGIN_WINDOW_MS) {
    const fresh = { count: 0, start: now };
    loginAttempts.set(key, fresh);
    return fresh;
  }
  return existing;
};

const isRateLimited = (key) => {
  const entry = getAttemptEntry(key);
  return entry.count >= LOGIN_MAX_ATTEMPTS;
};

const recordFailedAttempt = (key) => {
  const entry = getAttemptEntry(key);
  entry.count += 1;
  loginAttempts.set(key, entry);
};

const clearAttempts = (key) => {
  loginAttempts.delete(key);
};

const cleanupExpiredLoginAttempts = () => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts.entries()) {
    if (!entry || now - entry.start > LOGIN_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }
};

const loginAttemptsCleanupTimer = setInterval(cleanupExpiredLoginAttempts, LOGIN_WINDOW_MS);
loginAttemptsCleanupTimer.unref?.();

const readJsonFile = async (filePath, fallback) => {
  try {
    const raw = await fsp.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJsonAtomic = async (filePath, data) => {
  const temp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fsp.writeFile(temp, payload, 'utf-8');
  await fsp.rename(temp, filePath);
};

const readUsers = async () => {
  const users = await readJsonFile(usersFile(), []);
  return Array.isArray(users) ? users : [];
};

const writeUsers = async (users) => {
  await writeJsonAtomic(usersFile(), users);
};

const userDataDir = (username) => {
  assertValidUsername(username);
  return path.join(USERS_DIR, username);
};

const ensureUserDir = async (username) => {
  const dir = userDataDir(username);
  await fsp.mkdir(dir, { recursive: true });
  return dir;
};

const readUserJson = async (username, name, fallback = null) => {
  const dir = await ensureUserDir(username);
  const filePath = path.join(dir, `${name}.json`);
  return readJsonFile(filePath, fallback);
};

const writeUserJson = async (username, name, data) => {
  const dir = await ensureUserDir(username);
  const filePath = path.join(dir, `${name}.json`);
  await writeJsonAtomic(filePath, data);
};

const isValidWorkspacePayload = (payload) => {
  if (!isPlainObject(payload)) return false;
  const isNewShape = Array.isArray(payload.workspaces) && typeof payload.activeWorkspaceId === 'string';
  const isLegacyShape = Array.isArray(payload.inputs) && typeof payload.separator === 'string';
  return isNewShape || isLegacyShape;
};

const isValidSavedPayload = (payload) => Array.isArray(payload);
const isValidPresetsPayload = (payload) => Array.isArray(payload);
const isValidFoldersPayload = (payload) => Array.isArray(payload) && payload.every(f =>
  typeof f === 'object' && f !== null &&
  typeof f.id === 'string' && f.id.trim().length > 0 &&
  typeof f.name === 'string' && f.name.trim().length > 0
);

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }

  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    assertValidUsername(decoded.username);
    req.user = decoded; // { username, iat, exp }
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: '用户名仅支持 2-20 位中文、字母、数字、下划线' });
  }
  if (!PASSWORD_RE.test(password)) {
    return res.status(400).json({ error: '密码至少 8 位，且包含字母和数字' });
  }

  try {
    const created = await withLock('users', async () => {
      const users = await readUsers();
      if (users.some((u) => u.username === username)) return false;

      const hashedPassword = await bcrypt.hash(password, 10);
      users.push({ username, password: hashedPassword, createdAt: Date.now() });
      await writeUsers(users);
      return true;
    });

    if (!created) return res.status(409).json({ error: '该用户名已被注册' });

    await ensureUserDir(username);
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, username });
  } catch (error) {
    console.error('[注册] 失败:', error);
    return res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  const key = loginKey(req, username);

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (isRateLimited(key)) {
    return res.status(429).json({ error: '尝试次数过多，请稍后再试' });
  }

  try {
    const users = await readUsers();
    const user = users.find((u) => u.username === username);
    const isValid = !!user && (await bcrypt.compare(password, user.password));
    if (!isValid) {
      recordFailedAttempt(key);
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    clearAttempts(key);
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, username });
  } catch (error) {
    console.error('[登录] 失败:', error);
    return res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

app.post('/api/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请填写旧密码和新密码' });
  }
  if (!PASSWORD_RE.test(newPassword)) {
    return res.status(400).json({ error: '新密码至少 8 位，且包含字母和数字' });
  }

  try {
    const changed = await withLock('users', async () => {
      const users = await readUsers();
      const user = users.find((u) => u.username === req.user.username);
      if (!user) return false;

      const matched = await bcrypt.compare(oldPassword, user.password);
      if (!matched) return null;

      user.password = await bcrypt.hash(newPassword, 10);
      await writeUsers(users);
      return true;
    });

    if (changed === null) return res.status(401).json({ error: '旧密码错误' });
    if (changed === false) return res.status(404).json({ error: '用户不存在' });
    return res.json({ ok: true });
  } catch (error) {
    console.error('[修改密码] 失败:', error);
    return res.status(500).json({ error: '修改密码失败，请稍后重试' });
  }
});

app.get('/api/data', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const [workspace, savedPrompts, presets, folders] = await Promise.all([
      readUserJson(username, 'workspace', null),
      readUserJson(username, 'saved', []),
      readUserJson(username, 'presets', []),
      readUserJson(username, 'folders', []),
    ]);
    return res.json({ workspace, savedPrompts, presets, folders });
  } catch (error) {
    console.error('[数据读取] 失败:', error);
    return res.status(500).json({ error: '读取数据失败' });
  }
});

app.post('/api/workspace', authMiddleware, async (req, res) => {
  if (!isValidWorkspacePayload(req.body)) {
    return res.status(400).json({ error: '工作区数据格式不正确' });
  }

  try {
    await withLock(`workspace:${req.user.username}`, async () => {
      await writeUserJson(req.user.username, 'workspace', req.body);
    });
    return res.json({ ok: true });
  } catch (error) {
    console.error('[工作区保存] 失败:', error);
    return res.status(500).json({ error: '保存工作区失败' });
  }
});

app.post('/api/saved', authMiddleware, async (req, res) => {
  if (!isValidSavedPayload(req.body)) {
    return res.status(400).json({ error: '快照数据格式不正确' });
  }

  try {
    await withLock(`saved:${req.user.username}`, async () => {
      await writeUserJson(req.user.username, 'saved', req.body);
    });
    return res.json({ ok: true });
  } catch (error) {
    console.error('[快照保存] 失败:', error);
    return res.status(500).json({ error: '保存快照失败' });
  }
});

app.post('/api/presets', authMiddleware, async (req, res) => {
  if (!isValidPresetsPayload(req.body)) {
    return res.status(400).json({ error: '预设数据格式不正确' });
  }

  try {
    await withLock(`presets:${req.user.username}`, async () => {
      await writeUserJson(req.user.username, 'presets', req.body);
    });
    return res.json({ ok: true });
  } catch (error) {
    console.error('[预设保存] 失败:', error);
    return res.status(500).json({ error: '保存预设失败' });
  }
});

app.post('/api/folders', authMiddleware, async (req, res) => {
  if (!isValidFoldersPayload(req.body)) {
    return res.status(400).json({ error: '文件夹数据格式不正确' });
  }

  try {
    await withLock(`folders:${req.user.username}`, async () => {
      await writeUserJson(req.user.username, 'folders', req.body);
    });
    return res.json({ ok: true });
  } catch (error) {
    console.error('[文件夹保存] 失败:', error);
    return res.status(500).json({ error: '保存文件夹失败' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const start = async () => {
  await fsp.mkdir(USERS_DIR, { recursive: true });
  const users = await readUsers();
  if (!Array.isArray(users)) await writeUsers([]);

  app.listen(PORT, () => {
    console.log(`Prompt Builder API 已启动: http://localhost:${PORT}`);
    console.log(`数据目录: ${DATA_DIR}`);
    console.log('用户认证: 已启用');
  });
};

start().catch((error) => {
  console.error('服务启动失败:', error);
  process.exit(1);
});
