const express = require('express');
const cors = require('cors');
const path = require('path');
const { calcularFrete, FRETE_GRATIS_A_PARTIR_DE } = require('./frete');
const { criarClienteMP } = require('./mercadopago');

/**
 * Monta a API. Recebe o banco e o cliente do Mercado Pago por parâmetro
 * para que os testes possam usar um banco em memória e um Mercado Pago falso.
 */
function criarApp({ db, mp = criarClienteMP() }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '8mb' })); // fotos de produto chegam em base64

  // Fotos do cardápio (server/public/produtos), guardadas em cache pelo celular por 7 dias
  app.use('/imagens', express.static(path.join(__dirname, '..', 'public'), { maxAge: '7d' }));

  app.get('/', (req, res) => {
    res.json({ app: 'Doce Encanto API', versao: '1.0.0', mercadoPago: mp.configurado ? 'ativo' : 'modo demonstração' });
  });

  app.get('/frete', (req, res) => {
    const subtotal = Number(req.query.subtotal) || 0;
    res.json({ frete: calcularFrete(req.query.uf, subtotal), freteGratisAPartirDe: FRETE_GRATIS_A_PARTIR_DE });
  });

  app.use('/auth', require('./routes/auth')(db));
  app.use('/produtos', require('./routes/produtos')(db));
  app.use('/pedidos', require('./routes/pedidos')(db, mp));
  app.use('/contato', require('./routes/contato')(db));
  app.use('/relatorios', require('./routes/relatorios')(db));
  app.use('/pagamentos', require('./routes/pagamentos')(db, mp));

  app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ erro: 'A imagem é grande demais.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
    console.error(err);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  });

  return app;
}

module.exports = { criarApp };
