// routes/adminRoutes.js
import express from 'express';
import * as adminAuthController from '../controllers/adminAuth.js';
import * as menuController from '../controllers/menuController.js';
import { verifyAdminToken, hasPermission } from '../middleware/authMiddleware.js';
import userRoutes from './userRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import rightRoutes from './rightRoutes.js';
//import menuRoutes from './routes/menuRoutes.js';
import newsRoutes from './newsRoutes.js';
//import * as userController from '../controllers/userController.js';

const router = express.Router();
// 登录路由 - 不需要验证
router.post('/login', adminAuthController.login);

// 需要验证的路由
router.get('/menu', verifyAdminToken, menuController.getAdminMenus);


router.use('/', userRoutes);

router.use('/', rightRoutes);

router.use('/', categoryRoutes);

//  app.use('/admin/menu', menuRoutes);
router.use('/news', newsRoutes);
// 用户管理相关路由
//router.get('/users', verifyAdminToken, hasPermission('user:read'), userController.getUsers);
//router.post('/users', verifyAdminToken, hasPermission('user:create'), userController.createUser);
// 更多路由...

export default router;