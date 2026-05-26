const apps = [
  {
    name: "Stoichiometrical",
    description:
      "A chemistry educational app for learning and practicing stoichiometry.",
    url: "https://stoichiometrical.onrender.com",
    status: "Live",
    initials: "St",
    tags: ["Chemistry", "Education", "Stoichiometry"],
    colors: {
      background: "#e4f5ed",
      foreground: "#0a5f49",
    },
  },
];

const grid = document.querySelector("#app-grid");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search");
const appCount = document.querySelector("#app-count");
const appCountLabel = document.querySelector("#app-count-label");
const template = document.querySelector("#app-card-template");

function matchesQuery(app, query) {
  const searchableText = [
    app.name,
    app.description,
    app.status,
    ...app.tags,
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query.toLowerCase().trim());
}

function renderApps(query = "") {
  const visibleApps = apps.filter((app) => matchesQuery(app, query));

  grid.replaceChildren(
    ...visibleApps.map((app) => {
      const card = template.content.firstElementChild.cloneNode(true);
      const icon = card.querySelector(".app-icon");
      const status = card.querySelector(".app-status");
      const title = card.querySelector("h2");
      const description = card.querySelector("p");
      const tags = card.querySelector(".app-tags");
      const link = card.querySelector(".app-link");

      icon.textContent = app.initials;
      icon.style.setProperty("--icon-bg", app.colors.background);
      icon.style.setProperty("--icon-fg", app.colors.foreground);
      status.textContent = app.status;
      title.textContent = app.name;
      description.textContent = app.description;
      link.href = app.url;
      link.setAttribute("aria-label", `Open ${app.name}`);

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

searchInput.addEventListener("input", (event) => {
  renderApps(event.target.value);
});

renderApps();
