const supabase = require('../config/database');

class UserRepository {
  async login(email) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }

  async verifyExistingUser(email, cpfOrCnpj) {
    const { data } = await supabase
      .from('usuarios')
      .select('id')
      .or(`email.eq."${email}",cpfOrCnpj.eq."${cpfOrCnpj}"`)
      .limit(1);

    if (data && data.length > 0) {
      return true;
    }
    return false;
  }

  async register({
    nome,
    cpfOrCnpj,
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    email,
    password,
  }) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          nome,
          cpfOrCnpj,
          email,
          cep,
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          senha: password,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }

  async verifyExistingEmail(email) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return data[0].id;
  }

  async createVerificationCode(userId, codigoCriptografado) {
    const now = new Date();
    const expires_at = new Date(now.getTime() + 10 * 60 * 1000);

    const { data, error } = await supabase.from('codigo_verificacao').upsert(
      {
        id_usuario: userId,
        codigo: codigoCriptografado,
        created_at: now,
        expires_at,
      },
      { onConflict: 'id_usuario' }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getCode(email) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, codigo_verificacao!inner(codigo, expires_at)')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return {
      userId: data.id,
      expires_at: data.codigo_verificacao.expires_at,
      codigo: data.codigo_verificacao.codigo,
    };
  }

  async resetPassword(email, password) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ senha: password })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }
}

module.exports = new UserRepository();
