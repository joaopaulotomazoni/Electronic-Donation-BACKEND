const userService = require('../services/user.service');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const userRepository = require('../repository/user.repository');

const BCRYPT_ROUNDS = 10;

class UserController {
  async login(request, response) {
    try {
      const { email, password } = request.body;

      const { userData, token } = await userService.login(email, password);

      response.json({ userData, token });
    } catch (error) {
      if (
        error.message === 'Email inválido' ||
        error.message === 'Senha inválida'
      ) {
        return response.status(401).json({ error: error.message });
      }
      console.error(error);
      response.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async changeAvatar(request, response) {
    try {
      const { userId } = request.params;

      const { base64Image } = request.body;

      const { novaFoto } = await userService.changeAvatar(userId, base64Image);

      response.json({ novaFoto });
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteAvatar(request, response) {
    try {
      const { userId } = request.params;

      const { antigaFoto } = await userService.deleteAvatar(userId);

      response.json({ antigaFoto });
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async register(request, response) {
    try {
      const registerSchema = z
        .object({
          name: z.string(),
          cpfOrCnpj: z.string().min(11, 'CPF ou CNPJ inválido'),
          cep: z.string().min(8, 'CEP inválido'),
          rua: z.string().min(1, 'Rua é obrigatória'),
          numero: z.string().min(1, 'Número é obrigatório'),
          complemento: z.string().optional(),
          bairro: z.string().min(1, 'Bairro é obrigatório'),
          cidade: z.string().min(1, 'Cidade é obrigatória'),
          estado: z.string().min(2, 'Estado é obrigatório'),
          email: z.string().email('Email inválido'),
          password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
          confirmPassword: z
            .string()
            .min(6, 'Senha deve ter no mínimo 6 caracteres'),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: 'As senhas não coincidem',
          path: ['confirmPassword'],
        });

      const {
        name,
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
        confirmPassword,
      } = registerSchema.parse(request.body);

      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const payload = {
        nome: name,
        cpfOrCnpj,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        email,
        password: hashedPassword,
      };

      const { userData, token } = await userService.register(payload);

      response.json({ userData, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({ error: error.errors });
      }
      if (
        error.message === 'Erro ao registrar usuário' ||
        error.message === 'O usuario ja possui cadastro'
      ) {
        return response.status(400).json({ error: error.message });
      }
      console.error(error);
      response.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async forgotPassword(request, response) {
    try {
      const { email } = request.body;

      const userId = await userService.generateCode(email);

      if (!userId) {
        return response
          .status(404)
          .json({ error: 'Não foi possível enviar o e-mail.' });
      }

      const salvarCodigo = await userService.createVerificationCode(
        userId,
        email
      );

      return response
        .status(200)
        .json({ message: 'Código enviado com sucesso para o seu e-mail.' });
    } catch {
      response.status(500).json({ error: 'Erro ao enviar código' });
    }
  }

  async verifyCode(request, response) {
    try {
      const { email, code } = request.body;

      const userId = await userService.verifyCode(email, code);

      if (!userId) {
        return response
          .status(404)
          .json({ error: 'Não foi possível enviar o e-mail.' });
      }

      return response
        .status(200)
        .json({ message: 'Código enviado com sucesso para o seu e-mail.' });
    } catch {
      response.status(500).json({ error: 'Erro ao enviar código' });
    }
  }

  async resetPassword(request, response) {
    try {
      const { email, code, senha } = request.body;

      const { userData, token } = await userService.resetPassword(
        email,
        code,
        senha
      );

      if (!userData || !token) {
        return response
          .status(400)
          .json({ error: 'Código inválido ou expirado.' });
      }

      return response.status(200).json({ userData, token });
    } catch {
      response.status(500).json({ error: 'Erro ao redefinir a senha.' });
    }
  }

  async changePassword(request, response) {
    try {
      const { userId } = request.params;
      const { currentPassword, newPassword, confirmNewPassword } = request.body;

      const result = await userService.changePassword({
        userId,
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      return response.status(200).json({ passwordChanged: result });
    } catch {
      response.status(500).json({ error: 'Erro ao redefinir a senha.' });
    }
  }

  async updateProfile(request, response) {
    try {
      const { userId } = request.params;

      console.log(request.body);

      const updateProfileSchema = z.object({
        nome: z.string().min(1, 'Nome é obrigatório'),
        cep: z.string().min(8, 'CEP inválido'),
        estado: z.string().min(2, 'Estado é obrigatório'),
        cidade: z.string().min(1, 'Cidade é obrigatória'),
        bairro: z.string().min(1, 'Bairro é obrigatório'),
        rua: z.string().min(1, 'Rua é obrigatória'),
        numero: z.coerce.string().min(1, 'Número é obrigatório'),
        complemento: z.string().optional(),
      });

      const payload = updateProfileSchema.parse(request.body);

      await userService.updateProfile(payload, userId);

      return response
        .status(200)
        .json({ message: 'Perfil atualizado com sucesso.' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({ error: error.errors });
      }
      response.status(500).json({ error: 'Erro ao atualizar o perfil.' });
    }
  }
}

module.exports = new UserController();
