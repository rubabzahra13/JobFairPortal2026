export const ACADEMIC_BATCH_OPTIONS = ["22", "23", "24"] as const;

export const DEGREE_GROUPS = [
  {
    label: "Undergraduate Programs (Bachelor's)",
    options: [
      "Bachelor of Business Administration (BBA)",
      "Bachelor of Science in Accounting and Finance",
      "Bachelor of Science in Artificial Intelligence",
      "Bachelor of Science in Business Analytics",
      "Bachelor of Science in Computer Engineering",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Cyber Security",
      "Bachelor of Science in Data Science",
      "Bachelor of Science in Electrical Engineering",
      "Bachelor of Science in Financial Technology (FinTech)",
      "Bachelor of Science in Software Engineering",
    ],
  },
  {
    label: "Graduate Programs (Master's)",
    options: [
      "Master of Business Administration (MBA)",
      "Master of Science in Artificial Intelligence",
      "Master of Science in Business Analytics",
      "Master of Science in Computer Science",
      "Master of Science in Cyber Security",
      "Master of Science in Data Science",
      "Master of Science in Electrical Engineering",
      "Master of Science in Mathematics",
      "Master of Science in Software Engineering",
      "Master of Science in Software Project Management",
    ],
  },
  {
    label: "Postgraduate Programs (PhD)",
    options: [
      "Doctor of Philosophy in Computer Science",
      "Doctor of Philosophy in Electrical Engineering",
      "Doctor of Philosophy in Management Sciences",
      "Doctor of Philosophy in Mathematics",
      "Doctor of Philosophy in Software Engineering",
    ],
  },
] as const;

export const DEGREE_OPTIONS = DEGREE_GROUPS.flatMap((group) => group.options);

export function isKnownDegree(value: string): boolean {
  return DEGREE_OPTIONS.some((degree) => degree === value);
}

export function isKnownAcademicBatch(value: string): boolean {
  return ACADEMIC_BATCH_OPTIONS.some((batch) => batch === value);
}
