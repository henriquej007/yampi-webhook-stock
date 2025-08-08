import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const YAMPI_ALIAS = process.env.YAMPI_ALIAS;
const YAMPI_TOKEN = process.env.YAMPI_TOKEN;

app.post("/webhook", async (req, res) => {
  console.log("📦 Webhook recebido:", JSON.stringify(req.body, null, 2));

  const event = req.body.event;
  const quantity = req.body.resource?.quantity;
  const stockId = req.body.resource?.stock_id;

  if (event === "product.inventory.updated" && stockId) {
    try {
      // 1️⃣ Buscar produto pelo estoque
      const stockResponse = await fetch(
        `https://${YAMPI_ALIAS}.yampi.com.br/api/v2/stocks/${stockId}`,
        {
          headers: {
            Authorization: `Bearer ${YAMPI_TOKEN}`,
          },
        }
      );
      const stockData = await stockResponse.json();
      const productId = stockData?.data?.product?.id;

      if (!productId) {
        console.error("❌ Não foi possível encontrar o produto para o estoque:", stockId);
        return res.status(400).send("Produto não encontrado");
      }

      // 2️⃣ Definir novo status
      const status = quantity > 0 ? "active" : "inactive";

      // 3️⃣ Atualizar produto
      const updateResponse = await fetch(
        `https://${YAMPI_ALIAS}.yampi.com.br/api/v2/products/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${YAMPI_TOKEN}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const updateData = await updateResponse.json();
      console.log(`✅ Produto ${productId} atualizado para ${status}`, updateData);
    } catch (error) {
      console.error("❌ Erro ao processar webhook:", error);
    }
  }

  res.status(200).send("OK");
});

app.listen(10000, () => {
  console.log("🚀 Servidor rodando na porta 10000");
});
