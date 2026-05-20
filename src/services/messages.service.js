const messagesRepository = require('../repository/messages.repository');

class MessagesService {
  async saveMessage(message) {
    await messagesRepository.saveMessage(message);
  }

  async getMessagesBySolicitacao({ idSolicitacao }) {
    const messages = await messagesRepository.getMessagesBySolicitacao({
      idSolicitacao,
    });

    return messages;
  }
}

module.exports = new MessagesService();
