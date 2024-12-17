const express = require('express');
const venom = require('venom-bot');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

let venomClient; // Variável para armazenar a instância do cliente Venom

const port = process.env.PORT || 3000;

// Inicializa o Venom e armazena o cliente
const sessionName = process.env.SESSION_NAME || 'exciting-appreciation';
venom
  .create(
    sessionName,
    (base64QR, asciiQR) => {
      console.log(asciiQR); // Exibe o QR Code no terminal
      // Armazena o QR code em uma variável para uso posterior
      global.base64QRCode = base64QR;
    },
    undefined,
    { logQR: false }
  )
  .then((client) => {
    venomClient = client;
    console.log('Venom iniciado com sucesso!');
  })
  .catch((erro) => {
    console.error('Erro ao iniciar o Venom:', erro);
  });

// Aguarda o Venom estar inicializado antes de exibir o QR Code
const waitForVenomInitialization = () => new Promise((resolve) => {
  const interval = setInterval(() => {
    if (global.base64QRCode) {
      clearInterval(interval);
      resolve();
    }
  }, 1000); // Verifica a cada segundo
});

app.get('/qr-code', async (req, res) => {
  await waitForVenomInitialization();
  if (!global.base64QRCode) {
    return res.status(500).send('QR Code ainda não disponível');
  }

  res.send(`<img src="data:image/png;base64,${global.base64QRCode}" alt="QR Code">`);
});

// Rota para enviar mensagem
app.post('/send-message', async (req, res) => {
  const { contactNumber, message } = req.body;

  if (!contactNumber || !message) {
    return res.status(400).send('Número do contato e mensagem são obrigatórios.');
  }

  try {
    await sendMessage(contactNumber, message);
    res.status(200).send('Mensagem enviada com sucesso.');
  } catch (erro) {
    res.status(500).send('Erro ao enviar mensagem: ' + erro.message);
  }
});

// Inicia o servidor no Vercel
app.listen(port, () => {
  console.log('Servidor rodando na porta', port);
});
