const supabase = require('../config/database');

class MessagesRepository {
  async saveMessage({ usuarioId, id_solicitacao, conteudo, createdAt }) {
    const { data, error } = await supabase.from('mensagens').insert([
      {
        id_remetente: usuarioId,
        id_solicitacao,
        conteudo,
        created_at: createdAt,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getMessagesBySolicitacao({ idSolicitacao }) {
    const { data, error } = await supabase
      .from('mensagens')
      .select()
      .eq('id_solicitacao', idSolicitacao);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

module.exports = new MessagesRepository();
