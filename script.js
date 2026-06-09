const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const detailButtons = document.querySelectorAll("[data-collapse]");

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
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    header.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

detailButtons.forEach((button) => {
  const target = document.getElementById(button.dataset.collapse);
  const productCard = button.closest(".product-card");
  const productBody = button.closest(".product-body");

  button.addEventListener("click", () => {
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    const nextExpanded = !isExpanded;

    button.setAttribute("aria-expanded", String(nextExpanded));
    target.hidden = !nextExpanded;
    productCard.classList.toggle("is-expanded", nextExpanded);

    if (nextExpanded) {
      requestAnimationFrame(() => {
        productCard.scrollIntoView({ behavior: "smooth", block: "center" });
        const detailsTop = target.offsetTop - productBody.offsetTop - 8;
        productBody.scrollTo({ top: Math.max(detailsTop, 0), behavior: "smooth" });
      });
    } else {
      productBody.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});
