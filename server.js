import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const YAMPI_ALIAS = process.env.YAMPI_ALIAS;
const YAMPI_TOKEN = process.env.YAMPI_TOKEN;
const YAMPI_SECRET = process.env.YAMPI_SECRET;

app.post("/webhook", async (req, res) => {
  console.log("📦 Webhook recebido:", JSON.stringify(req.body, null, 2));

  const event = req.body.event;
  const quantity = req.body.resource?.quantity;
  const productId = req.body.resource?.id;

  if (event === "product.inventory.updated" && productId) {
    try {
      const status = quantity > 0 ? "active" : "inactive";

      const response = await fetch(
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

      const data = await response.json();
      console.log(`✅ Produto ${productId} atualizado para ${status}`, data);
    } catch (error) {
      console.error("❌ Erro ao atualizar produto:", error);
    }
  }

  res.status(200).send("OK");
});

app.listen(10000, () => {
  console.log("🚀 Servidor rodando na porta 10000");
});
