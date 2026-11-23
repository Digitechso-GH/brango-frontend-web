export const LICENSE_CATEGORY_OPTIONS = [
  { value: "A_I", label: "A-I" },
  { value: "A_IIa", label: "A-IIa" },
  { value: "A_IIb", label: "A-IIb" },
  { value: "A_IIIa", label: "A-IIIa" },
  { value: "A_IIIb", label: "A-IIIb" },
  { value: "A_IIIc", label: "A-IIIc" },
] as const;

export const LICENSE_CATEGORY_LABELS: Record<string, string> = {
  A_I: "A-I",
  A_IIa: "A-IIa",
  A_IIb: "A-IIb",
  A_IIIa: "A-IIIa",
  A_IIIb: "A-IIIb",
  A_IIIc: "A-IIIc",
};
