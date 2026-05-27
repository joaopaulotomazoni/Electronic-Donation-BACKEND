const express = require('express');
const cors = require('cors');
const { authMiddleware } = require('../middlewares/authMiddleware');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

const UserController = require('../controllers/user.controller');
const DeviceController = require('../controllers/device.controller');
const MessagesController = require('../controllers/messages.controller');
const AdminController = require('../controllers/admin.controller');
const { auth } = require('../config/database');

const router = express.Router();


router.post('/users/:userId/avatar', UserController.changeAvatar);

router.delete('/users/:userId/avatar', UserController.deleteAvatar);

router.put('/users/:userId/update-profile', UserController.updateProfile);

router.put('/users/:userId/change-password', UserController.changePassword);

router.post('/login', UserController.login);

router.post('/register', UserController.register);

router.post('/forgot-password/send-code', UserController.forgotPassword);

router.post('/forgot-password/verify-code', UserController.verifyCode);

router.post('/forgot-password/reset-password', UserController.resetPassword);

router.get('/avaible-devices', DeviceController.getDevices);

router.get('/filter-avaible-devices', DeviceController.getFilterAvaibleDevices);

router.get('/:userId/devices', authMiddleware, DeviceController.getUserDevices);

router.get('/devices', authMiddleware, DeviceController.getAllDevices);


router.post(
  '/:userId/device/register',
  authMiddleware,
  DeviceController.register
);

router.put(
  '/:deviceId/device/update',
  authMiddleware,
  DeviceController.updateDevice
);

router.delete(
  '/:deviceId/device/delete',
  authMiddleware,
  DeviceController.deleteDevice
);

router.get(
  '/:userId/requests',
  authMiddleware,
  DeviceController.getUserRequests
);

router.get(
  '/:userId/user-device-with-request',
  authMiddleware,
  DeviceController.userDeviceWithRequest
);

router.put(
  '/:idSolicitacao/updateStatus',
  authMiddleware,
  DeviceController.updateStatus
);

router.post(
  '/:idSolicitante/:idDispositivo/device-request',
  authMiddleware,
  DeviceController.postDeviceRequest
);

router.get(
  '/chat/:idSolicitacao/messages',
  authMiddleware,
  MessagesController.getMessagesBySolicitacao
);

router.get(
  '/admin/dashboard',
  adminAuthMiddleware,
  AdminController.getDashboardData
);

//router.get("/minha-rota", authMiddleware, dashboardController)

module.exports = router;
