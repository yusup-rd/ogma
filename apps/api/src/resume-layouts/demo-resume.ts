import type { DraftContent } from "../../../../packages/contracts/resume-content";

const paragraph = (text: string) => ({
  type: "paragraph" as const,
  content: [{ type: "text" as const, text }],
});

export const sampleContent: DraftContent = {
  contact: {
    firstName: "John",
    lastName: "Doe",
    pronouns: "he/him",
    email: "john.doe@example.com",
    linkedin: "linkedin.com/in/john-doe",
    address: "Halifax, Nova Scotia",
    phone: "+1 902-555-0136",
    website: "john-doe.example",
    github: "github.com/john-doe",
  },
  targetTitle: "Software Engineer",
  summary:
    "Software engineer with seven years of experience building accessible web applications and reliable APIs. Partners with designers and product teams to simplify workflows and deliver software that is easy to maintain.",
  experience: [
    {
      id: "work-1",
      position: "Senior Software Engineer",
      employer: "Northstar Studio",
      projects: [
        {
          id: "work-project-1",
          name: "Open Design System",
          description: {
            type: "doc",
            content: [
              paragraph(
                "Built accessible components and documented interaction patterns.",
              ),
            ],
          },
        },
      ],
      location: "Halifax, Nova Scotia",
      employmentType: "Full-time",
      startDate: "2022-03",
      endDate: "",
      current: true,
      description: {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  paragraph(
                    "Redesigned account setup and reduced completion time by 24%.",
                  ),
                ],
              },
              {
                type: "listItem",
                content: [
                  paragraph(
                    "Led adoption of a shared component library across six product teams.",
                  ),
                ],
              },
              {
                type: "listItem",
                content: [
                  paragraph(
                    "Added accessibility checks and keyboard testing to release reviews.",
                  ),
                ],
              },
            ],
          },
        ],
      },
    },
    {
      id: "work-2",
      position: "Software Engineer",
      employer: "Fieldwork",
      projects: [
        {
          id: "work-project-2",
          name: "Operations Dashboard",
          description: {
            type: "doc",
            content: [
              paragraph(
                "Brought sales and inventory reports into a single dashboard.",
              ),
            ],
          },
        },
      ],
      location: "Remote",
      employmentType: "Full-time",
      startDate: "2019-06",
      endDate: "2022-02",
      current: false,
      description: {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  paragraph(
                    "Built operations dashboards backed by PostgreSQL and REST APIs.",
                  ),
                ],
              },
              {
                type: "listItem",
                content: [
                  paragraph(
                    "Reduced recurring reporting errors by validating data on import.",
                  ),
                ],
              },
            ],
          },
        ],
      },
    },
    {
      id: "work-3",
      position: "Junior Software Developer",
      employer: "Harbour Labs",
      location: "Halifax, Nova Scotia",
      employmentType: "Full-time",
      startDate: "2017-05",
      endDate: "2019-05",
      current: false,
      description: {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  paragraph(
                    "Built and tested customer-facing features for an online booking platform.",
                  ),
                ],
              },
              {
                type: "listItem",
                content: [
                  paragraph(
                    "Automated recurring QA checks and documented release procedures.",
                  ),
                ],
              },
            ],
          },
        ],
      },
    },
  ],
  education: [
    {
      id: "education-1",
      university: "Atlantic University",
      location: "Halifax, Nova Scotia",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      gpa: "3.8 / 4.0",
      startDate: "2015-09",
      endDate: "2019-05",
      description: {
        type: "doc",
        content: [
          paragraph("Completed a capstone on accessible data visualization."),
        ],
      },
    },
  ],
  skills: [
    {
      id: "skills-1",
      category: "Frontend",
      skills: [
        { id: "skill-1", name: "TypeScript", level: "" },
        { id: "skill-2", name: "React", level: "" },
        { id: "skill-3", name: "Web accessibility", level: "" },
      ],
    },
    {
      id: "skills-2",
      category: "Backend",
      skills: [
        { id: "skill-4", name: "Node.js", level: "" },
        { id: "skill-5", name: "PostgreSQL", level: "" },
      ],
    },
    {
      id: "skills-languages",
      category: "Languages",
      skills: [
        { id: "skill-language-1", name: "English", level: "Native" },
        { id: "skill-language-2", name: "French", level: "Advanced" },
      ],
    },
  ],
  certifications: [
    {
      id: "certification-1",
      name: "Cloud Practitioner",
      provider: "Atlantic Cloud Academy",
      startDate: "2024-05",
      endDate: "2027-05",
    },
  ],
  awards: [
    {
      id: "award-1",
      name: "Engineering Impact Award",
      organization: "Northstar Studio",
      date: "2024-11-14",
    },
    {
      id: "award-2",
      name: "Dean’s Scholarship",
      organization: "Atlantic University",
      date: "2018-09-01",
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "Community Event Finder",
      organization: "",
      startDate: "",
      endDate: "",
      description: {
        type: "doc",
        content: [
          paragraph("Built a searchable calendar for local community events."),
        ],
      },
    },
  ],
  volunteering: [
    {
      id: "volunteer-1",
      organization: "Code Halifax",
      involvement: "Volunteer mentor",
      city: "Halifax",
      state: "Nova Scotia",
      startDate: "2023-09",
      endDate: "",
      description: {
        type: "doc",
        content: [
          paragraph(
            "Mentored junior developers in JavaScript and web accessibility.",
          ),
        ],
      },
    },
  ],
  publications: [
    {
      id: "publication-1",
      name: "Designing an Accessible Data Table",
      publisher: "Northstar Engineering",
      date: "2024-06-12",
      description: {
        type: "doc",
        content: [
          paragraph(
            "Described keyboard navigation and screen reader testing for complex tables.",
          ),
        ],
      },
    },
  ],
};
