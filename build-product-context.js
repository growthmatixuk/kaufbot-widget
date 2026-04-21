const { searchProducts, formatProductSummary, normalizeText, findBestVariant } = require("./product-engine");

const PRODUCT_SIGNALS = [
  "backdrop",
  "backdrops",
  "background",
  "backgrounds",
  "size",
  "sizes",
  "vinyl",
  "profabric",
  "foldable",
  "newborn",
  "portrait",
  "portraits",
  "headshot",
  "headshots",
  "floral",
  "exterior",
  "interior",
  "fine art",
  "floor",
  "floors",
  "holiday",
  "seamless",
  "product photography",
  "cake smash",
  "price",
  "cost",
  "how much",
  "cheapest",
  "recommend",
  "suggestion",
  "looking for",
  "show me",
  "do you have"
];

const PRICE_INTENT_TERMS = new Set([
  "cheapest",
  "cheap",
  "price",
  "prices",
  "cost",
  "costs",
  "pricing"
]);

const FILTER_HINTS = {
  material: {
    vinyl: "Vinyl",
    profabric: "ProFabric"
  },
  genre: {
    newborn: "newborn",
    portrait: "portrait",
    headshot: "headshot",
    fashion: "fashion",
    seniors: "seniors",
    product: "product"
  },
  category: {
    exterior: "Exterior",
    interior: "Interior",
    floral: "Floral",
    holiday: "Holiday",
    floors: "Floors",
    floor: "Floors",
    seamless: "Seamless"
  }
};

function joinContextText(userMessage, pageContext = {}) {
  const parts = [userMessage];

  if (pageContext && typeof pageContext === "object") {
    for (const key of ["title", "path", "h1", "url"]) {
      if (pageContext[key]) {
        parts.push(String(pageContext[key]));
      }
    }
  }

  return normalizeText(parts.join(" "));
}

function containsSignal(text, signal) {
  return text.includes(normalizeText(signal));
}

function isLikelyProductQuery(userMessage, pageContext = {}) {
  const combinedText = joinContextText(userMessage, pageContext);
  if (!combinedText) {
    return false;
  }

  return PRODUCT_SIGNALS.some((signal) => containsSignal(combinedText, signal));
}

function inferFilters(userMessage, pageContext = {}) {
  const combinedText = joinContextText(userMessage, pageContext);
  const filters = {};

  for (const [filterKey, mapping] of Object.entries(FILTER_HINTS)) {
    for (const [keyword, mappedValue] of Object.entries(mapping)) {
      if (containsSignal(combinedText, keyword)) {
        filters[filterKey] = mappedValue;
        break;
      }
    }
  }

  return filters;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function hasPriceIntent(userMessage, pageContext = {}) {
  const combinedText = joinContextText(userMessage, pageContext);
  if (!combinedText) {
    return false;
  }

  return [...PRICE_INTENT_TERMS].some((term) => combinedText.includes(term));
}

function buildProductMatchQuery(userMessage, pageContext = {}) {
  const combinedText = joinContextText(userMessage, pageContext);
  if (!combinedText) {
    return "";
  }

  const tokens = combinedText.split(/\s+/).filter(Boolean);
  const withoutPriceTerms = tokens.filter((token) => !PRICE_INTENT_TERMS.has(token));
  return withoutPriceTerms.join(" ").trim();
}

function buildSummary(results) {
  const titles = uniqueStrings(results.map((item) => item.title));
  const categories = uniqueStrings(results.map((item) => item.primary_category));
  const materials = uniqueStrings(results.map((item) => item.material));

  return {
    isProductQuery: true,
    resultCount: results.length,
    topTitles: titles,
    categories,
    materials
  };
}

function buildProductContext(userMessage, pageContext = {}) {
  if (!isLikelyProductQuery(userMessage, pageContext)) {
    return {
      isProductQuery: false,
      results: [],
      summary: null
    };
  }

  const filters = inferFilters(userMessage, pageContext);
  const priceIntent = hasPriceIntent(userMessage, pageContext);
  const productMatchQuery = buildProductMatchQuery(userMessage, pageContext);
  const searchQuery = productMatchQuery || userMessage;
  const matchedProducts = searchProducts(searchQuery, { ...filters, limit: 3 });
  const results = matchedProducts.map((product) => {
    const variant = priceIntent ? findBestVariant(product, { cheapest: true }) : null;
    return formatProductSummary(product, variant);
  });
  const summary = buildSummary(results);

  return {
    isProductQuery: true,
    results,
    summary
  };
}

module.exports = {
  buildProductContext
};
