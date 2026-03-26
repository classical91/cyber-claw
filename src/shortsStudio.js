import { DRAFT_TYPES, createSample } from "./creatorModel.js";
import { initStudio } from "./studioPage.js";

initStudio(DRAFT_TYPES.SHORT, () => createSample(DRAFT_TYPES.SHORT));
