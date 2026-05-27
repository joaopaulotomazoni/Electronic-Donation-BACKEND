const supabase = require('../config/database');


class AdminRepository {
    async getDeviceData() {
        const { data, error } = await supabase
            .from('dispositivos')
            .select('id, nome_dispositivo, categoria, estado_conservacao');

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async getUserData() {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome, email, created_at');

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async getTotalUsers() {
        const { count, error } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true });
        if (error) {
            throw new Error(error.message);
        }
        return count || 0;
    }

   async getTotalDonated() {
        const { count, error } = await supabase
            .from('dispositivos')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'doado');
        if (error){
            throw new Error(error.message);
        }
        return count || 0;
    }


    async getNewUsersDate(period) {
        const { count, error } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString());

        if (error) {
            throw new Error(error.message);
        }

        return count || 0;
    }

    async getNewDevicesDate(period) {
        const { count, error } = await supabase
            .from('dispositivos')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString());

        if (error) {
            throw new Error(error.message);
        }

        return count || 0;
    }

    async getDeviceStatusDistribution() {
        const { data, error } = await supabase
            .from('dispositivos')
            .select('status');

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async getTopCategories() {
        const { data, error } = await supabase
            .from('dispositivos')
            .select('categoria')

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async getPendingRequests() {
        const { data, error } = await supabase
            .from('solicitacoes')
            .select('id, id_dispositivo, id_solicitante, created_at')
            .eq('status', 'pendente');

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async getMessageVolume(period) {
        const { count, error } = await supabase
            .from('mensagens')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString());

        if (error) {
            throw new Error(error.message);
        }

        return count || 0;
    }

    async getSuccessRate() {
        // Busca total de solicitações vs concluídas
        const { count: total, error: err1 } = await supabase.from('solicitacoes').select('*', { count: 'exact', head: true });
        const { count: sucess, error: err2 } = await supabase.from('solicitacoes').select('*', { count: 'exact', head: true }).eq('status', 'aceito');
        if (err1 || err2) throw (err1 || err2);
        return total > 0 ? (sucess / total) * 100 : 0;
    }
}

module.exports = new AdminRepository();