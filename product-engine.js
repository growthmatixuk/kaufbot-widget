const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "products-catalog.json");

const DEFAULT_LIMIT = 5;
const STANDARD_SIZE_ORDER = ["S", "M", "L", "XL", "XXL"];
const STANDARD_SIZE_INDEX = new Map(STANDARD_SIZE_ORDER.map((size, idx) => [size, idx]));

const SCORE_WEIGHTS = {
  titleExactToken: 40,
  titleContainsToken: 24,
  tagGenreCategoryContainsToken: 14,
  materialColourContainsToken: 12,
  descriptionContainsToken: 6,
  multiTokenBonusPerExtraToken: 5
};

function loadProducts() {
  const raw = fs.readFileSync(dataFile, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("products-catalog.json must contain an array");
  }
  return parsed;
}

const products = loadProducts();

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim().toLowerCase();
}

function includesNormalized(haystack, needle) {
  return normalizeText(haystack).includes(normalizeText(needle));
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function tokenizeQuery(query) {
  const normalized = normalizeText(query);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => token.length > 1 || /[a-z0-9]/i.test(token));
}

function variantMatchesSize(variant, preferences = {}) {
  const wantedLabel = normalizeText(preferences.sizeLabel);
  const wantedSizeText = normalizeText(preferences.sizeText);

  if (wantedLabel) {
    const variantLabel = normalizeText(variant.size_label);
    if (variantLabel !== wantedLabel) {
      return false;
    }
  }

  if (wantedSizeText) {
    const imperial = normalizeText(variant.size_imperial);
    const metric = normalizeText(variant.size_metric);
    if (!imperial.includes(wantedSizeText) && !metric.includes(wantedSizeText)) {
      return false;
    }
  }

  return true;
}

function chooseStandardVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }

  const ranked = variants
    .map((variant, index) => {
      const label = normalizeText(variant.size_label).toUpperCase();
      const rank = STANDARD_SIZE_INDEX.has(label) ? STANDARD_SIZE_INDEX.get(label) : Number.POSITIVE_INFINITY;
      return { variant, index, rank };
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return a.index - b.index;
    });

  return ranked[0].variant;
}

function scoreTokenAgainstProduct(product, token) {
  if (!token) {
    return 0;
  }

  let score = 0;
  const title = normalizeText(product.title);
  const description = normalizeText(product.description);
  const material = normalizeText(product.material);
  const colour = normalizeText(product.colour);
  const primaryCategory = normalizeText(product.primary_category);
  const categoryPath = toArray(product.category_path).map(normalizeText);
  const tags = toArray(product.tags).map(normalizeText);
  const genres = toArray(product.genres).map(normalizeText);
  const titleWords = title.split(/[^a-z0-9]+/).filter(Boolean);

  if (titleWords.includes(token)) {
    score += SCORE_WEIGHTS.titleExactToken;
  } else if (title.includes(token)) {
    score += SCORE_WEIGHTS.titleContainsToken;
  }

  if (tags.some((value) => value.includes(token))) {
    score += SCORE_WEIGHTS.tagGenreCategoryContainsToken;
  }
  if (genres.some((value) => value.includes(token))) {
    score += SCORE_WEIGHTS.tagGenreCategoryContainsToken;
  }
  if (primaryCategory.includes(token) || categoryPath.some((value) => value.includes(token))) {
    score += SCORE_WEIGHTS.tagGenreCategoryContainsToken;
  }
  if (material.includes(token) || colour.includes(token)) {
    score += SCORE_WEIGHTS.materialColourContainsToken;
  }
  if (description.includes(token)) {
    score += SCORE_WEIGHTS.descriptionContainsToken;
  }

  return score;
}

function scoreProduct(product, query) {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let matchedTokenCount = 0;

  for (const token of tokens) {
    const tokenScore = scoreTokenAgainstProduct(product, token);
    if (tokenScore > 0) {
      matchedTokenCount += 1;
      totalScore += tokenScore;
    }
  }

  if (matchedTokenCount > 1) {
    totalScore += (matchedTokenCount - 1) * SCORE_WEIGHTS.multiTokenBonusPerExtraToken;
  }

  return totalScore;
}

function matchesFilters(product, options = {}) {
  const category = normalizeText(options.category);
  const material = normalizeText(options.material);
  const colour = normalizeText(options.colour);
  const genre = normalizeText(options.genre);
  const tag = normalizeText(options.tag);

  const productMaterial = normalizeText(product.material);
  const productColour = normalizeText(product.colour);
  const primaryCategory = normalizeText(product.primary_category);
  const categoryPath = toArray(product.category_path).map(normalizeText);
  const genres = toArray(product.genres).map(normalizeText);
  const tags = toArray(product.tags).map(normalizeText);

  if (category) {
    const categoryMatch = primaryCategory.includes(category) || categoryPath.some((value) => value.includes(category));
    if (!categoryMatch) {
      return false;
    }
  }

  if (material && !productMaterial.includes(material)) {
    return false;
  }
  if (colour && !productColour.includes(colour)) {
    return false;
  }
  if (genre && !genres.some((value) => value.includes(genre))) {
    return false;
  }
  if (tag && !tags.some((value) => value.includes(tag))) {
    return false;
  }

  return true;
}

function findBestVariant(product, preferences = {}) {
  if (!product || !Array.isArray(product.variants) || product.variants.length === 0) {
    return null;
  }

  const variants = product.variants.filter((variant) => variant && typeof variant === "object");
  if (variants.length === 0) {
    return null;
  }

  const matchingBySize = variants.filter((variant) => variantMatchesSize(variant, preferences));
  const candidates = matchingBySize.length > 0 ? matchingBySize : variants;

  if (preferences.cheapest) {
    const withGbpPrice = candidates.filter((variant) => typeof variant.price_gbp === "number");
    if (withGbpPrice.length > 0) {
      return withGbpPrice.reduce((cheapest, current) =>
        current.price_gbp < cheapest.price_gbp ? current : cheapest
      );
    }
  }

  const standardChoice = chooseStandardVariant(candidates);
  return standardChoice || candidates[0];
}

function searchProducts(query, options = {}) {
  const tokens = tokenizeQuery(query);
  const limitValue = Number.parseInt(options.limit, 10);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? limitValue : DEFAULT_LIMIT;

  const results = [];
  for (const product of products) {
    if (!matchesFilters(product, options)) {
      continue;
    }

    const variants = toArray(product.variants);
    const hasSizeFilter = normalizeText(options.sizeLabel) || normalizeText(options.sizeText);
    if (hasSizeFilter && !variants.some((variant) => variantMatchesSize(variant, options))) {
      continue;
    }

    const queryMatched =
      tokens.length === 0 ||
      tokens.some((token) => scoreTokenAgainstProduct(product, token) > 0);

    if (!queryMatched) {
      continue;
    }

    const score = scoreProduct(product, query);
    results.push({ product, score });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return normalizeText(a.product.title).localeCompare(normalizeText(b.product.title));
  });

  return results.slice(0, limit).map((entry) => entry.product);
}

function findProductByCode(productCode) {
  const wanted = normalizeText(productCode);
  if (!wanted) {
    return null;
  }
  return products.find((product) => normalizeText(product.product_code) === wanted) || null;
}

function findProductByTitle(title) {
  const wanted = normalizeText(title);
  if (!wanted) {
    return null;
  }

  let bestMatch = null;
  let bestScore = -1;

  for (const product of products) {
    const productTitle = normalizeText(product.title);
    let score = 0;

    if (productTitle === wanted) {
      score = 1000;
    } else if (productTitle.includes(wanted)) {
      score = 600;
    } else if (wanted.includes(productTitle)) {
      score = 500;
    } else {
      const wantedWords = wanted.split(/\s+/).filter(Boolean);
      const titleWords = productTitle.split(/\s+/).filter(Boolean);
      const overlap = wantedWords.filter((word) => titleWords.includes(word)).length;
      score = overlap * 20;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

function formatProductSummary(product, variant = null) {
  if (!product || typeof product !== "object") {
    return null;
  }

  const chosenVariant = variant || findBestVariant(product);
  const imageUrl =
    (chosenVariant && normalizeText(chosenVariant.image_url) && chosenVariant.image_url) ||
    (toArray(product.images)[0] || null);

  return {
    product_code: product.product_code || "",
    title: product.title || "",
    material: product.material || "",
    primary_category: product.primary_category || "",
    colour: product.colour || "",
    tags: toArray(product.tags),
    genres: toArray(product.genres),
    image_url: imageUrl || null,
    variant: chosenVariant
      ? {
          sku: chosenVariant.sku || "",
          size_label: chosenVariant.size_label || "",
          size_imperial: chosenVariant.size_imperial || "",
          size_metric: chosenVariant.size_metric || "",
          price_gbp: chosenVariant.price_gbp ?? null,
          price_usd: chosenVariant.price_usd ?? null,
          price_eur: chosenVariant.price_eur ?? null
        }
      : null
  };
}

module.exports = {
  searchProducts,
  findProductByCode,
  findProductByTitle,
  findBestVariant,
  formatProductSummary,
  normalizeText,
  scoreProduct,
  matchesFilters,
  variantMatchesSize,
  chooseStandardVariant
};
