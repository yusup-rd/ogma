interface ResumeBlock {
  heading: string;
  detail?: string;
  paragraphs?: string[];
  highlights?: string[];
}

interface SampleResume {
  name: string;
  title: string;
  contact: string;
  pages: ResumeBlock[][];
}

export const sampleResume: SampleResume = {
  name: "John Doe",
  title: "Senior product designer",
  contact: "Halifax, Canada · john.doe@example.com · john-doe.example",
  pages: [
    [
      {
        heading: "Profile",
        paragraphs: [
          "Product designer with seven years of experience simplifying complex workflows and building accessible systems.",
        ],
      },
      {
        heading: "Experience",
        detail: "Senior Product Designer · Northstar Studio",
        paragraphs: ["2022 – Present · Halifax, Canada"],
        highlights: [
          "Redesigned onboarding and reduced setup time by 24%.",
          "Led a design system adopted by six product teams.",
          "Partnered with engineering and research to ship accessible workflows.",
        ],
      },
      {
        heading: "Skills",
        paragraphs: ["Design systems · Prototyping · Accessibility · Research"],
      },
    ],
    [
      {
        heading: "Projects",
        detail: "Open Design System",
        paragraphs: [
          "Built an accessible component library and wrote documentation for product teams.",
        ],
      },
      {
        heading: "Education",
        paragraphs: ["BDes, Interaction Design · Atlantic Arts University"],
      },
    ],
  ],
};
