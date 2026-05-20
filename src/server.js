require('dotenv').config();

const http = require('http');
const app = require('./app');
const { setupSocket } = require('./socket.js');

const PORT = process.env.PORT;

const server = http.createServer(app);

setupSocket(server);

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
