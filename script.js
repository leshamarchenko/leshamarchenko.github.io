const modal = document.querySelector("#videoModal");
const modalVideo = modal?.querySelector("video");
const modalClose = modal?.querySelector(".modal-close");
const modalTitle = document.querySelector("#modalTitle");
const modalType = document.querySelector("#modalType");
const modalDescription = document.querySelector("#modalDescription");
const modalStatus = document.querySelector("#modalStatus");
const projectCards = document.querySelectorAll(".project-card");

let previouslyFocusedElement = null;
let loadingMessageTimer = null;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

document.querySelectorAll("[data-current-date]").forEach((element) => {
  const now = new Date();
  element.textContent = dateFormatter.format(now).toUpperCase();
  element.dateTime = now.toISOString().slice(0, 10);
});

if ("serviceWorker" in navigator && window.location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
  });
}

function setModalStatus(message = "") {
  if (!modalStatus) return;
  modalStatus.textContent = message;
  modalStatus.hidden = !message;
}

function clearLoadingMessage() {
  window.clearTimeout(loadingMessageTimer);
  loadingMessageTimer = null;
  if (modalStatus?.textContent === "LOADING VIDEO...") setModalStatus();
}

function scheduleLoadingMessage() {
  window.clearTimeout(loadingMessageTimer);
  loadingMessageTimer = window.setTimeout(() => {
    if (modal?.classList.contains("is-open")) setModalStatus("LOADING VIDEO...");
  }, 700);
}

function closeModal() {
  if (!modal || !modalVideo || !modal.classList.contains("is-open")) return;

  clearLoadingMessage();
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("inert", "");
  document.body.classList.remove("is-video-open");

  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.removeAttribute("poster");
  modalVideo.load();

  if (modalTitle) modalTitle.textContent = "";
  if (modalType) modalType.textContent = "";
  if (modalDescription) modalDescription.textContent = "";
  setModalStatus();

  previouslyFocusedElement?.focus({ preventScroll: true });
  previouslyFocusedElement = null;
}

function openModal(media) {
  const source = media.dataset.video;
  const posterImage = media.querySelector("img");
  const poster = posterImage?.currentSrc || posterImage?.src || "";

  if (!modal || !modalVideo || !source) return;

  previouslyFocusedElement = document.activeElement;
  if (modalTitle) modalTitle.textContent = media.dataset.title || "";
  if (modalType) modalType.textContent = media.dataset.type || "";
  if (modalDescription) modalDescription.textContent = media.dataset.description || "";
  setModalStatus();

  modalVideo.poster = poster;
  modalVideo.src = source;
  modal.removeAttribute("inert");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-video-open");
  modalVideo.load();
  scheduleLoadingMessage();

  const playPromise = modalVideo.play();
  playPromise?.catch(() => {
    clearLoadingMessage();
    setModalStatus("PRESS PLAY TO START THE VIDEO.");
  });

  window.requestAnimationFrame(() => modalClose?.focus({ preventScroll: true }));
}

modalVideo?.addEventListener("loadstart", scheduleLoadingMessage);
modalVideo?.addEventListener("waiting", scheduleLoadingMessage);
modalVideo?.addEventListener("canplay", clearLoadingMessage);
modalVideo?.addEventListener("playing", clearLoadingMessage);
modalVideo?.addEventListener("error", () => {
  if (!modal?.classList.contains("is-open")) return;
  clearLoadingMessage();
  setModalStatus("VIDEO IS TEMPORARILY UNAVAILABLE. PLEASE TRY AGAIN LATER.");
});

function hydrateMedia(card) {
  const source = card.querySelector("source[data-srcset]");
  const image = card.querySelector("img[data-src]");

  if (source?.dataset.srcset) {
    source.srcset = source.dataset.srcset;
    source.removeAttribute("data-srcset");
  }

  if (image?.dataset.src) {
    image.src = image.dataset.src;
    image.removeAttribute("data-src");
  }
}

function setExpanded(activeCard, shouldExpand) {
  projectCards.forEach((card) => {
    const isOpen = shouldExpand && card === activeCard;
    const row = card.querySelector(".project-row");
    const panel = card.querySelector(".project-panel");

    if (isOpen) hydrateMedia(card);
    card.classList.toggle("is-open", isOpen);
    row?.setAttribute("aria-expanded", String(isOpen));
    panel?.setAttribute("aria-hidden", String(!isOpen));
  });
}

projectCards.forEach((card) => {
  const row = card.querySelector(".project-row");
  const media = card.querySelector(".project-media");
  const panel = card.querySelector(".project-panel");

  if (card.classList.contains("is-open")) hydrateMedia(card);
  panel?.setAttribute("aria-hidden", String(!card.classList.contains("is-open")));

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
  if (!modal?.classList.contains("is-open")) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeModal();
    return;
  }

  if (event.key !== "Tab") return;

  const focusableElements = [...modal.querySelectorAll("button, video, [href], [tabindex]:not([tabindex='-1'])")].filter(
    (element) => !element.hasAttribute("disabled"),
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement?.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement?.focus();
  }
});

window.addEventListener("pagehide", () => {
  if (modal?.classList.contains("is-open")) closeModal();
});
