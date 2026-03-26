import { DRAFT_TYPES, createSample } from "./creatorModel.js";
import { initStudio } from "./studioPage.js";

initStudio(DRAFT_TYPES.VIDEO, () => createSample(DRAFT_TYPES.VIDEO));
