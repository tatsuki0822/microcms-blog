import { loadEnv } from "vite";

const fileEnv = loadEnv(process.env.NODE_ENV || "production", process.cwd(), "MICROCMS_");
const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN || fileEnv.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY || fileEnv.MICROCMS_API_KEY;

if (!serviceDomain || !apiKey) {
  throw new Error(
    "MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を .env に設定してください。",
  );
}

async function microcmsGet(path, queries = {}) {
  const url = new URL(`https://${serviceDomain}.microcms.io/api/v1/${path}`);

  for (const [key, value] of Object.entries(queries)) {
    if (value != null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      "X-MICROCMS-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`microCMS API error: ${response.status} ${path}`);
  }

  return response.json();
}

async function getAllContents(endpoint, queries = {}) {
  const limit = 100;
  const contents = [];
  let offset = 0;

  while (true) {
    const data = await microcmsGet(endpoint, { ...queries, limit, offset });
    contents.push(...data.contents);
    if (contents.length >= data.totalCount || data.contents.length === 0) {
      break;
    }
    offset += limit;
  }

  return contents;
}

let blogsPromise;
let categoriesPromise;

export function getBlogs() {
  blogsPromise ??= getAllContents("blogs");
  return blogsPromise;
}

export function getCategories() {
  categoriesPromise ??= getAllContents("categories", { fields: "id,name" });
  return categoriesPromise;
}

export function formatDate(value) {
  if (!value) return "";

  const parts = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}.${get("month")}.${get("day")}`;
}
