const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const YAMPI_ALIAS = process.env.YAMPI_ALIAS;
const YAMPI_TOKEN = process.env.YAMPI_TOKEN;
const YAMPI_SECRET = process.env.YAMPI_SECRET;

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;
    const estoque = data.stock;
    const productId = data.product_id;

    console.log("Webhook recebido:", data);

    if (estoque === 0) {
      console.log(`Produto ${productId} sem estoque → Desativando...`);
      await axios.put(
        `https://api.yampi.com.br/v2/${YAMPI_ALIAS}/products/${productId}`,
        { active: false },
        {
          headers: {
            "User-Token": YAMPI_TOKEN,
            "User-Secret-Key": YAMPI_SECRET,
          },
        }
      );
    } else if (estoque === 1) {
      console.log(`Produto ${productId} voltou ao estoque → Ativando...`);
      await axios.put(
        `https://api.yampi.com.br/v2/${YAMPI_ALIAS}/products/${productId}`,
        { active: true },
        {
          headers: {
            "User-Token": YAMPI_TOKEN,
            "User-Secret-Key": YAMPI_SECRET,
          },
        }
      );
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Erro:", error.response?.data || error.message);
    res.status(500).send("Erro interno");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
