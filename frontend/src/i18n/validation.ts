import { t } from "./runtime";

export function validateControl(event: Event) {
  const input = event.target;
  if (!(
    input instanceof HTMLInputElement ||
    input instanceof HTMLTextAreaElement ||
    input instanceof HTMLSelectElement
  ))
    return;
  input.setCustomValidity("");
  const v = input.validity;
  if (v.valueMissing) input.setCustomValidity(t("validation.required"));
  else if (v.typeMismatch) input.setCustomValidity(t("validation.format"));
  else if (v.tooShort && "minLength" in input)
    input.setCustomValidity(
      t("validation.min_length", { count: input.minLength }),
    );
  else if (v.patternMismatch) input.setCustomValidity(t("validation.pattern"));
  else if (v.rangeOverflow || v.rangeUnderflow || v.badInput)
    input.setCustomValidity(t("validation.range"));
}
export function installValidation() {
  document.addEventListener("invalid", validateControl, true);
  const reset = (event: Event) => {
    const input = event.target;
    if (
      input instanceof HTMLInputElement ||
      input instanceof HTMLTextAreaElement ||
      input instanceof HTMLSelectElement
    )
      input.setCustomValidity("");
  };
  document.addEventListener("input", reset, true);
  document.addEventListener("change", reset, true);
  return () => {
    document.removeEventListener("invalid", validateControl, true);
    document.removeEventListener("input", reset, true);
    document.removeEventListener("change", reset, true);
  };
}
