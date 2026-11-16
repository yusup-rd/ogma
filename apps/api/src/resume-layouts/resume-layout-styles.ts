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
  --rules:var(--ink-accent);
  --voice:var(--supporting-ink);
  --side:var(--preset-side);
  --icon-ink:var(--ink-accent);
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

.role { color:var(--title-color); font-size:1.15em; font-weight:700; }
.contact { min-width:0; display:flex; flex-wrap:wrap; gap:.3em 1.15em; color:var(--meta); font-size:.89em; }
.contact > span { display:inline-flex; min-width:0; max-width:100%; gap:.34em; align-items:baseline; }
.contact > span > span { min-width:0; overflow-wrap:anywhere; }
.contact-icon { flex:none; color:var(--icon-ink); }
.contact-icon svg,.entry-icon svg,.section-icon svg { display:block; width:1em; height:1em; }
.contact > span { align-items:center; }
a { color:inherit; text-decoration:none; }
@media screen {
  a { cursor:pointer; }
  a:is(:hover,:focus-visible) { text-decoration:underline; }
  a:focus-visible { outline:1px solid currentColor; outline-offset:2px; }
}
.columns { display:block }
.two-columns .columns {
  display:grid; align-items:start; column-gap:var(--column-gap);
  grid-template-columns:minmax(0,calc(var(--split) - var(--column-gap) / 2)) minmax(0,1fr);
}
.column { min-width:0 }
.section { margin-bottom:var(--gap) }
.section:last-child { margin-bottom:0 }
.section h2:has(.section-icon) { display:flex; align-items:center; gap:.4em; }
.section-icon { display:grid; place-items:center; flex:none; color:var(--icon-ink); }
.heading-center-rule h2:has(.section-icon) { justify-content:center; }
.heading-underline h2 { border-bottom:.18em solid var(--rules); padding-bottom:.1em }
.heading-hairline h2 { border-bottom:.075em solid var(--rules); padding-bottom:.3em; }
.heading-spaced h2 { font-size:.96em; letter-spacing:.19em; }
.heading-center-rule h2 { border-bottom:.075em solid var(--rules); text-align:center; text-transform:none; padding-bottom:.31em; font-size:1.42em; margin-bottom:.62em; }
.job { position:relative; display:flex; align-items:start; gap:.72em; }
.job + .job { margin-top:1.34em }
.job-copy, .job-heading > div { flex:1; min-width:0; }
.job-heading { display:flex; align-items:baseline; flex-wrap:wrap; gap:.12em .7em }
.employer { color:var(--meta); font-size:1em; font-weight:700; margin-top:.18em; }
.dates { display:flex; flex-wrap:wrap; gap:.24em .65em; color:var(--meta); font-size:.89em; }
.dates > span:empty { display:none }
.job li + li { margin-top:.13em }
.section-copy .entry { display:flex; align-items:start; gap:.65em; break-inside:avoid }
.entry h3 { font-size:1.02em; }
.entry p { margin-top:.15em; }
.entry-icon { display:grid; place-items:center; flex:none; line-height:1; color:var(--icon-ink) }
.entry-bullet { flex:none; inline-size:.3em; block-size:.3em; border-radius:50%; background:currentColor; margin-top:.46em; }
.entry-copy { min-width:0; flex:1; }
.section-copy > .entry + .entry { margin-top:.69em; }
.awards .section-copy {
  display:grid; grid-template-columns:repeat(var(--ach-columns), minmax(0, 1fr)); gap:1em 1.75em;
}
.awards .section-copy > .entry { margin:0 }
.skill-list { list-style:none; padding:0; display:flex; flex-wrap:wrap; gap:.3em .66em; }
.portrait { display:block; width:var(--portrait-size, 11.5cqw); aspect-ratio:1; border-radius:50%; object-fit:cover; }
.portrait-placeholder { display:grid; place-items:center; background:#e6e6e6; color:#686868; }
.portrait-placeholder svg { width:52%; height:auto; }
.photo-right header { grid-template-columns:minmax(0,1fr) auto; align-items:start; column-gap:2em }
.photo-right header .portrait { grid-area:1 / 2 / span 2 / 3; justify-self:end; }
.photo-top header .portrait { justify-self:center; --portrait-size:10.5cqw; margin-bottom:.3em; }
.employer-logo { display:grid; place-items:center; flex:none; width:2.3em; aspect-ratio:1; object-fit:contain; background:#326d95; color:white; font-weight:bold; font-size:1.06em; }
.brand-1 { background:#6251a1 }
.brand-2 { background:#29836d }
.brand-3 { background:#3b5786 }
.logos-left .employer-logo { order:-1 }
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
  background:var(--ink-accent); transform:translate(-50%,-50%);
}
.timeline .job:not(:last-child) .job-copy::after {
  bottom:calc(-1 * (var(--job-gap) + var(--marker-offset)));
  width:max(1px,.08em); background:#889196;
}
.timeline .employer-logo { order:0; grid-column:3; grid-row:1; }


.head-center { --name-case:none; --name-size:1.95em; --title-color:#222; --label-weight:700; }
.head-center header { text-align:center; gap:.27em }
.head-center .contact { justify-content:center; }
.head-center .role { font-weight:400; }
.heading-center-rule h3 { font-weight:400; }
.heading-center-rule .employer,.heading-center-rule .dates { color:#454545; }
.heading-center-rule .dates { flex-direction:column; align-items:flex-end; }
.heading-center-rule .job + .job { border-top:.065em dotted #b5b5b5; padding-top:.85em; }
.heading-center-rule .awards h3 { font-weight:700; }
.heading-center-rule .skill-meter,.head-center.heading-spaced .skill-meter { color:var(--title-color); }
.template-ivy-league-logos .employer-logo { width:2.7em }

.template-crest,.template-crest-projects {
  --name-size:3.55em; --name-weight:400; --name-color:#29221a; --title-color:#3c342a; color:#433b30;
}
.template-crest header,.template-crest-projects header { gap:.9em; }
.heading-spaced .summary h2 { position:absolute; clip-path:inset(50%); }
.head-center.heading-spaced .role { font-size:.9em; letter-spacing:.21em; text-transform:uppercase; }
.head-center.heading-spaced .contact { border-block:.065em solid color-mix(in srgb,var(--rules) 57%,var(--paper)); padding:1.45em 0; font-size:1em; }
.head-center.heading-spaced .summary { text-align:center; font-style:italic; font-size:1.16em; padding-inline:6cqw; }
.head-center.heading-spaced .section:not(.summary) { border-top:.065em solid color-mix(in srgb,var(--rules) 57%,var(--paper)); padding-top:1.3em; }
.head-center.heading-spaced h3 { font-weight:400; }
.head-center.heading-spaced .employer,.head-center.heading-spaced .dates { color:#6b6257; font-weight:400; }

.head-center.heading-spaced .projects .entry + .entry { margin-top:1.45em; }
.head-center.heading-spaced .projects .entry h3 { color:var(--title-color); font-size:1.23em; }

.rail-left .side,.rail-left-column .side { grid-area:1 / 1; }
.rail-left .main,.rail-left-column .main { grid-area:1 / 2; }
.rail-left,.rail-right { --column-gap:7cqw; }
.rail-left { background-image:linear-gradient(90deg,var(--side) var(--rail-edge),var(--paper) 0); }
.rail-right { background-image:linear-gradient(90deg,var(--paper) var(--rail-edge),var(--side) 0); }
.rail-right header { max-width:calc(var(--rail-edge) - var(--margin-left) - var(--column-gap) / 2); }
.rail-right .side { margin-top:var(--gap); }
.rail-left .side,.rail-right .side {
  color:white; --heading-color:white; --title-color:white; --rules:color-mix(in srgb,white 72%,var(--ink-accent)); --voice:#fff; --icon-ink:var(--rules); --meta:#e5eff0;
}
.rail-left .rail-portrait { margin:0 0 4.4cqw; }
.rail-left .rail-portrait .portrait { margin:auto; }
.rail-left::before,.template-elegant-logos::before {
  content:""; display:block; height:1.6cqw; margin:calc(-1 * var(--margin-top)) calc(-1 * var(--margin-right)) calc(var(--margin-top) - 1.6cqw) calc(-1 * var(--margin-left));
}
.rail-left::before { background:linear-gradient(90deg,color-mix(in srgb,var(--side) 67%,black) var(--rail-edge),transparent 0) }
.template-elegant-logos::before { background:linear-gradient(90deg,transparent var(--rail-edge),color-mix(in srgb,var(--side) 67%,black) 0) }
.template-polished .portrait { --portrait-size:12.6cqw; }
.portrait-square .portrait { border-radius:.2em; }
.template-polished .job-heading,.template-elegant .job-heading,.template-elegant-logos .job-heading { flex-wrap:nowrap; }
.template-polished .dates,.template-elegant .dates,.template-elegant-logos .dates { flex-direction:column; align-items:flex-end; text-align:right; }
.template-elegant,.template-polished,.template-elegant-logos,.template-creative,.template-stylish,.template-modern,.template-high-performer {
  --label-weight:500;
}
.template-elegant .main h3 { font-weight:400; }
.template-elegant .main header { max-width:none; }
.template-elegant .rail-portrait { margin:0 0 4cqw; }
.template-elegant .rail-portrait .portrait { margin:auto; --portrait-size:12.6cqw; }

.head-banner header {
  padding:calc(var(--margin-top) * .8) var(--margin-right) calc(var(--margin-top) * .8) var(--margin-left);
  margin:calc(-1 * var(--margin-top)) calc(-1 * var(--margin-right)) var(--gap) calc(-1 * var(--margin-left));
  background:var(--side); --name-color:#fff; --voice:#fff; --meta:#f9f9ff;
}
.head-banner .role { font-size:1em }
.head-banner .contact { max-width:55cqw; }
.head-banner .contact-icon { color:#eff3ff }
.template-creative .portrait { --portrait-size:10cqw; border:.35em solid color-mix(in srgb,var(--side) 33%,white); }

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
.head-badge h2 { font-size:1.08em; }
.head-badge .section-icon { display:grid; place-items:center; width:1.75em; height:1.75em; background:#cce8d9; border-radius:50%; }
.head-badge .entry i { display:block; font-size:.82em; }
.head-badge .job-heading { flex-wrap:nowrap; }
.head-badge .job .dates { flex-direction:column-reverse; align-items:flex-end; text-align:right; }
.head-badge .employer { font-weight:400; color:var(--title-color); }
.head-badge .side .section { margin-bottom:3cqw; }
.head-badge .side .section:last-child { margin-bottom:0; }

.template-modern { --name-case:none; --name-size:2.62em; }
.template-modern .role { font-weight:500; }
.template-modern .portrait { --portrait-size:10.5cqw; }
.template-stylish { --name-weight:400; }
.template-stylish .entry-icon,.template-modern .entry-icon,.template-high-performer .awards .entry-icon {
  display:grid; place-items:center; flex:none; width:2.25em; height:2.25em; border-radius:50%; background:#eff6fa;
}
.template-modern .entry-icon { color:var(--voice); background:color-mix(in srgb,var(--voice) 10%,var(--paper)); }

.template-imprint { --name-case:none; --name-weight:400; --name-size:3.6em; --heading-color:#353b3f; border-left:1.7cqw solid color-mix(in srgb,var(--rules) 44%,var(--paper)); }
.template-imprint header { border-bottom:.075em solid var(--rules); padding-bottom:1.3em; }
.template-imprint .summary { font-style:italic; font-size:1.23em; color:#596168; }
.template-imprint .awards .entry-icon { display:block; color:#293942; font-size:1.62em; }
.template-imprint .entry h3 { font-weight:400; color:#26323b; }
.template-imprint .job h3 { font-weight:400; }
.template-imprint .employer { color:#303a42; font-weight:400; }

.template-double-column .awards h3,.template-single-column .awards h3 { color:#181d21; }
.template-single-column-photo .awards .section-copy { grid-template-columns:repeat(2,minmax(0,1fr)); }
.template-single-column.use-template-font header h1 { font-family:Georgia,serif; }
.template-double-column-logos .employer-logo { border-radius:0; }

.template-compact { --name-case:none; --name-weight:400; --name-size:2.2em; --label-weight:400; }
.template-compact h2 { font-size:.89em; }
.template-compact h3 { font-weight:500; }
.template-compact .employer,.template-compact .dates { font-size:.83em; color:#5d646a; font-weight:400; }
.template-compact .job-heading { display:block; }
.template-classic { --name-case:none; --name-size:2.65em; --name-color:#151719; --heading-color:#51555b; }
.template-classic .role { font-weight:400; font-size:1.4em; }
.template-classic .certifications .section-copy { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1.25em; }
.template-classic .certifications .entry { margin:0; }
.template-high-performer { --name-size:2.17em; --name-weight:400; --heading-color:#303335; --title-color:#303335; }
.template-high-performer .section h2 { border-width:.14em; }
.template-minimal { --name-weight:500; --name-size:2.3em; --heading-color:#2c7554; --label-weight:500; }
.template-minimal h2 { font-size:.95em; }
.template-minimal .role,.template-minimal .job .employer { color:var(--title-color); font-weight:400; }
.template-minimal .side { padding-top:.25em; }

.template-double-column .job + .job,.template-elegant-logos .job + .job { margin-top:1.55em; }
.template-double-column .job li + li,.template-creative .job li + li,.template-stylish .job li + li,
.template-modern .job li + li,.template-elegant-logos .job li + li,.template-compact .job li + li { margin-top:.29em; }
.template-elegant .side { margin-top:0; }
.template-elegant .section,.template-elegant-logos .section { margin-bottom:calc(var(--gap) * 1.52); }
.template-elegant .job li + li,.template-classic .job li + li { margin-top:.3em; }
.template-classic .job + .job { margin-top:1.65em; }
.template-classic .section { margin-bottom:calc(var(--gap) * 1.32); }
.template-timeline .certifications .section-copy { display:grid; grid-template-columns:1fr 1fr; gap:1.4em; }
.template-timeline .certifications .entry { margin:0; }
.template-crest-projects .projects .entry p { line-height:1.5; color:#695f52; }

.template-crest-projects .projects .entry + .entry { margin-top:2.3em; }
.head-badge .role { background:color-mix(in srgb,var(--ink-accent) 17%,var(--side)); }
.head-badge .section-icon { background:color-mix(in srgb,var(--ink-accent) 18%,var(--paper)); }
.head-badge .side .contact-section .contact { line-height:1.39; }
.head-badge .job li + li { margin-top:.22em; }


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
.skill-category-lined .skill-list { align-items:baseline; gap:.48em .7em; }
.skill-category-lined .skill-level { margin-inline-start:.46em; }
.skill-category-lined .skill-list li { max-width:100%; border-bottom:.075em solid color-mix(in srgb,currentColor 36%,transparent); padding:.1em .5em .23em; font-weight:600; }
.template-double-column .skill-category-lined li { padding-inline:0; }
.template-compact .skill-category-lined .skill-list { row-gap:.45em; }
.skill-category-columns .skill-list,.skill-category-rated .skill-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); column-gap:1em; }
.two-columns .skill-category-rated .skill-list { grid-template-columns:minmax(0,1fr); }
.skill-category-rated li { min-width:0; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:.16em .55em; padding-block:.12em; }
.template-high-performer .main .skill-category-rated .skill-list { grid-template-columns:repeat(2,minmax(0,1fr)); }
.skill-level { display:inline-flex; align-items:center; gap:.42em; color:var(--meta); font-size:.84em; }
.skill-meter { display:block; flex:none; color:var(--voice); }
.skill-meter-marks { --mark-step:.70em; --min-mark-step:4; inline-size:calc(5 * var(--mark-step)); block-size:auto; fill:color-mix(in srgb,currentColor 20%,transparent); shape-rendering:geometricPrecision; }
.skill-meter-marks > .filled { fill:currentColor; }
.indicator-bold-dots { --mark-step:1em; --min-mark-step:5; }
.indicator-sticks { --mark-step:.36em; --min-mark-step:3; block-size:1.04em; }
@media screen {
  /* Every mark starts at the same position relative to the device pixel grid. */
  .skill-meter-marks {
    --device-pixel:var(--preview-device-pixel,1px);
    inline-size:calc(5 * max(var(--min-mark-step) * var(--device-pixel),round(var(--mark-step),var(--device-pixel))));
  }
}
.indicator-bar { inline-size:4.2em; block-size:.38em; background:color-mix(in srgb,currentColor 18%,transparent); border-radius:1em; }
.indicator-bar > span { display:block; block-size:100%; background:currentColor; border-radius:inherit; }
.proficiency li:has(.indicator-bar) .skill-level { display:contents; }
.proficiency .indicator-bar { flex-basis:100%; }
.project-table { width:100%; table-layout:fixed; border-collapse:collapse; text-align:left; line-height:1.23; }
.job .project-table { margin-top:1.2em; }
.project-table :is(th,td) { padding:.32em .55em; border:1px solid #dfdfdf; vertical-align:top; }
.project-table th { font-weight:400; }
.project-table thead { background:var(--table-paper); color:var(--table-ink); }
.project-table thead th { font-weight:700; }
.project-table th:first-child { width:32%; }
.project-table tbody tr { break-inside:avoid; }
.project-context { display:block; margin-top:.2em; color:var(--meta); font-size:.85em; }

.template-essential {
  --name-case:none; --name-color:var(--ink-accent); --heading-color:var(--ink-accent);
  --title-color:#000; --meta:#000;
  color:#000;
}
.template-essential h1 { line-height:1.2; letter-spacing:0; }
.template-essential header { gap:calc(3 * var(--reference-point)); }
.template-essential .contact-inline { display:block; line-height:1.27; }
.template-essential .contact-inline > span { display:inline; }
.template-essential .section h2 { line-height:1.22; }
.resume-page.template-essential .section h2.summary-title {
  text-transform:none; color:var(--title-color);
  padding-bottom:calc(11 * var(--reference-point));
  font-size:var(--essential-summary-size) !important;
  font-weight:var(--essential-summary-weight) !important;
}
.template-essential .job-heading { column-gap:.65em; }
.template-essential .job-heading > .entry-title-line { flex:1 1 0; gap:0 .25em; }
.template-essential :is(.entry-title-line,.entry-right-metadata) { line-height:1.3; }
.template-essential .section .job .dates { font-weight:var(--essential-summary-weight) !important; }
.template-essential .job-heading .dates { gap:0 .2em; }
.template-essential :is(h3,.employer) { color:var(--title-color); line-height:1.3; }
.template-essential .employer,.template-essential .essential-entry-subtitle { margin:0; }
.template-essential .rich-text { margin-top:var(--reference-point); }
.template-essential .experience .rich-text { margin-top:calc(2.5 * var(--reference-point)); }
.template-essential .experience .rich-text p + :is(ul,ol) { margin-top:calc(1.5 * var(--reference-point)); }
.resume-page.template-essential .job + .job { margin-top:var(--essential-work-gap) !important; }
.template-essential .education .rich-text { margin-top:calc(7 * var(--reference-point)); }
.template-essential .projects .essential-entry-subtitle { margin-top:var(--essential-project-subtitle-gap); }
.template-essential .projects .rich-text { margin-top:calc(3.25 * var(--reference-point)); }
.template-essential .projects .rich-text p { margin-top:0; }
.resume-page.template-essential .projects .rich-text > p + p { margin-top:var(--essential-project-paragraph-gap) !important; }
.template-essential .rich-text ul { padding-inline-start:calc(6 * var(--reference-point)); }
.template-essential .rich-text ul > li { padding-inline-start:calc(9.65 * var(--reference-point)); }
.template-essential .rich-text strong { font-weight:700; }
.template-essential .skill-category-label { font-weight:600; }
.template-essential .skills .entry + .entry { margin-top:var(--essential-skill-gap) !important; }
.project-context:empty { display:none; }
.project-table td p+p { margin-top:.35em; }

.accent-role .role,.accent-organizations :is(.employer,.education .entry-subtitle) { color:var(--voice); }
.accent-section-headings { --heading-color:var(--ink-accent); }
.head-badge.accent-role .role { color:#25313a; }
.custom-accent:is(.head-banner,.rail-left,.rail-right) { --side:color-mix(in srgb,var(--ink-accent) 65%,#19212b); }
.custom-accent.head-badge .role,
.custom-accent.head-badge .rail-portrait::before { background:color-mix(in srgb,var(--ink-accent) 18%,var(--paper)); }
.custom-accent.head-badge .rail-portrait::after { background:color-mix(in srgb,var(--ink-accent) 32%,transparent); }

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
