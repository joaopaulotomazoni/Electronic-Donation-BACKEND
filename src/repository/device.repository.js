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
      .select('*, usuarios(nome), solicitacoes(status)')
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

  async updateStatus(deviceId, status) {
    const { data, error } = await supabase
      .from('solicitacoes')
      .update({ status })
      .eq('id_dispositivo', deviceId);

    if (error) throw new Error(error.message);
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
