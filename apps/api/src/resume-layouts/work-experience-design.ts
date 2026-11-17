import type {
  WorkExperienceDefaults,
  WorkMetadataPosition,
} from "../../../../packages/contracts/resume-content";

const firstRight = { placement: "first", alignment: "right" } as const;
const secondRight = { placement: "second", alignment: "right" } as const;
const secondLeft = { placement: "second", alignment: "left" } as const;
const belowLeft = { placement: "below", alignment: "left" } as const;
const railLeft = { placement: "rail", alignment: "left" } as const;

function experience(
  date: WorkMetadataPosition,
  location: WorkMetadataPosition,
  options: Partial<Omit<WorkExperienceDefaults, "date" | "location">> = {},
): WorkExperienceDefaults {
  return {
    dateFormat: "numeric",
    dateSeparator: "hyphen",
    order: "position-first",
    date,
    location,
    employmentType: location,
    icons: false,
    employerSeparator: "space",
    ...options,
  };
}

// These settings describe the experience headings in the Enhancv gallery.
const stacked = experience(belowLeft, belowLeft, { icons: true });
const split = experience(firstRight, secondRight);
const employerFirst = experience(secondRight, firstRight, {
  order: "employer-first",
});
const timeline = experience(railLeft, railLeft);
const rightByEmployer = experience(secondRight, secondRight, { icons: true });
const crest = experience(firstRight, secondLeft, {
  employerSeparator: "dash",
  dateFormat: "year",
  dateSeparator: "dash",
});

export const experienceDesigns: Partial<
  Record<string, WorkExperienceDefaults>
> = {
  "double-column": stacked,
  "ivy-league": employerFirst,
  elegant: split,
  crest,
  "single-column": stacked,
  polished: split,
  imprint: experience(firstRight, secondLeft, {
    employerSeparator: "dash",
    dateSeparator: "dash",
  }),
  timeline,
  creative: stacked,
  stylish: rightByEmployer,
  modern: rightByEmployer,
  contemporary: employerFirst,
  "ivy-league-photo": employerFirst,
  "ivy-league-logos": employerFirst,
  "single-column-photo": { ...stacked, dateFormat: "year" },
  "elegant-logos": split,
  "double-column-logos": { ...stacked, dateFormat: "year" },
  compact: experience(secondLeft, secondLeft),
  "timeline-logos": timeline,
  classic: experience(secondRight, firstRight),
  "high-performer": rightByEmployer,
  minimal: experience(secondLeft, secondLeft, { dateFormat: "year" }),
  "crest-projects": { ...crest, dateFormat: "numeric" },
};
