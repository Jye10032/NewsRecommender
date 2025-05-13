import express from 'express';
import { getUserPreferences, saveUserPreferences } from '../preferences.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 用户偏好设置路由 - 需要身份验证
router.get('/user/preferences', verifyToken, getUserPreferences);
router.post('/user/preferences', verifyToken, saveUserPreferences);

export default router;