const loginPanel = document.querySelector("[data-login-panel]");
const editorPanel = document.querySelector("[data-editor-panel]");
const loginForm = document.querySelector("[data-login-form]");
const contentForm = document.querySelector("[data-content-form]");
const saveButton = document.querySelector("[data-save]");
const logoutButton = document.querySelector("[data-logout]");
const loginStatus = document.querySelector("[data-login-status]");
const editorStatus = document.querySelector("[data-editor-status]");

let content = null;

const labels = {
  site: "SEO",
  links: "Liens",
  images: "Images globales",
  nav: "Navigation",
  hero: "Hero",
  products: "Parfums",
  offer: "Pack",
  story: "Histoire",
  testimonials: "Avis",
  roadmap: "Chemin",
  contact: "Réservation",
  footer: "Footer",
  title: "Titre",
  description: "Description",
  instagram: "Instagram",
  vinted: "Vinted",
  hero: "Hero",
  story: "Histoire",
  logo: "Logo",
  logoMark: "Logo icône",
  left: "Menu gauche",
  right: "Menu droit",
  eyebrow: "Petite accroche",
  copyPrimary: "Texte principal",
  copySecondary: "Texte secondaire",
  line: "Ligne courte",
  body: "Texte",
  primaryCta: "CTA principal",
  secondaryCta: "CTA secondaire",
  name: "Nom",
  subtitle: "Sous-titre",
  price: "Prix",
  image: "Image",
  notes: "Notes",
  head: "Notes de tête",
  heart: "Notes de coeur",
  base: "Notes de fond",
  text: "Texte",
  paragraphs: "Paragraphes",
  caption: "Légende",
  quote: "Avis",
  author: "Auteur",
  kicker: "Petit titre",
  intro: "Introduction",
  steps: "Etapes",
  number: "Numéro",
  instagramCta: "CTA Instagram",
  vintedCta: "CTA Vinted",
  legal: "Mention légale",
  bottomLeft: "Bas gauche",
  bottomRight: "Bas droite"
};

function labelFor(key, fallback = "") {
  return labels[key] || fallback || key;
}

function setStatus(target, message, isError = false) {
  target.textContent = message;
  target.classList.toggle("is-error", isError);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "same-origin",
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Erreur");
  return payload;
}

function getPathValue(root, path) {
  return path.reduce((current, key) => current[key], root);
}

function setPathValue(root, path, value) {
  const last = path[path.length - 1];
  const parent = path.slice(0, -1).reduce((current, key) => current[key], root);
  parent[last] = value;
}

function inputTypeFor(path, value) {
  const key = String(path[path.length - 1]).toLowerCase();
  if (key.includes("image") || key.includes("logo")) return "image";
  if (typeof value === "string" && (value.length > 90 || key.includes("text") || key.includes("description") || key.includes("intro"))) {
    return "textarea";
  }
  return "input";
}

function pathToName(path) {
  return path.join(".");
}

function renderField(key, value, path) {
  if (Array.isArray(value)) return renderArray(key, value, path);
  if (value && typeof value === "object") return renderObject(key, value, path);

  const type = inputTypeFor(path, value);
  const label = document.createElement("label");
  label.textContent = labelFor(key);

  if (type === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.name = pathToName(path);
    textarea.value = value ?? "";
    textarea.addEventListener("input", () => setPathValue(content, path, textarea.value));
    label.append(textarea);
    return label;
  }

  if (type === "image") {
    const wrapper = document.createElement("div");
    wrapper.className = "image-field";

    const preview = document.createElement("img");
    preview.src = value || "";
    preview.alt = "";

    const controls = document.createElement("div");
    const textLabel = document.createElement("label");
    textLabel.textContent = labelFor(key);

    const input = document.createElement("input");
    input.name = pathToName(path);
    input.value = value ?? "";
    input.addEventListener("input", () => {
      setPathValue(content, path, input.value);
      preview.src = input.value;
    });

    const file = document.createElement("input");
    file.type = "file";
    file.accept = "image/*";
    file.addEventListener("change", async () => {
      if (!file.files || !file.files[0]) return;
      try {
        setStatus(editorStatus, "Conversion WebP en cours...");
        const dataUrl = await fileToWebp(file.files[0]);
        const result = await api("/api/upload", {
          method: "POST",
          body: JSON.stringify({ name: path[path.length - 2] || key, dataUrl })
        });
        input.value = result.path;
        setPathValue(content, path, result.path);
        preview.src = result.path;
        setStatus(editorStatus, "Image importée. Pense à sauvegarder.");
      } catch (error) {
        setStatus(editorStatus, error.message, true);
      }
    });

    textLabel.append(input);
    controls.append(textLabel, file);
    wrapper.append(preview, controls);
    return wrapper;
  }

  const input = document.createElement("input");
  input.name = pathToName(path);
  input.value = value ?? "";
  input.addEventListener("input", () => setPathValue(content, path, input.value));
  label.append(input);
  return label;
}

function renderObject(key, value, path) {
  const fieldset = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = labelFor(key);
  fieldset.append(legend);

  Object.entries(value).forEach(([childKey, childValue]) => {
    fieldset.append(renderField(childKey, childValue, [...path, childKey]));
  });
  return fieldset;
}

function renderArray(key, value, path) {
  const fieldset = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = labelFor(key);
  fieldset.append(legend);

  value.forEach((item, index) => {
    const itemKey = item && typeof item === "object" && item.name ? item.name : `${labelFor(key)} ${index + 1}`;
    fieldset.append(renderField(itemKey, item, [...path, index]));
  });
  return fieldset;
}

async function fileToWebp(file) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

  const max = 1800;
  const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Conversion impossible"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      },
      "image/webp",
      0.86
    );
  });
}

function renderEditor() {
  contentForm.innerHTML = "";
  Object.entries(content).forEach(([key, value]) => {
    contentForm.append(renderField(key, value, [key]));
  });
}

async function loadEditor() {
  content = await api("/api/content");
  renderEditor();
  loginPanel.hidden = true;
  editorPanel.hidden = false;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus(loginStatus, "Connexion...");
    const password = new FormData(loginForm).get("password");
    await api("/api/login", { method: "POST", body: JSON.stringify({ password }) });
    await loadEditor();
    setStatus(loginStatus, "");
  } catch (error) {
    setStatus(loginStatus, error.message, true);
  }
});

saveButton.addEventListener("click", async () => {
  try {
    setStatus(editorStatus, "Sauvegarde...");
    await api("/api/content", { method: "POST", body: JSON.stringify(content) });
    setStatus(editorStatus, "Changements enregistrés.");
  } catch (error) {
    setStatus(editorStatus, error.message, true);
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: "{}" }).catch(() => {});
  editorPanel.hidden = true;
  loginPanel.hidden = false;
});

(async () => {
  try {
    const session = await api("/api/session");
    if (session.authenticated) await loadEditor();
    if (!session.configured) {
      setStatus(loginStatus, "ADMIN_PASSWORD n'est pas encore défini dans le .env serveur.", true);
    }
  } catch (error) {
    setStatus(loginStatus, error.message, true);
  }
})();
