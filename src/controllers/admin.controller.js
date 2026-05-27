const adminService = require('../services/admin.service');

class AdminController {
    static async getDashboardData(req, res) {
        try {

            const periodUser = Number(req.query.periodUser) || 7;
            const periodDevice = Number(req.query.periodDevice) || 7;
            const periodMessages = Number(req.query.periodMessages) || 7;

            // Validação para evitar que `NaN` seja passado para a camada de serviço
            if (isNaN(periodUser) || isNaN(periodDevice) || isNaN(periodMessages)) {
                return res.status(400).json({ error: 'Parâmetros de período inválidos. Devem ser números.' });
            }

            const dashboardData = await adminService.getDashboardData(
                periodUser,
                periodDevice,
                periodMessages
            );
            return res.status(200).json(dashboardData);
        } catch (error) {
            // Log do erro no servidor para facilitar a depuração
            console.error("Erro ao buscar dados do dashboard:", error);
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AdminController;