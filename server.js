import express from "express";
import fetch from "node-fetch";
import axios from "axios";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const YAMPI_API_KEY = process.env.YAMPI_API_KEY;
const YAMPI_SECRET_KEY = process.env.YAMPI_SECRET_KEY;

async function buscarProdutoPorSku(sku) {
  const resp = await axios.get(
    `https://api.dooki.com.br/v2/compra-z/catalog/products?q=${sku}&include=skus,brand`,
    {
      headers: {
        "User-Token": YAMPI_API_KEY,
        "User-Secret-Key": YAMPI_SECRET_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  return resp.data.data.find(
    (p) =>
      Array.isArray(p.skus?.data) &&
      p.skus.data.some((skuObj) => skuObj.sku === sku)
  );
}

async function atualizarStatusProduto(productId, brandId, productName, ativo) {
  const body = {
    simple: true,
    brand_id: brandId,
    active: ativo,
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
    console.error(
      `❌ Erro ao ${ativo ? "reativar" : "desativar"} produto: HTTP ${updateResp.status}`,
      data
    );
  } else {
    console.log(
      `✅ Produto ${productId} ${ativo ? "reativado" : "desativado"} com sucesso!`,
      data
    );
  }
}

app.post("/webhook", async (req, res) => {
  try {
    console.log("📡 Webhook recebido:", JSON.stringify(req.body, null, 2));

    const { event, resource } = req.body;
    if (event !== "product.inventory.updated") return;

    const sku = resource.spreadsheet?.data?.sku;
    const productName = resource.spreadsheet?.data?.product;
    if (!sku) {
      console.error("❌ SKU não encontrado no webhook, abortando.");
      return res.status(200).send("OK");
    }

    const quantity = resource.quantity;
    console.log(`📦 Estoque do SKU ${sku}: ${quantity}`);

    const produto = await buscarProdutoPorSku(sku);
    if (!produto) {
      console.error(`⚠️ Produto com SKU ${sku} não encontrado`);
      return res.status(200).send("OK");
    }

    const { id: productId, brand: { id: brandId }, active: isActive } = produto;

    if (quantity === 0) {
      console.log(`🔄 Estoque zerado. Desativando produto ${productId}...`);
      await atualizarStatusProduto(productId, brandId, productName, false);
    } else if (quantity >= 1 && !isActive) {
      console.log(`✅ Estoque 1 unidade ou mais. Reativando produto ${productId}...`);
      await atualizarStatusProduto(productId, brandId, productName, true);
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
