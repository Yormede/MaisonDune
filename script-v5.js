const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const orderModal = document.querySelector("[data-order-modal]");
const orderOpenButtons = document.querySelectorAll("[data-order-open]");
const orderCloseButton = document.querySelector("[data-order-close]");
const productModal = document.querySelector("[data-product-modal]");
const productCloseButton = document.querySelector("[data-product-close]");
const productDetailButtons = document.querySelectorAll("[data-product-detail]");
let editableContent = null;

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value !== undefined) element.textContent = value;
};

const setHref = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    if (value) element.setAttribute("href", value);
  });
};

const setImage = (selector, src, alt) => {
  const element = document.querySelector(selector);
  if (!element) return;
  if (src) element.setAttribute("src", src);
  if (alt !== undefined) element.setAttribute("alt", alt);
};

const applyEditableContent = (content) => {
  if (!content || typeof content !== "object") return;
  editableContent = content;

  if (content.site?.title) document.title = content.site.title;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && content.site?.description) metaDescription.setAttribute("content", content.site.description);

  setHref('a[href*="instagram.com"]', content.links?.instagram);
  setHref('a[href*="vinted.fr"]', content.links?.vinted);

  const leftNav = document.querySelectorAll(".nav-group-left a");
  const rightNav = document.querySelectorAll(".nav-group-right a, .nav-group-right button");
  content.nav?.left?.forEach((label, index) => {
    if (leftNav[index]) leftNav[index].textContent = label;
  });
  content.nav?.right?.forEach((label, index) => {
    if (rightNav[index]) rightNav[index].textContent = label;
  });

  setImage("[data-hero-image]", content.images?.hero, "");
  setText(".hero .eyebrow", content.hero?.eyebrow);
  setText(".hero h1", content.hero?.title);
  setText(".hero-copy-primary", content.hero?.copyPrimary);
  setText(".hero-copy-secondary", content.hero?.copySecondary);
  setText(".hero-line", content.hero?.line);
  const heroBody = document.querySelector(".hero-copy:not(.hero-copy-primary):not(.hero-copy-secondary)");
  if (heroBody && content.hero?.body) heroBody.textContent = content.hero.body;
  setText(".hero-actions .button-primary", content.hero?.primaryCta);
  setText(".hero-actions .button-ghost", content.hero?.secondaryCta);

  document.querySelectorAll(".perfume-item").forEach((card, index) => {
    const product = content.products?.[index];
    if (!product) return;
    const img = card.querySelector("img");
    if (img && product.image) {
      img.src = product.image;
      img.alt = `Flacon ${product.name || ""} Maison Dune`;
    }
    const title = card.querySelector("h2");
    const subtitle = card.querySelector(".perfume-info > p:first-of-type");
    const price = card.querySelector(".perfume-price");
    const description = card.querySelector(".perfume-text");
    if (title) title.textContent = product.name || "";
    if (subtitle) subtitle.textContent = product.subtitle || "";
    if (price) price.textContent = product.price || "";
    if (description) description.textContent = product.description || "";

    const detailButton = card.querySelector("[data-product-detail]");
    if (detailButton) detailButton.dataset.productDetail = product.id || String(index);
  });

  setText(".triple-offer span", content.offer?.title);
  setText(".triple-offer p", content.offer?.text);
  setText(".triple-offer .button", content.offer?.cta);

  setText(".story-title", content.story?.title);
  const storyParagraphs = document.querySelectorAll(".story-copy p");
  content.story?.paragraphs?.forEach((paragraph, index) => {
    if (storyParagraphs[index]) storyParagraphs[index].textContent = paragraph;
  });
  setImage(".image-panel img", content.images?.story, "Photographie Maison Dune");
  setText(".image-panel figcaption", content.story?.caption);

  document.querySelectorAll(".testimonial-grid blockquote").forEach((item, index) => {
    const testimonial = content.testimonials?.[index];
    if (!testimonial) return;
    setText(`.testimonial-grid blockquote:nth-child(${index + 1}) p`, `“${testimonial.quote}”`);
    setText(`.testimonial-grid blockquote:nth-child(${index + 1}) cite`, testimonial.author);
  });

  setText(".poetic-roadmap .eyebrow", content.roadmap?.kicker);
  setText(".roadmap-title", content.roadmap?.title);
  const roadmapIntro = document.querySelector(".poetic-roadmap .section-heading p:not(.eyebrow)");
  if (roadmapIntro && content.roadmap?.intro) roadmapIntro.textContent = content.roadmap.intro;
  document.querySelectorAll(".journey-step").forEach((step, index) => {
    const data = content.roadmap?.steps?.[index];
    if (!data) return;
    const number = step.querySelector(".journey-number");
    const title = step.querySelector("h3");
    const text = step.querySelector("p");
    if (number) number.textContent = data.number || "";
    if (title) title.textContent = data.title || "";
    if (text) text.textContent = data.text || "";
  });

  setText(".contact-panel .eyebrow", content.contact?.kicker);
  setText(".contact-panel h2", content.contact?.title);
  setText(".contact-panel > p:not(.eyebrow):not(.legal-note)", content.contact?.text);
  setText(".contact-actions .button-primary span", content.contact?.instagramCta);
  setText(".contact-actions .button-ghost span", content.contact?.vintedCta);
  setText(".legal-note", content.contact?.legal);

  setImage(".footer-brand img", content.images?.logo, "");
  setText(".footer-copy .eyebrow", content.footer?.kicker);
  setText(".footer-copy h2", content.footer?.title);
  setText(".footer-copy p:not(.eyebrow)", content.footer?.text);
  const footerBottom = document.querySelectorAll(".footer-bottom span");
  if (footerBottom[0] && content.footer?.bottomLeft) footerBottom[0].textContent = content.footer.bottomLeft;
  if (footerBottom[1] && content.footer?.bottomRight) footerBottom[1].textContent = content.footer.bottomRight;
};

fetch("/api/content", { credentials: "same-origin" })
  .then((response) => (response.ok ? response.json() : null))
  .then(applyEditableContent)
  .catch(() => {});

const closeNav = () => {
  nav.classList.remove("is-open");
  header.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
};

const openOrderModal = () => {
  closeNav();
  orderModal.hidden = false;
  document.body.classList.add("modal-open");
  orderCloseButton.focus();
};

const closeOrderModal = () => {
  orderModal.hidden = true;
  document.body.classList.remove("modal-open");
};

const productById = (id) => {
  const products = editableContent?.products || [];
  return products.find((product) => product.id === id) || products[Number(id)] || null;
};

const openProductModal = (productId) => {
  const product = productById(productId);
  if (!product || !productModal) return;

  setImage("[data-product-image]", product.image, `Flacon ${product.name || ""} Maison Dune`);
  setText("[data-product-title]", product.name);
  setText("[data-product-subtitle]", product.subtitle);
  setText("[data-product-head]", product.notes?.head || "Bientôt révélé");
  setText("[data-product-heart]", product.notes?.heart || "Bientôt révélé");
  setText("[data-product-base]", product.notes?.base || "Bientôt révélé");

  closeNav();
  closeOrderModal();
  productModal.hidden = false;
  document.body.classList.add("modal-open");
  productCloseButton.focus();
};

const closeProductModal = () => {
  if (!productModal) return;
  productModal.hidden = true;
  document.body.classList.remove("modal-open");
};

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  header.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeNav);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    closeNav();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", hash);
  });
});

document.addEventListener("click", (event) => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  const clickedInsideHeader = header.contains(event.target);
  const clickedInsideNav = nav.contains(event.target);

  if (isOpen && !clickedInsideHeader && !clickedInsideNav) {
    closeNav();
  }
});

orderOpenButtons.forEach((button) => {
  button.addEventListener("click", openOrderModal);
});

orderCloseButton.addEventListener("click", closeOrderModal);

orderModal.addEventListener("click", (event) => {
  if (event.target === orderModal) {
    closeOrderModal();
  }
});

productDetailButtons.forEach((button) => {
  button.addEventListener("click", () => openProductModal(button.dataset.productDetail));
});

productCloseButton.addEventListener("click", closeProductModal);

productModal.addEventListener("click", (event) => {
  if (event.target === productModal) {
    closeProductModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
    closeOrderModal();
    closeProductModal();
  }
});
