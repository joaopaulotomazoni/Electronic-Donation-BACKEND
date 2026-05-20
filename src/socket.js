const { Server } = require('socket.io');
const messagesService = require('./services/messages.service');

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET, POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Usuário conectado');

    // ENTRAR NA SALA
    socket.on('joinRoom', ({ solicitacaoId }) => {
      const room = `solicitacao_${solicitacaoId}`;

      socket.join(room);

      console.log(`Usuário entrou na sala ${room}`);
    });

    // RECEBER MENSAGEM
    socket.on('sendMessage', async (data) => {
      const room = `solicitacao_${data.solicitacaoId}`;

      const mensagem = {
        usuarioId: data.usuarioId,
        id_solicitacao: data.solicitacaoId,
        conteudo: data.conteudo,
        createdAt: new Date(),
      };

      await messagesService.saveMessage(mensagem);

      // ENVIAR PARA TODOS DA SALA
      io.to(room).emit('newMessage', mensagem);

      console.log('Mensagem enviada:', mensagem);
    });

    socket.on('disconnect', () => {
      console.log('Usuário desconectado');
    });
  });

  return io;
}

module.exports = { setupSocket };
