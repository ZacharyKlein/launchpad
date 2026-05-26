import { readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";

const appsPath = new URL("../apps.json", import.meta.url);
const apps = JSON.parse(await readFile(appsPath, "utf8"));

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function parseAttributes(tag) {
  const attributes = {};
  const attributePattern = /([^\s"'=<>`]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match;

  while ((match = attributePattern.exec(tag)) !== null) {
    const [, name, doubleQuoted, singleQuoted, unquoted] = match;
    attributes[name.toLowerCase()] = decodeHtml(doubleQuoted ?? singleQuoted ?? unquoted ?? "");
  }

  return attributes;
}

function resolveUrl(value, baseUrl) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function getTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeHtml(match?.[1] ?? "");
}

function collectMetadata(html, appUrl) {
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) =>
    parseAttributes(match[0]),
  );
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) =>
    parseAttributes(match[0]),
  );

  const meta = (name) => {
    const tag = metaTags.find(
      (candidate) =>
        candidate.property?.toLowerCase() === name ||
        candidate.name?.toLowerCase() === name,
    );

    return tag?.content ?? "";
  };

  const favicon =
    linkTags.find((tag) => tag.rel?.toLowerCase().split(/\s+/).includes("icon"))
      ?.href ?? "/favicon.ico";

  return {
    title: meta("og:title") || meta("twitter:title") || getTitle(html),
    description:
      meta("og:description") ||
      meta("twitter:description") ||
      meta("description"),
    siteName: meta("og:site_name"),
    image: resolveUrl(meta("og:image") || meta("twitter:image"), appUrl),
    imageAlt: meta("og:image:alt") || meta("twitter:image:alt"),
    favicon: resolveUrl(favicon, appUrl),
    themeColor: meta("theme-color"),
    fetchedAt: new Date().toISOString(),
  };
}

function fetchHtml(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "http:" ? http : https;

    const request = client.get(
      parsedUrl,
      {
        headers: {
          "user-agent": "Launchpad metadata refresh",
        },
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const location = response.headers.location;

        if (statusCode >= 300 && statusCode < 400 && location && redirectCount < 5) {
          response.resume();
          resolve(fetchHtml(new URL(location, parsedUrl).toString(), redirectCount + 1));
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(new Error(`${statusCode} ${response.statusMessage}`));
          return;
        }

        response.setEncoding("utf8");

        let html = "";
        response.on("data", (chunk) => {
          html += chunk;
        });
        response.on("end", () => resolve(html));
      },
    );

    request.on("error", reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error("Request timed out"));
    });
  });
}

async function refreshApp(app) {
  const html = await fetchHtml(app.url);
  const metadata = collectMetadata(html, app.url);

  return {
    ...app,
    metadata: {
      ...app.metadata,
      ...Object.fromEntries(
        Object.entries(metadata).filter(([, value]) => Boolean(value)),
      ),
    },
  };
}

const refreshedApps = [];

for (const app of apps) {
  try {
    const refreshedApp = await refreshApp(app);
    refreshedApps.push(refreshedApp);
    console.log(`Updated metadata for ${app.name}`);
  } catch (error) {
    refreshedApps.push(app);
    console.warn(`Kept existing metadata for ${app.name}: ${error.message}`);
  }
}

await writeFile(appsPath, `${JSON.stringify(refreshedApps, null, 2)}\n`);
