import type { ManualListItem, ManualUploadResponse, ProductInfo } from "../types/api";
import { getDisplayManualName } from "./manualDisplay";

type ManualVideoSearchInput = {
  fileName?: string;
  estimatedProduct?: ProductInfo | null;
};

const UNKNOWN_VALUES = new Set(["", "-", "unknown", "n/a", "none", "null", "undefined", "미확인"]);

function isKnownValue(value: string | null | undefined) {
  return !UNKNOWN_VALUES.has((value ?? "").trim().toLowerCase());
}

function cleanText(value: string) {
  return value
    .replace(/\.[a-z0-9]+$/i, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\b(owner'?s?|user|pilots?|quick|manual|guide|english|korean|pdf)\b/gi, " ")
    .replace(/\b(v?\d+(?:\.\d+){1,3})\b/gi, " ")
    .replace(/\b[A-Z]{1,4}\d{2,}[A-Z0-9-]*\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldUseModelName(modelName: string) {
  const value = modelName.trim();
  if (!isKnownValue(value)) return false;
  if (value.length < 4) return false;
  if (/^[a-z]\d{1,3}$/i.test(value)) return false;
  return true;
}

function uniqueParts(parts: string[]) {
  const seen = new Set<string>();
  return parts.filter((part) => {
    const key = part.toLowerCase();
    if (!part || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildVideoSearchQuery(input: ManualVideoSearchInput) {
  const product = input.estimatedProduct;
  const fileName = cleanText(getDisplayManualName(input.fileName ?? ""));
  const manufacturer = isKnownValue(product?.manufacturer) ? cleanText(product?.manufacturer ?? "") : "";
  const productName = isKnownValue(product?.product_name) ? cleanText(product?.product_name ?? "") : "";
  const modelName = shouldUseModelName(product?.model_name ?? "") ? cleanText(product?.model_name ?? "") : "";

  const parts = uniqueParts([manufacturer, productName, modelName, fileName]);
  const baseQuery = parts.join(" ").replace(/\s+/g, " ").trim();

  return baseQuery ? `${baseQuery} manual tutorial` : "";
}

export function buildVideoSearchQueryFromUpload(result: ManualUploadResponse) {
  return buildVideoSearchQuery({
    fileName: result.file_name,
    estimatedProduct: result.estimated_product
  });
}

export function buildVideoSearchQueryFromManual(manual: ManualListItem | undefined) {
  return buildVideoSearchQuery({
    fileName: manual?.file_name,
    estimatedProduct: manual?.estimated_product
  });
}
