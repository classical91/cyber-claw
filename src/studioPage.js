import { getValueAtPath, setValueAtPath } from "./creatorModel.js";
import { loadDraft, saveDraft } from "./storage.js";

export function initStudio(type, sampleFactory) {
  let draft = loadDraft(type);
  const fields = [...document.querySelectorAll("[data-bind]")];

  function render() {
    document.querySelector("#hero-name").textContent = draft.meta.title || "Untitled";
    for (const field of fields) {
      field.value = getValueAtPath(draft, field.dataset.bind) ?? "";
    }
  }

  for (const field of fields) {
    field.addEventListener("input", () => {
      setValueAtPath(draft, field.dataset.bind, field.value);
      saveDraft(type, draft);
      render();
    });
  }

  document.querySelector("#save")?.addEventListener("click", () => saveDraft(type, draft));
  document.querySelector("#sample")?.addEventListener("click", () => {
    draft = sampleFactory();
    saveDraft(type, draft);
    render();
  });

  render();
}
