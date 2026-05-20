const supabase = require('../config/database');

class DeviceRepository {
  async register({
    userId,
    deviceName,
    category,
    conservationState,
    description,
    uf,
    city,
  }) {
    const { data, error } = await supabase
      .from('dispositivos')
      .insert([
        {
          id_usuario: userId,
          nome_dispositivo: deviceName,
          categoria: category,
          estado_conservacao: conservationState,
          descricao: description,
          uf,
          cidade: city,
        },
      ])
      .select('id')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data.id;
  }

  async getDevices(userId) {
    let query = supabase
      .from('dispositivos')
      .select('*, imagens(*)')
      .neq('status', 'doado');

    if (userId) {
      query = query.neq('id_usuario', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getFilterAvaibleDevices({
    userId,
    search,
    categoria,
    estado_conservacao,
    uf,
    cidade,
  }) {
    let query = supabase
      .from('dispositivos')
      .select('*, imagens(*)')
      .neq('status', 'doado');

    if (userId) {
      query = query.neq('id_usuario', userId);
    }

    if (search) {
      query = query.ilike('nome_dispositivo', `%${search}%`);
    }

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    if (estado_conservacao) {
      query = query.eq('estado_conservacao', estado_conservacao);
    }

    if (uf) {
      query = query.eq('uf', uf);
    }

    if (cidade) {
      query = query.eq('cidade', cidade);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getUserDevices(userId) {
    const { data, error } = await supabase
      .from('dispositivos')
      .select('*, usuarios(nome), solicitacoes(id, status)')
      .eq('id_usuario', userId);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getUserRequests(userId) {
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('*, dispositivos(*, imagens(url)), usuarios(nome)')
      .eq('id_solicitante', userId);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getImages(idsList) {
    const { data, error } = await supabase
      .from('imagens')
      .select('*')
      .in('id_dispositivo', idsList);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async saveImage(urls, deviceId) {
    const imagesToInsert = urls.map((url) => ({
      url,
      id_dispositivo: deviceId,
    }));

    const { data, error } = await supabase
      .from('imagens')
      .insert(imagesToInsert);

    if (error) throw new Error(error.message);
  }

  async deleteImages(imagesToDelete) {
    const { data, error } = await supabase
      .from('imagens')
      .delete()
      .in('id', imagesToDelete)
      .select('url');

    if (error) throw new Error(error.message);

    return data.map((img) => img.url);
  }

  async postDeviceRequest({ idSolicitante, idDispositivo, justificativa }) {
    const { data, error } = await supabase.from('solicitacoes').insert([
      {
        id_solicitante: idSolicitante,
        id_dispositivo: idDispositivo,
        justificativa,
      },
    ]);

    if (error) throw new Error(error.message);
  }

  async getDeviceInfoForEmailRequest(deviceId) {
    console.log('Buscando informações do dispositivo para email:', deviceId);
    const { data, error } = await supabase
      .from('dispositivos')
      .select('nome_dispositivo, usuarios(nome, email)')
      .eq('id', deviceId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data.usuarios) {
      throw new Error('Dono do dispositivo não encontrado.');
    }

    return {
      nome_dispositivo: data.nome_dispositivo,
      nome_usuario: data.usuarios.nome,
      email: data.usuarios.email,
    };
  }

  async getDeviceInfoForEmailUpdate(requestId) {
    const { data, error } = await supabase
      .from('solicitacoes')
      .select(`
        dispositivos ( nome_dispositivo ),
        usuarios ( nome, email ) // Traz o email do SOLICITANTE
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      throw new Error(error.message);
    }
    if (!data.usuarios) {
      throw new Error('Dono do dispositivo não encontrado.');
    }
    return {
      nome_dispositivo: data.dispositivos.nome_dispositivo,
      nome_usuario: data.usuarios.nome,
      email: data.usuarios.email,
    };
  }


  async updateStatus(requestId, status) {
    const { data, error } = await supabase
      .from('solicitacoes')
      .update({ status })
      .eq('id', idSolicitacao)
      .select('id_dispositivo')
      .single();

    if (error) throw new Error(error.message);

    if (status === 'aceito' && data) {
      const { error: rejectError } = await supabase
        .from('solicitacoes')
        .update({ status: 'rejeitado' })
        .eq('id_dispositivo', data.id_dispositivo)
        .neq('id', idSolicitacao);

      if (rejectError) throw new Error(rejectError.message);
    }
  }

  async userDeviceWithRequest(userId) {
    const { data, error } = await supabase
      .from('dispositivos')
      .select('*, solicitacoes!inner(*)')
      .eq('id_usuario', userId)
      .eq('solicitacoes.status', 'pendente');

    if (error) throw new Error(error.message);

    return data;
  }

  async updateDevice({
    deviceId,
    name,
    category,
    conservationState,
    description,
  }) {
    const { data, error } = await supabase
      .from('dispositivos')
      .update({
        nome_dispositivo: name,
        categoria: category,
        estado_conservacao: conservationState,
        descricao: description,
      })
      .eq('id', deviceId)
      .select();

    if (error) throw new Error(error.message);

    return data;
  }

  async deleteDevice(deviceId) {
    const { data: imagesData, error: imagesError } = await supabase
      .from('imagens')
      .delete()
      .eq('id_dispositivo', deviceId)
      .select('url');

    if (imagesError) {
      throw new Error(imagesError.message);
    }

    const { error: reqError } = await supabase
      .from('solicitacoes')
      .delete()
      .eq('id_dispositivo', deviceId);

    if (reqError) {
      throw new Error(reqError.message);
    }

    const { error: deviceError } = await supabase
      .from('dispositivos')
      .delete()
      .eq('id', deviceId);

    if (deviceError) {
      throw new Error(deviceError.message);
    }

    return imagesData.map((img) => img.url);
  }
}

module.exports = new DeviceRepository();
