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
}

module.exports = new UserRepository();
