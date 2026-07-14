const modal = document.querySelector("#videoModal");
const modalVideo = modal?.querySelector("video");
const modalClose = modal?.querySelector(".modal-close");
const modalTitle = document.querySelector("#modalTitle");
const modalType = document.querySelector("#modalType");
const modalDescription = document.querySelector("#modalDescription");
const projectCards = document.querySelectorAll(".project-card");

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

document.querySelectorAll("[data-current-date]").forEach((element) => {
  element.textContent = dateFormatter.format(new Date()).toUpperCase();
});

if ("serviceWorker" in navigator && window.location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function closeModal() {
  if (!modal || !modalVideo) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-video-open");
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.removeAttribute("poster");
  modalVideo.load();
  if (modalTitle) modalTitle.textContent = "";
  if (modalType) modalType.textContent = "";
  if (modalDescription) modalDescription.textContent = "";
}

function openModal(media) {
  const sourceVideo = media.querySelector("video");
  const source = sourceVideo?.currentSrc || sourceVideo?.src;

  if (!modal || !modalVideo || !source) return;

  if (modalTitle) modalTitle.textContent = media.dataset.title || "";
  if (modalType) modalType.textContent = media.dataset.type || "";
  if (modalDescription) modalDescription.textContent = media.dataset.description || "";

  modalVideo.poster = sourceVideo?.poster || "";
  modalVideo.src = source;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-video-open");
  modalVideo.load();

  const play = () => modalVideo.play().catch(() => {});
  modalVideo.addEventListener("canplay", play, { once: true });
  play();
}

modalVideo?.addEventListener("error", () => {
  if (!modal?.classList.contains("is-open")) return;
  if (modalDescription) {
    modalDescription.textContent = "VIDEO IS TEMPORARILY UNAVAILABLE. PLEASE TRY AGAIN LATER.";
  }
});

function setExpanded(activeCard, shouldExpand) {
  projectCards.forEach((card) => {
    const isOpen = shouldExpand && card === activeCard;
    card.classList.toggle("is-open", isOpen);
    card.querySelector(".project-row")?.setAttribute("aria-expanded", String(isOpen));
  });
}

projectCards.forEach((card) => {
  const row = card.querySelector(".project-row");
  const media = card.querySelector(".project-media");

  row?.addEventListener("click", () => {
    setExpanded(card, !card.classList.contains("is-open"));
  });

  media?.addEventListener("click", () => openModal(media));

  media?.querySelector("img")?.addEventListener("error", () => {
    media.classList.add("is-media-unavailable");
  });
});

modalClose?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});
