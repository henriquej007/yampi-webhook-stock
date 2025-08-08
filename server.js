import express from "express";

const app = express();
app.use(express.json());

// 🔑 Suas credenciais da Yampi
const YAMPI_ALIAS = "compra-z"; // ex: "minhaloja"
const YAMPI_TOKEN = "t6cya7e6PCWZn4GR1G5xjcSXaiKZHgFJvATYIsmR";
const YAMPI_SECRET = "sk_OWydQm3tFhQtfVZMInTfy8siSUPsUQ7bxzlC3";

// Função para buscar dados atuais do produto
async function getProduct(productId) {
  const res = await fetch(`https://${YAMPI_ALIAS}.yampi.com.br/api/v3/catalog/products/${productId}`, {
    headers: {
      "User-Token": YAMPI_TOKEN,
      "User-Secret-Key": YAMPI_SECRET
    }
  });

  if (!res.ok) throw new Error(`Erro ao buscar produto ${productId}`);
  return await res.json();
}

// Função para atualizar produto
async function updateProductActive(productId, active) {
  // Buscar dados atuais
  const product = await getProduct(productId);

  // Montar payload obrigatório
  const body = {
    simple: product.simple,
    brand_id: product.brand_id,
    name: product.name,
    active: active
  };

  // Fazer atualização
  const res = await fetch(`https://${YAMPI_ALIAS}.yampi.com.br/api/v3/catalog/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "User-Token": YAMPI_TOKEN,
      "User-Secret-Key": YAMPI_SECRET
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`Erro ao atualizar produto ${productId}`);
  return await res.json();
}

// 📌 Endpoint para receber webhook da Yampi
app.post("/webhook", async (req, res) => {
  try {
    const event = req.body;

    // Aqui depende de como a Yampi manda o evento
    // Vamos supor que ela mande { product_id: 123, stock: 0 }
    const productId = event.product_id;
    const stock = event.stock;

    if (stock === 0) {
      console.log(`Estoque do produto ${productId} zerou. Desativando...`);
      await updateProductActive(productId, false);
    }

    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.status(500).send({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
