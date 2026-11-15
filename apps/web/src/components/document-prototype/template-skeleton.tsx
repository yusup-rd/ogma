import type { CSSProperties } from "react";
import type { TemplateOption } from "@/lib/document-prototype/resume-layout-model";
import styles from "./template-skeleton.module.css";

interface TemplateSkeletonProps {
  template: TemplateOption;
}

interface SkeletonSectionsProps {
  sections: string[];
}

const sectionBars: Record<string, readonly number[]> = {
  summary: [100, 76],
  experience: [100, 90, 68],
  awards: [90, 69],
  education: [94, 72],
  skills: [82, 54],
  certifications: [95, 62],
  projects: [100, 80, 56],
  volunteering: [91, 67],
  publications: [77, 54],
};

const SkeletonSections = ({ sections }: SkeletonSectionsProps) => {
  return (
    <span className={styles.sections}>
      {sections.map((section) => (
        <span key={section} className={styles.section} data-section={section}>
          <span className={styles.sectionTitle} />
          {(sectionBars[section] ?? sectionBars.summary).map((width) => (
            <span
              key={width}
              className={styles.bodyBar}
              style={{ width: `${width}%` }}
            />
          ))}
        </span>
      ))}
    </span>
  );
};

const TemplateSkeleton = ({ template }: TemplateSkeletonProps) => {
  const headerInColumn =
    template.rail === "left" || template.header === "badge";
  const hasColumns = template.side.length > 0;
  const paperStyle = {
    "--template-accent": template.accent,
    "--template-paper": template.paper,
    "--template-side": template.sideColor ?? template.accent,
    "--first-column": `${template.ratio}%`,
  } as CSSProperties;
  const header = (
    <span className={styles.header}>
      {(template.photo === "top" || template.photo === "right") && (
        <span className={styles.photo} />
      )}
      <span className={styles.identity}>
        <span className={styles.nameBar} />
        <span className={styles.roleBar} />
      </span>
    </span>
  );

  return (
    <span aria-hidden="true" className={styles.sheet} style={paperStyle}>
      <span
        className={styles.page}
        data-header={template.header}
        data-rail={template.rail}
        data-photo={template.photo}
        data-photo-shape={template.photoShape}
        data-heading={template.heading}
        data-columns={hasColumns}
        data-timeline={template.timeline}
        data-edge={template.id === "imprint"}
      >
        {!headerInColumn && header}
        <span className={styles.columns}>
          <span className={styles.main}>
            {headerInColumn && header}
            <SkeletonSections
              sections={template.main.slice(0, hasColumns ? 3 : 4)}
            />
          </span>
          {hasColumns && (
            <span className={styles.side}>
              {template.photo === "rail" && <span className={styles.photo} />}
              <SkeletonSections
                sections={
                  template.header === "badge"
                    ? ["contact", ...template.side.slice(0, 2)]
                    : template.side.slice(0, 3)
                }
              />
            </span>
          )}
        </span>
      </span>
    </span>
  );
};

export { TemplateSkeleton };
