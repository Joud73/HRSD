import { useState } from "react";

/**
 * Inline validation. A field shows its error only after it has been blurred once or the
 * form has been submitted; never on load. After that the message follows the value live.
 * `validate` reads current form state and returns a message per invalid field.
 */
export function useFieldValidation<K extends string>(validate: () => Partial<Record<K, string>>) {
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({});

  const all = validate();
  const errors: Partial<Record<K, string>> = {};
  (Object.keys(all) as K[]).forEach((field) => {
    if (submitted || touched[field]) errors[field] = all[field];
  });

  /** Call on submit: reveals every error and returns true when the form is valid */
  const check = () => {
    setSubmitted(true);
    return Object.values(validate()).every((v) => !v);
  };

  const blur = (field: K) => () => setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

  const reset = () => {
    setSubmitted(false);
    setTouched({});
  };

  return { errors, check, blur, reset };
}
