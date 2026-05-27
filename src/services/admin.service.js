const adminRepository = require('../repository/admin.repository');


class AdminService {
    static async getDashboardData(periodUser, periodDevice, periodMessages) {
        try {

            const [
                totalDonated,
                totalUsers,
                successRate,
                newUsers,
                newDevices,
                statusRaw,
                categoriesRaw,
                pendingRequests,
                msgVolume,
            ] = await Promise.all([
                adminRepository.getTotalDonated(),
                adminRepository.getTotalUsers(),
                adminRepository.getSuccessRate(),
                adminRepository.getNewUsersDate(periodUser),
                adminRepository.getNewDevicesDate(periodDevice),
                adminRepository.getDeviceStatusDistribution(),
                adminRepository.getTopCategories(),
                adminRepository.getPendingRequests(),
                adminRepository.getMessageVolume(periodMessages),
            ]);

            // A agregação agora é feita pelo banco de dados, o .reduce() não é mais necessário.
            // Apenas formatamos o resultado.
            const statusDistribution = statusRaw.reduce((acc, curr) => {
                const status = curr.status;
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            const categoryCounts = categoriesRaw.reduce((acc, curr) => {
                const cat = curr.categoria;
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {});

            const topCategories = Object.entries(categoryCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            return {
                kpis: {
                    totalDonations: totalDonated,
                    totalUsers: totalUsers,
                    matchSuccessRate: `${successRate.toFixed(2)}%`,
                    growth: {
                        newUsers,
                        newDevices
                    }
                },
                inventory: {
                    distribution: statusDistribution, // Ex: { "disponivel": 10, "analise": 5 }
                    topCategories: topCategories,
                    pendingActionCount: pendingRequests.length
                },
                security: {
                    pendingRequests: pendingRequests.map(r => ({
                        id: r.id,
                        date: r.created_at,
                        deviceId: r.id_dispositivo
                    }))
                },
                engagement: {
                    messagesTotal: msgVolume,
                }
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async adminAuth(idUsuario) {
        console.log("Autenticando admin com ID:", idUsuario);
        // A função do repositório agora retorna true se o usuário for admin, e false caso contrário.
        const isAdmin = await adminRepository.adminAuth(idUsuario);
        console.log("Resultado da autenticação no serviço:", isAdmin ? `Usuário ${idUsuario} é admin.` : `Usuário ${idUsuario} não é admin.`);
        return isAdmin;
    }
}

module.exports = AdminService;
