import { Router } from 'express';
import { login, logout, register, getSessionUser, recoverPassword } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/logout', logout);
router.get('/session-user', getSessionUser);
router.post('/recover', recoverPassword);

export default router;
