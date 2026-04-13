import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const JWT_SECRET = process.env.JWT_SECRET || 'prompt-builder-secret-change-in-production';

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) { fs.mkdirSync(DATA_DIR, { recursive: true }); }
if (!fs.existsSync(path.join(DATA_DIR, 'users'))) { fs.mkdirSync(path.join(DATA_DIR, 'users'), { recursive: true }); }

app.use(express.json({ limit: '10mb' }));

// ================= 工具函数 =================
const usersFile = () => path.join(DATA_DIR, 'users.json');

const readUsers = () => {
  try { return JSON.parse(fs.readFileSync(usersFile(), 'utf-8')); }
  catch { return []; }
};

const writeUsers = (users) => {
  fs.writeFileSync(usersFile(), JSON.stringify(users, null, 2), 'utf-8');
};

const userDataDir = (username) => {
  const dir = path.join(DATA_DIR, 'users', username);
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
  return dir;
};

const readUserJson = (username, name, fallback = null) => {
  try { return JSON.parse(fs.readFileSync(path.join(userDataDir(username), `${name}.json`), 'utf-8')); }
  catch { return fallback; }
};

const writeUserJson = (username, name, data) => {
  fs.writeFileSync(path.join(userDataDir(username), `${name}.json`), JSON.stringify(data, null, 2), 'utf-8');
};

// ================= JWT 中间件 =================
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = decoded; // { username, iat, exp }
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

// ================= 认证路由 =================

// 注册
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  if (username.length < 2 || username.length > 20) return res.status(400).json({ error: '用户名长度需2-20个字符' });
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) return res.status(400).json({ error: '用户名只能包含中文、字母、数字和下划线' });
  if (password.length < 4) return res.status(400).json({ error: '密码至少4个字符' });

  const users = readUsers();
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: '该用户名已被注册' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ username, password: hashedPassword, createdAt: Date.now() });
  writeUsers(users);

  // 创建用户数据目录
  userDataDir(username);

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username });
});

// 登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username });
});

// 验证 token 是否有效
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

// 修改密码
app.post('/api/change-password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: '请填写旧密码和新密码' });
  if (newPassword.length < 4) return res.status(400).json({ error: '新密码至少4个字符' });

  const users = readUsers();
  const user = users.find(u => u.username === req.user.username);
  if (!user || !bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(401).json({ error: '旧密码错误' });
  }

  user.password = bcrypt.hashSync(newPassword, 10);
  writeUsers(users);
  res.json({ ok: true });
});

// ================= 数据路由（需认证） =================

// 获取所有数据
app.get('/api/data', authMiddleware, (req, res) => {
  const username = req.user.username;
  const workspace = readUserJson(username, 'workspace', null);
  const savedPrompts = readUserJson(username, 'saved', []);
  const presets = readUserJson(username, 'presets', []);
  res.json({ workspace, savedPrompts, presets });
});

// 保存工作区
app.post('/api/workspace', authMiddleware, (req, res) => {
  try {
    writeUserJson(req.user.username, 'workspace', req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: '保存工作区失败' });
  }
});

// 保存历史快照
app.post('/api/saved', authMiddleware, (req, res) => {
  try {
    writeUserJson(req.user.username, 'saved', req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: '保存快照失败' });
  }
});

// 保存预设
app.post('/api/presets', authMiddleware, (req, res) => {
  try {
    writeUserJson(req.user.username, 'presets', req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: '保存预设失败' });
  }
});

// 健康检查（无需认证）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ================= 静态文件服务（生产环境） =================
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Prompt Builder API 运行在 http://localhost:${PORT}`);
  console.log(`📁 数据目录: ${DATA_DIR}`);
  console.log(`🔐 用户认证: 已启用`);
});
