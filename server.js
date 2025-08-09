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

    if (event === "product.inventory.updated") {
      const sku = resource.sku;
      const quantity = resource.quantity;

      console.log(`➡ Estoque do SKU ${sku}: ${quantity}`);

      // Busca o produto pelo SKU
      const searchUrl = `https://api.dooki.com.br/v2/compra-z/catalog/products?sku=${encodeURIComponent(sku)}`;
      const searchResp = await fetch(searchUrl, {
        method: "GET",
        headers: {
          "User-Token": YAMPI_API_KEY,
          "User-Secret-Key": YAMPI_SECRET_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!searchResp.ok) {
        const errText = await searchResp.text();
        throw new Error(`Erro ao buscar produto pelo SKU: ${searchResp.status} - ${errText}`);
      }

      const searchData = await searchResp.json();
      if (!searchData || !searchData.data || searchData.data.length === 0) {
        throw new Error(`Produto com SKU ${sku} não encontrado.`);
      }

      const product = searchData.data[0];
      const productId = product.id;
      const brandId = product.brand_id;
      const productName = product.name;

      if (quantity === 0) {
        console.log(`⚠ Estoque zerado. Desativando produto ${productId}...`);

        const body = {
          simple: true,
          brand_id: brandId,
          active: false,
          name: productName,
        };

        const updateUrl = `https://api.dooki.com.br/v2/compra-z/catalog/products/${productId}`;
        const updateResp = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "User-Token": YAMPI_API_KEY,
            "User-Secret-Key": YAMPI_SECRET_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const contentType = updateResp.headers.get("content-type");
        const data =
          contentType && contentType.includes("application/json")
            ? await updateResp.json()
            : await updateResp.text();

        if (!updateResp.ok) {
          console.error(`❌ Erro ao desativar produto: HTTP ${updateResp.status}`, data);
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
