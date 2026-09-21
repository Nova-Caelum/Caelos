import { defineSlotRecipe } from "@pandacss/dev";
import { fileCard } from "./file-card-recipe";

/** Shared failure material, extracted unchanged from the approved attachment card. */
export const errorMessage = defineSlotRecipe({
  className: "error-message",
  slots: ["root", "open", "symbol", "label", "name", "detail"],
  base: fileCard.base,
});
