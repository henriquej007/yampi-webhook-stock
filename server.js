import express from "express";

const app = express();
app.use(express.json());

const YAMPI_API_KEY = process.env.YAMPI_API_KEY; // User-Token
const YAMPI_SECRET_KEY = process.env.YAMPI_SECRET_KEY; // User-Secret-Key
const YAMPI_ALIAS = process.env.YAMPI_ALIAS; // exemplo: loja123

// Coloque aqui os valores obrigatórios fixos
const BRAND_ID = 1; // substitua pelo ID correto da marca
const SIMPLE = true; // ou false, dependendo do seu produto

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    // Ajuste conforme a estrutura real do webhook
    const productId = data.product?.id;
    const stock = data.product?.stock;
    const productName = data.product?.name;

    if (!productId || !productName) {
      return res.status(400).send("Dados insuficientes no webhook");
    }

    // Se o estoque for zero, desativar produto
    if (stock === 0) {
      const body = {
        simple: SIMPLE,
        brand_id: BRAND_ID,
        active: false,
        name: productName
      };

      const putResponse = await fetch(
        `https://api.dooki.com.br/v2/${YAMPI_ALIAS}/catalog/products/${productId}`,
        {
          method: "PUT",
          headers: {
            "User-Token": YAMPI_API_KEY,
            "User-Secret-Key": YAMPI_SECRET_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      const result = await putResponse.json();
      console.log("Resposta da Yampi:", result);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.status(500).send("Erro interno");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

