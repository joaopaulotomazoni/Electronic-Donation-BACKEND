const adminService = require('../services/admin.service');

async function adminAuthMiddleware(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        message: "ID do usuário não fornecido no cabeçalho 'X-User-Id'",
      });
    }
    const isAdmin = await adminService.adminAuth(userId);

    if (isAdmin) {
      next();
    } else {
      return res.status(403).json({
        message: 'Acesso restrito a administradores',
      });
    }
  } catch (error) {
    console.error('Erro na autenticação do admin:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor durante a autenticação do admin',
    });
  }
}

module.exports = adminAuthMiddleware;
