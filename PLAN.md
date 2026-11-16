# Ogma product plan

Ogma is a private, single-owner resume builder. The name comes from Ogma, a figure in Irish mythology associated with skilled speech and poetry. The proposed hostname is `ogma.yusuprd.com`. [University of Glasgow Ogham project](https://ogham.glasgow.ac.uk/index.php/2025/03/05/ogam-ogma-and-ogmios/)

## Core workflow

1. Start with a blank CV, an existing PDF or DOCX, or a duplicate of a saved CV.
2. Build a master library of personal details, experience, education, projects, skills, certifications, languages, links, and reusable bullets. Review imported content before adding it to the library or creating a CV.
3. Build a CV by ticking the sections, entries, and bullets to include. Rename and reorder sections, add custom sections, and tailor selected content inside that CV. Offer explicit review and sync when selected library content changes. Save named checkpoints and restore one as a new draft revision.
4. Choose a template and tune the design in a live A4 preview. Save settings independently for each CV so a dense two-page CV can use different typography and spacing from a one-page CV. Template defaults work immediately, with reset available at the field, section, and CV level as applicable.
5. Run **Resume Check** on demand, fix prioritized findings, then export a selectable-text PDF or editable Word DOCX.

## Editor and design

- Desktop uses a split view with structured editing on the left and a zoomable, paginated A4 preview on the right. Mobile uses **Edit** and **Preview** views with full editing, accessible reorder buttons, and preserved scroll and form state when switching.
- Keep the English interface light only. Use Inter for UI typography, a warm canvas, white paper, dark ink, and a restrained deep purple accent. Keep CV color palettes and fonts independent of the app chrome. Use a tinted or subtly translucent sticky toolbar only where it overlaps scrolling content, with an opaque fallback.
- Group editing into **Content**, **Design**, and **Resume Check**. Put common controls first, with advanced spacing behind an explicit disclosure. Show saving, saved, and retry states near the CV title. Keep typing, toggles, and numeric changes immediately responsive. Use subtle press feedback and short, interruptible pointer transitions. Keep keyboard navigation immediate and respect reduced motion and transparency preferences.
- Ship the 23 layouts from the main Enhancv gallery as editable template options, preserving their column structure, header placement, section order, and photo or logo slots. Use the same resume content across templates and restore the style settings previously saved for each template. [Enhancv reference gallery](https://enhancv.com/resume-templates/)
- Include palette presets and custom accent colors, curated fonts, body and heading sizes, weight, line height, letter spacing, four-sided page margins, header padding, section and item gaps, bullet spacing, and photo size and crop on supported templates. Offer per-section typography and spacing overrides plus a break-before control for sections. Use automatic pagination with visible page boundaries and intentional splitting of long content.
- Preserve Unicode input and editable section titles, including Russian examples such as `Проекты`. Ship English copy and English text heuristics. Test Cyrillic rendering and extraction in both exports.

## Resume Check and job matching

Teal documents separate resume-analysis and job-match scores. A real ATS parser can miss data when a file uses columns, graphics, or contact information in a header. Ogma will show an explainable structure and readability score on the selected CV, with a separate job-match score when a description is provided. [Teal Resume Analyzer](https://help.tealhq.com/en/articles/9524748-using-the-resume-analyzer) · [Teal tailoring guide](https://help.tealhq.com/en/articles/14435726-how-to-tailor-your-resume-for-a-specific-job) · [Greenhouse parsing guidance](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse)

- Show which checks passed, what affected the score, the affected field or page, and a concrete fix. Aim for 90+ on Ogma’s own rubric and describe the score as an estimate of structure and parseability. Mark each relevant result stale after an edit. Preserve access to the original result until the next run.
- Use deterministic checks for the score. Offer optional AI-assisted rewrites from individual findings, with a preview and explicit apply. Suggest stronger phrasing or ask for supporting details when needed. Keep the checks usable without a provider key, during an outage, or after reaching usage limits.
- After the builder is usable, add **Job Match** as a secondary tab. Paste a description, show matched requirements and gaps with supporting CV text, and suggest including relevant library entries or bullets. The lightweight tracker stores company, role, description, optional posting URL, status, and the CV checkpoint sent. Use manual entry and status updates. Leave LinkedIn import, the browser extension, automated job scraping, OCR, and full UI localization for future consideration.

- Add a **Cover Letter** action alongside Job Match. Draft a letter for the saved job description using the selected CV version and its documented experience. Let the user review, edit, and save the draft with the job. AI-assisted drafting is optional and follows the same consent and review flow as CV rewrites. Manual editing remains available.

## Implementation milestones

1. **Foundation and document prototype.** Set up the workspace, private owner access, PostgreSQL migrations, and a thin end-to-end document slice. Prove A4 pagination, selectable text, photo rendering, and Cyrillic fixtures in PDF and DOCX. Test a long entry crossing pages before building the full designer.
2. **Library and versioned CMS.** Build dashboard, library CRUD, CV editing, selections, reordering, autosave, duplication, explicit library sync, and checkpoint restore. Verify that two CVs can use the same library entry with different wording and selections.
3. **Design and preview.** Ship the 23 layouts, photo controls, design presets and overrides, automatic pagination, and section page breaks. Verify changes in the desktop split pane and mobile preview.
4. **Import, export, and Resume Check.** Ship PDF and DOCX import review, PDF and DOCX downloads, format-aware diagnostics, and optional AI rewrites. Validate round-trip text and reading order on representative fixtures and rehearse a backup restore before deploying the private builder.
5. **Simple job tools.** Add manual job records, optional Job Match and CV tailoring, tailored cover letter drafts, and a sent-checkpoint link. Verify that the letter uses the selected CV and job description and that later edits preserve the historical application record.

The core release is complete when you can import an existing CV, reuse its content in two independently styled CVs, preview and export both formats, act on the structure score, and reopen the same drafts on another device. See [ARCHITECTURE.md](ARCHITECTURE.md) for the technical design and [AGENTS.md](AGENTS.md) for repository conventions.
