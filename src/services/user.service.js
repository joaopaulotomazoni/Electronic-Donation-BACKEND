const supabase = require('../config/database');
const userRepository = require('../repository/user.repository');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/generateToken');
const { customAlphabet } = require('nanoid');
const nodemailer = require('nodemailer');

class UserService {
  async login(email, password) {
    const user = await userRepository.login(email);

    if (!user) {
      throw new Error('Email inválido');
    }

    const passwordMatch = await bcrypt.compare(password, user.senha);

    if (!passwordMatch) {
      throw new Error('Senha inválida');
    }

    const token = generateToken(user);

    return {
      userData: {
        id: user.id,
        nome: user.nome,
        cpf: user.cpf,
        email: user.email,
      },
      token,
    };
  }

  async register(payload) {
    const isUserExist = await userRepository.verifyExistingUser(
      payload.email,
      payload.cpfOrCnpj
    );

    if (isUserExist) {
      throw new Error('O usuario ja possui cadastro');
    }

    const user = await userRepository.register(payload);

    if (!user) {
      throw new Error('Erro ao registrar usuário');
    }

    const token = generateToken(user);

    return {
      userData: {
        id: user.id,
        nome: user.nome,
        cpf: user.cpf,
        email: user.email,
      },
      token,
    };
  }

  async generateCode(email) {
    return await userRepository.verifyExistingEmail(email);
  }

  async createVerificationCode(userId, email) {
    const gerarCodigo = customAlphabet('0123456789', 6);
    const codigo = gerarCodigo();
    const codigoCriptografado = await bcrypt.hash(codigo, 10);

    await userRepository.createVerificationCode(userId, codigoCriptografado);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    transporter.sendMail({
      from: `"Electronic Donation" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de verificação',
      html: `
      <h2>Recuperação de senha</h2>
      <p>Seu código é:</p>
      <h1>${codigo}</h1>
      <p>Esse código expira em 10 minutos.</p>
    `,
    });

    return codigo;
  }

  async verifyCode(email, code) {
    const apiCode = await userRepository.getCode(email);

    if (!apiCode) {
      return null;
    }

    const isValido = await bcrypt.compare(code, apiCode.codigo);

    const isDateValid = new Date() <= new Date(apiCode.expires_at);

    if (isValido && isDateValid) {
      return apiCode.userId;
    }

    return null;
  }

  async resetPassword(email, code, password) {
    const apiCode = await userRepository.getCode(email);

    if (!apiCode) {
      return null;
    }

    const isValido = await bcrypt.compare(code, apiCode.codigo);

    if (!isValido) {
      return null;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepository.resetPassword(email, hashedPassword);

    const token = generateToken(user);

    return {
      userData: {
        id: user.id,
        nome: user.nome,
        cpf: user.cpfOrCnpj,
        email: user.email,
      },
      token,
    };
  }
}

module.exports = new UserService();
