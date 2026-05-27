const supabase = require('../config/database');
const userRepository = require('../repository/user.repository');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/generateToken');
const { customAlphabet } = require('nanoid');
const nodemailer = require('nodemailer');
const { uploadBase64Images, deleteImages } = require('./upload.service');

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
        cpf: user.cpfOrCnpj,
        email: user.email,
        avatar: user.foto_perfil,
        cep: user.cep,
        uf: user.estado,
        cidade: user.cidade,
        bairro: user.bairro,
        rua: user.rua,
        numero: user.numero,
        complemento: user.complemento,
        isAdmin: user.admin,
      },
      token,
    };
  }

  async changeAvatar(userId, base64Image) {
    const imageUrls = await uploadBase64Images([base64Image]);
    const imageUrl = imageUrls[0];

    const images = await userRepository.changeAvatar(userId, imageUrl);

    await deleteImages([images.antigaFoto]);
    return images;
  }

  async deleteAvatar(userId) {
    const images = await userRepository.deleteAvatar(userId);

    await deleteImages([images.antigaFoto]);
    return images;
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
        cpf: user.cpfOrCnpj,
        email: user.email,
        avatar: user.foto_perfil,
        cep: user.cep,
        uf: user.estado,
        cidade: user.cidade,
        bairro: user.bairro,
        rua: user.rua,
        numero: user.numero,
        complemento: user.complemento,
        isAdmin: user.admin,
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
        avatar: user.foto_perfil,
        cep: user.cep,
        uf: user.estado,
        cidade: user.cidade,
        bairro: user.bairro,
        rua: user.rua,
        numero: user.numero,
        complemento: user.complemento,
        isAdmin: user.admin,
      },
      token,
    };
  }

  async changePassword({
    userId,
    currentPassword,
    newPassword,
    confirmNewPassword,
  }) {
    if (newPassword !== confirmNewPassword) {
      throw new Error('As novas senhas não coincidem.');
    }

    const apiCurrentPassword = await userRepository.getPassword(userId);

    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      apiCurrentPassword
    );

    if (!isCurrentPasswordCorrect) {
      throw new Error('A senha atual está incorreta.');
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);

    const result = await userRepository.updatePassword(
      userId,
      encryptedPassword
    );

    return result;
  }

  async updateProfile(payload, userId) {
    await userRepository.updateProfile(payload, userId);
  }
}

module.exports = new UserService();
