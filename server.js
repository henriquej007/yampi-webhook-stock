import express from "express";
import fetch from "node-fetch";
import axios from 'axios';

const axios = require('axios');

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
      const sku = resource.spreadsheet?.data?.sku;

      // Verifica se foi encontrado o sku com o webhook que chegou
      if (!sku) {
        console.error("❌ SKU não encontrado no webhook, abortando.");
        return;
      }

      const quantity = resource.quantity;

      console.log(`➡ Estoque do SKU ${sku}: ${quantity}`);

      
      // Buscar produtos ativos, sem estoque, incluindo skus e brand
      const productsResponse = await axios.get(
        `compra-z/products?active=1&quality=with_no_stock&include=skus,brand`,
        {
          headers: {
            Authorization: `Bearer ${process.env.YAMPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );


      const productData = productsResponse.data.data.find(p =>
       p.skus.some(skuObj => skuObj.sku === skuFromWebhook)
      );
      
      if (!productData) {
        console.error(`Produto com SKU ${skuFromWebhook} não encontrado`);
        return;
      }
      
      const productId = productData.id;
      const brandId = productData.brand.id;
      

      if (quantity === 0) {
        
        // Verificar se o sku bate com o recebido pela webhook
        /*if (product.sku !== sku) {
          console.error(`❌ SKU retornado (${product.sku}) não bate com o SKU do webhook (${sku}), abortando.`);
          return;
        }*/

        
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











