import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// Configura para ler JSON no body
app.use(express.json());

// Endpoint raiz só para teste rápido
app.get('/', (req, res) => {
  res.send('Servidor Yampi Webhook ativo ✅');
});

// Endpoint que a Yampi vai chamar
app.post('/webhook', async (req, res) => {
  console.log('📦 Webhook recebido:', JSON.stringify(req.body, null, 2));

  try {
    const event = req.body.event;
    const productData = req.body.resource;

    // Verifica se é evento de atualização de estoque
    if (event === 'product.inventory.updated') {
      const productId = productData.id;
      const quantity = productData.quantity;

      console.log(`➡ Estoque do produto ${productId}: ${quantity}`);

      if (quantity === 0) {
        console.log(`⚠ Estoque zerado. Desativando produto ${productId}...`);

        const yampiResponse = await fetch(`https://api.yampi.com.br/v1/product/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.YAMPI_TOKEN}` // token no Render ENV
          },
          body: JSON.stringify({
            active: false
          })
        });

        const data = await yampiResponse.json();
        console.log('📡 Resposta da Yampi:', data);
      }
    }

    // Sempre responde 200 para evitar retries desnecessários
    res.status(200).send({ status: 'ok' });

  } catch (err) {
    console.error('❌ Erro ao processar webhook:', err);
    res.status(500).send({ error: 'erro interno' });
  }
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
