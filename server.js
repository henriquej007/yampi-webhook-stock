import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Variáveis de ambiente
const YAMPI_API_KEY = process.env.YAMPI_API_KEY; 
const YAMPI_SECRET_KEY = process.env.YAMPI_SECRET_KEY;
const YAMPI_ALIAS = process.env.YAMPI_ALIAS; // exemplo: "compra-z"

// Webhook da Yampi
app.post("/webhook", async (req, res) => {
  try {
    console.log("📦 Webhook recebido:", JSON.stringify(req.body, null, 2));

    const { event, resource } = req.body;

    if (event === "product.inventory.updated") {
      const productId = resource.id;
      const quantity = resource.quantity;

      console.log(`➡ Estoque do produto ${productId}: ${quantity}`);

      if (quantity === 0) {
        console.log(`⚠ Estoque zerado. Desativando produto ${productId}...`);

        // 1️⃣ Buscar dados atuais do produto
        const getResponse = await fetch(
          `https://api.yampi.com.br/v1/${YAMPI_ALIAS}/products/${productId}`,
          {
            headers: {
              "Content-Type": "application/json",
              "User-Token": YAMPI_API_KEY,
              "User-Secret-Key": YAMPI_SECRET_KEY
            }
          }
        );

        if (!getResponse.ok) {
          console.error(`❌ Erro ao buscar produto: HTTP ${getResponse.status}`);
          return res.status(500).send("Erro ao buscar produto");
        }

        const productData = await getResponse.json();

        // 2️⃣ Montar body com os campos obrigatórios
        const body = {
          simple: "true",
          brand_id: 1,
          active: false, // desativando
          name: productData.name
        };

        // 3️⃣ Atualizar produto
        const updateResponse = await fetch(
          `https://api.yampi.com.br/v1/${YAMPI_ALIAS}/products/${productId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "User-Token": YAMPI_API_KEY,
              "User-Secret-Key": YAMPI_SECRET_KEY
            },
            body: JSON.stringify(body)
          }
        );

        const updateData = await updateResponse.json();

        if (!updateResponse.ok) {
          console.error(`❌ Erro ao atualizar produto: HTTP ${updateResponse.status}`, updateData);
        } else {
          console.log(`✅ Produto ${productId} desativado com sucesso!`, updateData);
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
