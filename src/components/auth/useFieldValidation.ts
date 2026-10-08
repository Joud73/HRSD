import { useState } from "react";

/**
 * Inline validation: errors appear on submit, then refresh on blur.
 * `validate` reads current form state and returns a message per invalid field.
 */
export function useFieldValidation<K extends string>(validate: () => Partial<Record<K, string>>) {
  const [attempted, setAttempted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});

  const check = () => {
    const next = validate();
    setErrors(next);
    setAttempted(true);
    return Object.values(next).every((v) => !v);
  };

  const blur = (field: K) => () => {
    if (!attempted) return;
    const next = validate();
    setErrors((prev) => ({ ...prev, [field]: next[field] }));
  };

  const reset = () => {
    setAttempted(false);
    setErrors({});
  };

  return { errors, check, blur, reset };
}
