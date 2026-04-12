export function normalizeIndianPhoneInput(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  }

  return digits.slice(0, 10);
}

export function formatIndianPhone(value?: string | null) {
  if (!value) return "";

  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  }

  digits = digits.slice(-10);

  if (digits.length !== 10) {
    return value;
  }

  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function toIndianTelHref(value?: string | null) {
  if (!value) return "";

  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  }

  digits = digits.slice(-10);

  return digits.length === 10 ? `+91${digits}` : value;
}
