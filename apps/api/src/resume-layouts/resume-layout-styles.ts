export const resumeLayoutStyles = `
* { box-sizing:border-box }
body { margin:0; background:#ece8e1; color:#25282b }
.workspace { padding:14px 10px 30px }
@media screen {
  html { scrollbar-width:thin; scrollbar-color:#ab9bb7 transparent; }
  .workspace { --fit-page:min(calc(100vw - 25px),calc((100vh - 40px) * var(--paper-width,210) / var(--paper-height,297)),620px); --preview-page:calc(var(--fit-page) * var(--preview-zoom,1)); min-width:calc(var(--preview-page) + 20px); }
  .workspace .page { width:var(--preview-page); }
}
.page + .page { margin-top:20px; }
.page { container-type:inline-size; width:min(100%, 620px); margin:auto; box-shadow:0 3px 15px #302f221a }
.resume-page {
  --column-gap:4cqw;
  --heading-color:#24292d;
  --name-color:#19222a;
  --title-color:#26303b;
  --label-weight:700;
  --name-size:2.56em;
  --name-weight:700;
  --name-case:uppercase;
  --meta:#4b535a;
  --rules:#39424a;
  --voice:var(--accent);
  background:var(--paper); min-height:calc(100cqw * var(--paper-height,297) / var(--paper-width,210)); padding:var(--margin-top) var(--margin-right) var(--margin-bottom) var(--margin-left);
  font:normal var(--body)/var(--leading) var(--font); overflow-wrap:anywhere;
}
h1,h2,h3,p,ul,ol { margin:0 }
h1 { color:var(--name-color); font-size:var(--name-size); font-weight:var(--name-weight); line-height:1.04; letter-spacing:-.025em; text-transform:var(--name-case) }
h2 { color:var(--heading-color); font-size:1.2em; font-weight:var(--label-weight); line-height:1.18; text-transform:uppercase; margin-bottom:.55em; break-after:avoid }
h3 { color:var(--title-color); font-size:1.17em; line-height:1.17; break-after:avoid }
i { font-style:normal }
p + p { margin-top:.32em }
ul { padding-left:1.16em }
header { display:grid; gap:.42em; margin-bottom:var(--gap); }
.pronouns { color:var(--meta); font-size:.9em; }
.rich-text { margin-top:.37em; }
.rich-text ol { padding-left:1.16em; }
.rich-text li p { margin:0; }
.resume-page .rich-text ul { padding-inline-start:.85em; list-style:none; }
.resume-page .rich-text ul > li { position:relative; padding-inline-start:.95em; }
.resume-page .rich-text ul > li::before {
  content:var(--list-marker,"\u2022"); position:absolute; inset-block-start:0; inset-inline-start:0;
  font:inherit; line-height:inherit;
}
.head-center.heading-spaced .job .rich-text,.template-crest-projects .projects .rich-text { --list-marker:"\u2014"; }

.role { color:var(--voice); font-size:1.15em; font-weight:700; }
.contact { min-width:0; display:flex; flex-wrap:wrap; gap:.3em 1.15em; color:var(--meta); font-size:.89em; }
.contact > span { display:inline-flex; min-width:0; max-width:100%; gap:.34em; align-items:baseline; }
.contact > span > span { min-width:0; overflow-wrap:anywhere; }
.contact i { color:var(--accent); }
.columns { display:block }
.two-columns .columns {
  display:grid; align-items:start; column-gap:var(--column-gap);
  grid-template-columns:minmax(0,calc(var(--split) - var(--column-gap) / 2)) minmax(0,1fr);
}
.column { min-width:0 }
.section { margin-bottom:var(--gap) }
.section:last-child { margin-bottom:0 }
.section-icon { display:none; flex:none; }
.heading-underline h2 { border-bottom:.18em solid var(--rules); padding-bottom:.1em }
.heading-hairline h2 { border-bottom:.075em solid var(--rules); padding-bottom:.3em; }
.heading-spaced h2 { font-size:.96em; letter-spacing:.19em; }
.heading-center-rule h2 { border-bottom:.075em solid #797979; text-align:center; text-transform:none; padding-bottom:.31em; font-size:1.42em; margin-bottom:.62em; }
.job { position:relative; display:flex; align-items:start; gap:.72em; }
.job + .job { margin-top:1.34em }
.job-copy, .job-heading > div { flex:1; min-width:0; }
.job-heading { display:flex; align-items:baseline; flex-wrap:wrap; gap:.12em .7em }
.employer { color:var(--voice); font-size:1em; font-weight:700; margin-top:.18em; }
.dates { display:flex; flex-wrap:wrap; gap:.24em .65em; color:var(--meta); font-size:.89em; }
.dates > span:empty { display:none }
.job ul { margin-top:.37em; }
.job li + li { margin-top:.13em }
.section-copy .entry { display:flex; align-items:start; gap:.65em; break-inside:avoid }
.entry h3 { font-size:1.02em; }
.entry p { margin-top:.15em; }
.entry-icon { display:none; flex:none; line-height:1; color:var(--accent) }
.entry-copy { min-width:0; flex:1; }
.section-copy > .entry + .entry { margin-top:.69em; }
.awards .section-copy {
  display:grid; grid-template-columns:repeat(var(--ach-columns), minmax(0, 1fr)); gap:1em 1.75em;
}
.awards .section-copy > .entry { margin:0 }
.education h3,.certifications h3,.projects h3 { color:var(--voice); }
.skill-list { list-style:none; padding:0; display:flex; flex-wrap:wrap; gap:.3em .66em; }
.skill-list li:not(:last-child)::after { content:" ·"; color:var(--meta); }
.portrait { display:block; width:var(--portrait-size, 11.5cqw); aspect-ratio:1; border-radius:50%; object-fit:cover; }
.portrait-placeholder { background:radial-gradient(circle at 50% 36%, #977865 0 16%, transparent 17%), radial-gradient(ellipse at 50% 91%, #997966 0 34%, transparent 35%), #e7d9cd; }
.photo-right header { grid-template-columns:minmax(0,1fr) auto; align-items:start; column-gap:2em }
.photo-right header .portrait { grid-area:1 / 2 / span 2 / 3; justify-self:end; }
.photo-top header .portrait { justify-self:center; --portrait-size:10.5cqw; margin-bottom:.3em; }
.employer-logo { display:grid; place-items:center; flex:none; width:2.3em; aspect-ratio:1; object-fit:contain; background:#326d95; color:white; font-weight:bold; font-size:1.06em; }
.brand-1 { background:#6251a1 }
.brand-2 { background:#29836d }
.brand-3 { background:#3b5786 }
.logos-right .employer-logo { order:2 }
.timeline .job {
  --job-gap:1.34em;
  --marker-offset:.59em;
  display:grid;
  grid-template-columns:minmax(0,14%) minmax(0,1fr) auto;
  column-gap:1.4em;
}
.timeline.logos-none .job { grid-template-columns:minmax(0,14%) minmax(0,1fr); }
.timeline .job + .job { margin-top:var(--job-gap); }
.timeline .job > .dates { grid-column:1; grid-row:1; flex-direction:column; gap:.35em; }
.timeline .job > .dates > span:first-child { font-weight:700; color:var(--title-color); }
.timeline .job-copy { position:relative; grid-column:2; grid-row:1; align-self:stretch; padding-left:1em; }
.timeline .job-copy::before,.timeline .job:not(:last-child) .job-copy::after {
  content:""; position:absolute; inset-inline-start:0; top:var(--marker-offset);
  transform:translateX(-50%);
}
.timeline .job-copy::before {
  z-index:1; width:.62em; height:.62em; border-radius:50%;
  background:var(--title-color); transform:translate(-50%,-50%);
}
.timeline .job:not(:last-child) .job-copy::after {
  bottom:calc(-1 * (var(--job-gap) + var(--marker-offset)));
  width:max(1px,.08em); background:#889196;
}
.timeline.logos-left .employer-logo { order:0; grid-column:3; grid-row:1; }


.head-center { --name-case:none; --name-size:1.95em; --title-color:#222; --label-weight:700; }
.head-center header { text-align:center; gap:.27em }
.head-center .contact { justify-content:center; }
.head-center .contact i { display:none; }
.head-center .role { font-weight:400; }
.heading-center-rule h3 { font-weight:400; }
.heading-center-rule .employer,.heading-center-rule .dates { color:#454545; }
.heading-center-rule .dates { flex-direction:column; align-items:flex-end; }
.heading-center-rule .job + .job { border-top:.065em dotted #b5b5b5; padding-top:.85em; }
.heading-center-rule .awards h3 { font-weight:700; }
.template-ivy-league-logos .job h3,.template-ivy-league-photo .job h3 { color:var(--accent) }
.template-ivy-league-logos .employer-logo { width:2.7em }

.template-crest,.template-crest-projects {
  --name-size:3.55em; --name-weight:400; --name-color:#29221a; --title-color:#3c342a; color:#433b30;
}
.template-crest header,.template-crest-projects header { gap:.9em; }
.heading-spaced .summary h2 { position:absolute; clip-path:inset(50%); }
.head-center.heading-spaced .role { font-size:.9em; letter-spacing:.21em; text-transform:uppercase; }
.head-center.heading-spaced .contact { border-block:.065em solid #cfc5b5; padding:1.45em 0; font-size:1em; }
.head-center.heading-spaced .summary { text-align:center; font-style:italic; font-size:1.16em; padding-inline:6cqw; }
.head-center.heading-spaced .section:not(.summary) { border-top:.065em solid #cfc5b5; padding-top:1.3em; }
.head-center.heading-spaced h3 { font-weight:400; }
.head-center.heading-spaced .employer,.head-center.heading-spaced .dates { color:#6b6257; font-weight:400; }

.head-center.heading-spaced .projects .entry + .entry { margin-top:1.45em; }
.head-center.heading-spaced .projects .entry h3 { color:var(--title-color); font-size:1.23em; }

.rail-left .side,.rail-left-column .side { grid-area:1 / 1; }
.rail-left .main,.rail-left-column .main { grid-area:1 / 2; }
.rail-left,.rail-right { --column-gap:7cqw; }
.rail-left { background:linear-gradient(90deg,var(--side) var(--rail-edge,36%),var(--paper) 0); }
.rail-right { background:linear-gradient(90deg,var(--paper) var(--rail-edge,63%),var(--side) 0); }
.rail-right header { max-width:calc(var(--rail-edge,63cqw) - var(--margin-left) - var(--margin-right)); }
.rail-right .side { margin-top:var(--gap); }
.rail-left .side,.rail-right .side {
  color:white; --heading-color:white; --title-color:white; --rules:#ffffff88; --voice:white; --meta:#e5eff0;
}
.rail-left .side .entry i,.rail-right .side .entry i { color:white; }
.rail-left .rail-portrait { margin:0 0 4.4cqw; }
.rail-left .rail-portrait .portrait { margin:auto; }
.rail-left::before,.template-elegant-logos::before {
  content:""; display:block; height:1.6cqw; margin:calc(-1 * var(--margin-top)) calc(-1 * var(--margin-right)) calc(var(--margin-top) - 1.6cqw) calc(-1 * var(--margin-left));
}
.rail-left::before { background:linear-gradient(90deg,#003537 36%,transparent 0) }
.template-elegant-logos::before { background:linear-gradient(90deg,transparent 63%,#063f40 0) }
.template-polished .portrait { --portrait-size:12.6cqw; }
.portrait-square .portrait { border-radius:.2em; }
.template-polished .job-heading,.template-elegant .job-heading,.template-elegant-logos .job-heading { flex-wrap:nowrap; }
.template-polished .dates,.template-elegant .dates,.template-elegant-logos .dates { flex-direction:column; align-items:flex-end; text-align:right; }
.template-elegant,.template-polished,.template-elegant-logos,.template-creative,.template-stylish,.template-modern,.template-high-performer {
  --label-weight:500;
}
.template-elegant .main h3 { font-weight:400; }

.head-banner header {
  padding:calc(var(--margin-top) * .8) var(--margin-right) calc(var(--margin-top) * .8) var(--margin-left);
  margin:calc(-1 * var(--margin-top)) calc(-1 * var(--margin-right)) var(--gap) calc(-1 * var(--margin-left));
  background:var(--side); --name-color:#fff; --voice:#fff; --meta:#f9f9ff;
}
.head-banner .role { font-size:1em }
.head-banner .contact { max-width:55cqw; }
.head-banner .contact i { color:#eff3ff }
.template-creative .portrait { --portrait-size:10cqw; border:.35em solid #9aafbe; }

.head-badge { --name-weight:400; --name-size:3.08em; --name-color:#303434; --title-color:#282e2b; --heading-color:#255a43; }
.head-badge .columns { column-gap:5.1cqw; }
.head-badge header { gap:.55em; }
.head-badge .role {
  padding:.55em .85em; background:var(--side); color:#26493b; border-radius:.95em;
  font-size:1.14em; letter-spacing:.11em; font-weight:500; text-transform:uppercase;
}
.head-badge .rail-portrait { position:relative; isolation:isolate; display:grid; justify-items:start; margin:0 0 3.4cqw; width:20cqw; padding:1cqw 2.35cqw 1cqw; }
.head-badge .rail-portrait::before,.head-badge .rail-portrait::after {
  content:""; position:absolute; z-index:-1; inset:3% 4% 6% 2%; border-radius:27% 65% 48% 62%; background:#c3e2d1; transform:rotate(-20deg);
}
.head-badge .rail-portrait::after { inset:0 5% 3% 13%; transform:rotate(29deg); background:#a9d2c2a8; }
.head-badge .portrait { --portrait-size:14.5cqw; }
.head-badge .contact { flex-direction:column; gap:.71em; }
.head-badge h2 { display:flex; gap:.36em; align-items:center; font-size:1.08em; }
.head-badge .section-icon { display:grid; place-items:center; width:1.75em; height:1.75em; background:#cce8d9; border-radius:50%; }
.head-badge .entry i { display:block; font-size:.82em; }
.head-badge .job-heading { flex-wrap:nowrap; }
.head-badge .job .dates { flex-direction:column-reverse; align-items:flex-end; text-align:right; }
.head-badge .employer { font-weight:400; color:var(--title-color); }
.head-badge .side .section { margin-bottom:3cqw; }
.head-badge .side .section:last-child { margin-bottom:0; }

.template-modern { --name-case:none; --name-size:2.62em; --name-color:#123c7b; --voice:#a85d24; --title-color:#1d467c; }
.template-modern .role { font-weight:500; }
.template-modern .portrait { --portrait-size:10.5cqw; }
.template-stylish { --name-weight:400; --name-color:#244c79; }
.template-stylish .entry i,.template-modern .entry i,.template-high-performer .awards .entry i {
  display:grid; place-items:center; flex:none; width:2.25em; height:2.25em; border-radius:50%; background:#eff6fa;
}
.template-modern .entry i { color:#b86b37; background:#f9ede4; }

.template-imprint { --name-case:none; --name-weight:400; --name-size:3.6em; --heading-color:#353b3f; --title-color:var(--accent); --voice:var(--accent); border-left:1.7cqw solid #b3cde4; }
.template-imprint header { border-bottom:.075em solid #c8ced4; padding-bottom:1.3em; }
.template-imprint .summary { font-style:italic; font-size:1.23em; color:#596168; }
.template-imprint .awards .entry i { display:block; color:#293942; font-size:1.62em; }
.template-imprint .entry h3 { font-weight:400; color:#26323b; }
.template-imprint .job h3 { font-weight:400; }
.template-imprint .job .dates { color:#5186a4; }
.template-imprint .employer { color:#303a42; font-weight:400; }

.template-double-column .awards h3,.template-single-column .awards h3 { color:#181d21; }
.template-double-column .skill-list li,.template-creative .skill-list li,.template-stylish .skill-list li,.template-single-column-photo .skill-list li,.template-double-column-logos .skill-list li,.template-compact .skill-list li,.template-high-performer .skill-list li,.template-modern .skill-list li,.template-timeline .skill-list li {
  border-bottom:.12em solid #cbd0d4; padding:.16em .26em; font-weight:700;
}
.template-double-column .skill-list li::after,.template-creative .skill-list li::after,.template-stylish .skill-list li::after,.template-single-column-photo .skill-list li::after,.template-double-column-logos .skill-list li::after,.template-compact .skill-list li::after,.template-high-performer .skill-list li::after,.template-modern .skill-list li::after,.template-timeline .skill-list li::after { display:none }
.template-elegant .entry i,.template-polished .entry i,.template-elegant-logos .entry i,.template-creative .entry i,.template-double-column-logos .entry i,.template-compact .entry i,.template-single-column-photo .awards .entry i { display:block; }
.template-single-column-photo .awards .section-copy { grid-template-columns:repeat(2,minmax(0,1fr)); }
.template-double-column-logos { --heading-color:#17457c; --name-color:#153b72; --rules:#275288; --title-color:#3c649b; }
.template-double-column-logos .employer-logo { border-radius:0; }
.template-double-column-logos .employer { color:#3a83b3; }
.template-timeline .employer { color:#3d5e76; }
.template-timeline-logos { --name-color:#12483f; --heading-color:#235749; --title-color:#263c39; --voice:#287a65; }

.template-compact { --name-color:#23547a; --heading-color:#626a70; --name-case:none; --name-weight:400; --name-size:2.2em; --label-weight:400; }
.template-compact h2 { font-size:.89em; }
.template-compact h3 { color:#2a5274; font-weight:500; }
.template-compact .employer,.template-compact .dates { font-size:.83em; color:#5d646a; font-weight:400; }
.template-compact .job-heading { display:block; }
.template-compact .entry i { color:#3383ae; }
.template-classic { --name-case:none; --name-size:2.65em; --name-color:#151719; --voice:#313438; --heading-color:#51555b; }
.template-classic .role { font-weight:400; font-size:1.4em; }
.template-classic .awards h3,.template-classic .job h3 { color:var(--accent); }
.template-classic .certifications .section-copy { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1.25em; }
.template-classic .certifications .entry { margin:0; }
.template-high-performer { --name-size:2.17em; --name-weight:400; --heading-color:#3b494e; --voice:#2f8195; --title-color:#266a7c; }
.template-minimal { --name-weight:500; --name-size:2.3em; --heading-color:#2c7554; --label-weight:500; }
.template-minimal h2 { font-size:.95em; }
.template-minimal .role,.template-minimal .job .employer { color:var(--title-color); font-weight:400; }
.template-minimal .side { padding-top:.25em; }
.template-minimal .skill-list { display:block; font-weight:700; }
.template-minimal .skill-list li { display:inline; }

.template-double-column .job + .job,.template-elegant-logos .job + .job { margin-top:1.55em; }
.template-double-column .job li + li,.template-creative .job li + li,.template-stylish .job li + li,
.template-modern .job li + li,.template-elegant-logos .job li + li,.template-compact .job li + li { margin-top:.29em; }
.template-double-column .skill-list { align-items:flex-start; flex-direction:column; gap:.53em; }
.template-double-column .skill-list li { padding-bottom:.42em; }
.template-elegant .side { margin-top:calc(var(--gap) * 2.5); }
.template-elegant .section,.template-elegant-logos .section { margin-bottom:calc(var(--gap) * 1.52); }
.template-elegant .job li + li,.template-classic .job li + li { margin-top:.3em; }
.template-classic .job + .job { margin-top:1.65em; }
.template-classic .section { margin-bottom:calc(var(--gap) * 1.32); }
.template-timeline .certifications .section-copy { display:grid; grid-template-columns:1fr 1fr; gap:1.4em; }
.template-timeline .certifications .entry { margin:0; }
.template-ivy-league-photo .skills .skill-list { display:block; }
.template-ivy-league-photo .skills .skill-list li { display:inline; }
.template-crest-projects .projects .entry p { line-height:1.5; color:#695f52; }

.template-crest-projects .projects .entry + .entry { margin-top:2.3em; }
.head-badge { --heading-color:color-mix(in srgb,var(--accent) 86%,#081b13); }
.head-badge .role { background:color-mix(in srgb,var(--accent) 17%,var(--side)); }
.head-badge .section-icon { background:color-mix(in srgb,var(--accent) 22%,white); }
.head-badge .side .contact-section .contact { line-height:1.39; }
.head-badge .job li + li { margin-top:.22em; }

.skill-levels:not(.two-columns) .skills .section-copy { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1.25em 2em; }
.skill-levels:not(.two-columns) .skills .entry { margin-top:0; }
.skill-levels .skill-list { display:grid; gap:.42em; }
.skill-levels .skill-list li { display:flex; flex-wrap:wrap; justify-content:space-between; gap:.28em .6em; }
.skill-levels .skill-list li::after { display:none; }
.skill-level { display:inline-flex; align-items:center; gap:.35em; font-size:.84em; font-weight:400; color:var(--meta); }
.skill-meter { width:2.8em; height:.36em; border-radius:1em; background:#aeb5bb55; }
.skill-meter > span { display:block; height:100%; border-radius:inherit; background:var(--accent); }

.resume-page .job-heading {display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:.2em .8em;}
.resume-page .job-heading > .entry-title-line {display:flex; align-items:baseline; flex-wrap:wrap; flex:1 1 auto; gap:.2em .5em; min-width:0;}
.resume-page .job-heading > .entry-right-metadata,.resume-page .entry-title-line > .entry-left-metadata {
  flex-direction:row; align-items:baseline; flex-wrap:wrap; gap:0 .48em; min-width:0;
}
.resume-page .job-heading > .entry-right-metadata {flex:0 1 auto; max-width:100%; margin-inline-start:auto; justify-content:flex-end; text-align:right;}
.resume-page .entry-title-line > .entry-left-metadata {text-align:left;}
.entry-separator {color:color-mix(in srgb,var(--meta) 70%,var(--paper)); flex:none;}
.resume-page .entry-metadata-row{display:block; text-align:left;}
.resume-page .entry-metadata-row.metadata-right{text-align:right;}
.skill-category-line {--list-marker:"\u2022";}
.heading-spaced.head-center .skill-category-line {--list-marker:"\u2014";}
.resume-page .skills .skill-category-list {position:relative; padding-inline-start:1.8em;}
.skill-category-list::before {content:var(--list-marker); position:absolute; inset-inline-start:.85em; inset-block-start:0; font:inherit;}
.skill-category-line > p {margin:0;}
.skill-category-label {font-weight:bold;}
.skill-separator {color:var(--meta);}
.resume-page.skills-layout-columns .skills .skill-list {display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); column-gap:1em; padding:0;}
.resume-page.skills-layout-columns .skills .skill-list li {display:flex; flex-wrap:wrap; gap:.25em .5em; min-width:0; border:0; padding:0;}
.resume-page.skills-layout-columns .skills .skill-list li::after {display:none;}

@media print {
  body { background:white; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .workspace { padding:0 }
  .page { width:calc(var(--paper-width,210) * 1mm); box-shadow:none }
  .page + .page { margin-top:0; break-before:page; }
  .resume-page { min-height:calc((var(--paper-height,297) - 1) * 1mm) }
  /* Keep Chromium’s paint order grouped by reading column and section for text extractors. */
  /* Keep each text block together in Chromium's PDF paint order. */
  .resume-page header,.resume-page .column,.resume-page .section,.resume-page .job,.resume-page .entry { isolation:isolate; }
  .resume-page.heading-spaced h2,.resume-page.head-center.heading-spaced .role,.resume-page.head-badge .role { letter-spacing:.04em; }
  h2,h3,.job-heading { break-after:avoid }
  p,li { orphans:2; widows:2 }
}
`;
