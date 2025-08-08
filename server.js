import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Sua chave de API da Yampi (configure no Render como variável de ambiente)
const YAMPI_API_KEY = process.env.YAMPI_API_KEY; 

// Webhook da Yampi
app.post("/webhook", async (req, res) => {
  try {
    console.log("📦 Webhook recebido:", JSON.stringify(req.body, null, 2));

    const { event, resource } = req.body;

    // Só processa eventos de atualização de estoque
    if (event === "product.inventory.updated") {
      const productId = resource.id;
      const quantity = resource.quantity;

      console.log(`➡ Estoque do produto ${productId}: ${quantity}`);

      if (quantity === 0) {
        console.log(`⚠ Estoque zerado. Desativando produto ${productId}...`);

        const url = `https://api.yampi.com.br/v2/product/${productId}`;
        const body = JSON.stringify({ active: false });

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${YAMPI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body
        });

        // Verifica se a resposta é JSON
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

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
