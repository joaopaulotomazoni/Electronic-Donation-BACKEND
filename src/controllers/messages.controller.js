const messagesService = require('../services/messages.service');

class MessagesController {
  async getMessagesBySolicitacao(request, response) {
    try {
      const { idSolicitacao } = request.params;

      const messages = await messagesService.getMessagesBySolicitacao({
        idSolicitacao,
      });

      return response.status(200).json(messages);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MessagesController();
