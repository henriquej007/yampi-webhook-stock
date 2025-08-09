import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Variáveis de ambiente (configure no Render)
const YAMPI_API_KEY = process.env.YAMPI_API_KEY;
const YAMPI_SECRET_KEY = process.env.YAMPI_SECRET_KEY;

app.post("/webhook", async (req, res) => {
  try {
    console.log("📦 Webhook recebido:", JSON.stringify(req.body, null, 2));

    const { event, resource } = req.body;

    // Processa eventos de atualização de estoque
    if (event === "product.inventory.updated") {
      const productId = resource.id;
      const quantity = resource.quantity;

      console.log(`➡ Estoque do produto ${productId}: ${quantity}`);

      if (quantity === 0) {
        console.log(`⚠ Estoque zerado. Desativando produto ${productId}...`);

        // Monta o corpo com TODOS os campos obrigatórios
        const body = {
          simple: true, // ou false, conforme seu produto
          brand_id: resource.brand_id, // vem do webhook
          active: false,
          name: resource.name // vem do webhook
        };

        const url = `https://api.dooki.com.br/v2/compra-z/catalog/products/${productId}`;

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "User-Token": YAMPI_API_KEY,
            "User-Secret-Key": YAMPI_SECRET_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body)
        });

        const contentType = response.headers.get("content-type");
        let data = contentType && contentType.includes("application/json")
          ? await response.json()
          : await response.text();

        if (!response.ok) {
          console.error(`❌ Erro ao desativar produto: HTTP ${response.status}`, data);
        } else {
          console.log(`✅ Produto ${productId} desativado com sucesso!`, data);
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    res.status(500).send("Erro interno");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
