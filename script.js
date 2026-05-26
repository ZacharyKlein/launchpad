const grid = document.querySelector("#app-grid");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search");
const appCount = document.querySelector("#app-count");
const appCountLabel = document.querySelector("#app-count-label");
const template = document.querySelector("#app-card-template");

let apps = [];

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getSearchText(app) {
  const metadata = app.metadata ?? {};

  return [
    app.name,
    app.description,
    app.status,
    app.url,
    metadata.title,
    metadata.description,
    metadata.siteName,
    ...app.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesQuery(app, query) {
  return getSearchText(app).includes(query.toLowerCase().trim());
}

function setImage(image, url, alt = "") {
  image.hidden = !url;
  image.src = url || "";
  image.alt = alt;
}

function renderApps(query = "") {
  const visibleApps = apps.filter((app) => matchesQuery(app, query));

  grid.replaceChildren(
    ...visibleApps.map((app) => {
      const metadata = app.metadata ?? {};
      const card = template.content.firstElementChild.cloneNode(true);
      const media = card.querySelector(".app-media");
      const preview = card.querySelector(".app-preview");
      const icon = card.querySelector(".app-icon");
      const favicon = card.querySelector(".app-favicon");
      const initials = card.querySelector(".app-initials");
      const status = card.querySelector(".app-status");
      const source = card.querySelector(".app-source");
      const title = card.querySelector("h2");
      const description = card.querySelector(".app-card__body p:last-child");
      const tags = card.querySelector(".app-tags");
      const link = card.querySelector(".app-link");

      media.style.setProperty("--icon-bg", app.colors.background);
      media.style.setProperty("--icon-fg", app.colors.foreground);
      icon.style.setProperty("--icon-bg", app.colors.background);
      icon.style.setProperty("--icon-fg", app.colors.foreground);

      setImage(preview, metadata.image, metadata.imageAlt || "");
      setImage(favicon, metadata.favicon, "");
      initials.textContent = app.initials;
      status.textContent = app.status;
      source.textContent = metadata.siteName || getHostname(app.url);
      title.textContent = metadata.title || app.name;
      description.textContent = metadata.description || app.description;
      link.href = app.url;
      link.setAttribute("aria-label", `Open ${app.name}`);

      preview.addEventListener("error", () => {
        preview.hidden = true;
      });

      favicon.addEventListener("error", () => {
        favicon.hidden = true;
      });

      tags.replaceChildren(
        ...app.tags.map((tag) => {
          const tagElement = document.createElement("span");
          tagElement.textContent = tag;
          return tagElement;
        }),
      );

      return card;
    }),
  );

  appCount.textContent = apps.length;
  appCountLabel.textContent = apps.length === 1 ? "available app" : "available apps";
  emptyState.hidden = visibleApps.length > 0;
}

async function loadApps() {
  try {
    const response = await fetch("apps.json");

    if (!response.ok) {
      throw new Error(`Unable to load apps.json: ${response.status}`);
    }

    apps = await response.json();
    renderApps(searchInput.value);
  } catch (error) {
    emptyState.textContent = "Unable to load apps.";
    emptyState.hidden = false;
    console.error(error);
  }
}

searchInput.addEventListener("input", (event) => {
  renderApps(event.target.value);
});

loadApps();
