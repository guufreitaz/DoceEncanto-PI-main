require('dotenv').config({ quiet: true });
const os = require('os');
const { abrirBanco } = require('./db');
const { criarApp } = require('./app');
const { criarClienteMP } = require('./mercadopago');

const PORTA = Number(process.env.PORT) || 3333;
const db = abrirBanco();
const mp = criarClienteMP();
const app = criarApp({ db, mp });

app.listen(PORTA, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
  console.log(`\nDoce Encanto API rodando na porta ${PORTA}`);
  console.log(`   Local:      http://localhost:${PORTA}`);
  for (const ip of ips) console.log(`   Na rede:    http://${ip}:${PORTA}`);
  console.log(`   Mercado Pago: ${mp.configurado ? 'ativo (token configurado)' : 'MODO DEMONSTRAÇÃO (sem MP_ACCESS_TOKEN)'}\n`);
});
