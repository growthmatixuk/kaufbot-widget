const { buildProductContext } = require("../build-product-context");


module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }


  try {
    const { message, pageContext = {} } = req.body || {};


    if (typeof message !== "string") {
      return res.status(400).json({
        error: "Invalid input: message must be a string"
      });
    }


    const result = buildProductContext(message, pageContext);


    return res.status(200).json(result);
  } catch (err) {
    console.error("PRODUCT CONTEXT ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};