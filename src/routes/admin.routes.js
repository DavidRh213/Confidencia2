import { Router } from 'express';
import { getAdminData, getUsers, updateUserRole, createRole, assignPermission, revokePermission, getRolesAndPermissions, getAuditoria, triggerBackup } from '../controllers/admin.controller.js';
import { isAdmin, hasPermission } from '../middleware/auth.js';

const router = Router();

// Rutas originales (compatibilidad con frontend actual)
router.get('/', isAdmin, getAdminData);
router.post('/user-role', isAdmin, updateUserRole);
router.post('/role', isAdmin, createRole);
router.post('/permission-assign', isAdmin, assignPermission);
router.post('/permission-revoke', isAdmin, revokePermission);
router.post('/backup', isAdmin, triggerBackup);

// Nuevas rutas granulares (opcionales para futuro)
router.get('/users', isAdmin, getUsers);
router.post('/role/update', isAdmin, updateUserRole);
router.post('/role/create', isAdmin, createRole);
router.post('/permission/assign', isAdmin, assignPermission);
router.post('/permission/revoke', isAdmin, revokePermission);
router.get('/roles-permissions', isAdmin, getRolesAndPermissions);
router.get('/audit', isAdmin, getAuditoria);

export default router;
