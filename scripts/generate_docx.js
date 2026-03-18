#!/usr/bin/env node
// generate_docx.js — Converts structured SEO audit JSON into a professional .docx report.
// Uses docx-js per the Anthropic docx skill: https://github.com/anthropics/skills/blob/main/skills/docx/SKILL.md
//
// Usage: node generate_docx.js <input.json> <output.docx>

const fs = require("fs");
const { execSync } = require("child_process");

// Resolve the docx module — try local first, then global npm prefix
function resolveDocx() {
  try { return require("docx"); } catch (_) { /* not local */ }
  try {
    const prefix = execSync("npm prefix -g", { encoding: "utf8" }).trim();
    const globalPath = require("path").join(prefix, "lib", "node_modules", "docx");
    return require(globalPath);
  } catch (_) { /* not global */ }
  console.error("Error: 'docx' module not found. Install it with: npm install -g docx");
  process.exit(1);
}

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TableOfContents, ExternalHyperlink,
} = resolveDocx();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_WIDTH = 12240;   // US Letter in DXA
const PAGE_HEIGHT = 15840;
const MARGIN = 1440;        // 1 inch
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN; // 9360

const COLORS = {
  critical: "D32F2F",
  high:     "E65100",
  medium:   "F9A825",
  quick:    "2E7D32",
  working:  "1565C0",
  headerBg: "2C3E50",
  headerFg: "FFFFFF",
  lightGray: "F5F5F5",
  tableBorder: "CCCCCC",
  black: "000000",
};

const FONT = "Arial";

const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function heading(text, level) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: FONT, size: 22, ...opts })],
  });
}

function boldLabel(label, value) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, font: FONT, size: 22 }),
      new TextRun({ text: value, font: FONT, size: 22 }),
    ],
  });
}

function sectionDivider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.tableBorder, space: 1 } },
    children: [],
  });
}

function coloredSectionHeader(text, color) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    shading: { fill: color, type: ShadingType.CLEAR },
    children: [new TextRun({ text: `  ${text}`, bold: true, font: FONT, size: 28, color: COLORS.headerFg })],
  });
}

function issueBlock(issue) {
  const children = [];
  if (issue.title) {
    children.push(new Paragraph({
      spacing: { before: 160, after: 60 },
      children: [new TextRun({ text: issue.title, bold: true, font: FONT, size: 24 })],
    }));
  }
  if (issue.what) children.push(boldLabel("What", issue.what));
  if (issue.fix)  children.push(boldLabel("Fix", issue.fix));
  if (issue.impact) children.push(boldLabel("Impact", issue.impact));
  return children;
}

function makeCell(text, opts = {}) {
  const { bold, shading, width, alignment } = opts;
  return new TableCell({
    borders: cellBorders,
    margins: cellMargins,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({
      alignment: alignment || AlignmentType.LEFT,
      children: [new TextRun({ text: text || "", bold: !!bold, font: FONT, size: 20 })],
    })],
  });
}

function makeHeaderCell(text, width) {
  return makeCell(text, { bold: true, shading: COLORS.headerBg, width });
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildTitlePage(data) {
  return [
    new Paragraph({ spacing: { before: 3000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "SEO AUDIT REPORT", bold: true, font: FONT, size: 48, color: COLORS.headerBg })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new ExternalHyperlink({
        children: [new TextRun({ text: data.url, font: FONT, size: 28, color: COLORS.working, style: "Hyperlink" })],
        link: data.url,
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: `Page Type: ${data.pageType}`, font: FONT, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: `Rendering: ${data.rendering}`, font: FONT, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: `Scope: ${data.auditScope}`, font: FONT, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: `Date: ${data.auditDate}`, font: FONT, size: 24 })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildTOC() {
  return [
    heading("Table of Contents", HeadingLevel.HEADING_1),
    new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildExecutiveSummary(data) {
  if (!data.executiveSummary) return [];
  return [
    heading("Executive Summary", HeadingLevel.HEADING_1),
    bodyText(data.executiveSummary),
    sectionDivider(),
  ];
}

function buildIssueSection(title, issues, color) {
  if (!issues || issues.length === 0) return [];
  const children = [coloredSectionHeader(title, color)];
  issues.forEach(issue => {
    if (typeof issue === "string") {
      children.push(bodyText(issue));
    } else {
      children.push(...issueBlock(issue));
    }
  });
  children.push(sectionDivider());
  return children;
}

function buildWhatsWorking(items) {
  if (!items || items.length === 0) return [];
  const children = [coloredSectionHeader("What's Working", COLORS.working)];
  items.forEach(item => {
    children.push(new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { after: 60 },
      children: [new TextRun({ text: item, font: FONT, size: 22 })],
    }));
  });
  children.push(sectionDivider());
  return children;
}

function buildPageTypeFindings(items) {
  if (!items || items.length === 0) return [];
  const children = [heading("Page-Type-Specific Findings", HeadingLevel.HEADING_1)];
  items.forEach(item => {
    children.push(new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { after: 60 },
      children: [new TextRun({ text: item, font: FONT, size: 22 })],
    }));
  });
  children.push(sectionDivider());
  return children;
}

function buildSchema(schema) {
  if (!schema) return [];
  const children = [heading("Schema Markup", HeadingLevel.HEADING_1)];
  if (schema.checkedVia) children.push(boldLabel("Checked via", schema.checkedVia));
  if (schema.found && schema.found.length > 0)   children.push(boldLabel("Found", schema.found.join(", ")));
  if (schema.missing && schema.missing.length > 0) children.push(boldLabel("Missing", schema.missing.join(", ")));
  if (schema.recommendation) children.push(boldLabel("Recommendation", schema.recommendation));
  children.push(sectionDivider());
  return children;
}

function buildCWV(cwv) {
  if (!cwv) return [];
  const children = [heading("Core Web Vitals", HeadingLevel.HEADING_1)];

  const colWidths = [2340, 3510, 3510]; // Element | Mobile | Desktop

  // Helper to build a CWV table
  const rows = [
    new TableRow({ children: [
      makeHeaderCell("Metric", colWidths[0]),
      makeHeaderCell("Mobile", colWidths[1]),
      makeHeaderCell("Desktop", colWidths[2]),
    ]}),
  ];

  const metrics = ["lcp", "inp", "cls", "fcp", "ttfb"];
  const labels = { lcp: "LCP", inp: "INP", cls: "CLS", fcp: "FCP", ttfb: "TTFB" };

  metrics.forEach(key => {
    const mobileVal  = cwv.mobile  && cwv.mobile[key]  ? cwv.mobile[key]  : "—";
    const desktopVal = cwv.desktop && cwv.desktop[key] ? cwv.desktop[key] : "—";
    rows.push(new TableRow({ children: [
      makeCell(labels[key], { bold: true, width: colWidths[0] }),
      makeCell(mobileVal,  { width: colWidths[1] }),
      makeCell(desktopVal, { width: colWidths[2] }),
    ]}));
  });

  children.push(new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows,
  }));

  if (cwv.topBottleneck) {
    children.push(new Paragraph({ spacing: { before: 120 } }));
    children.push(boldLabel("Top Bottleneck", cwv.topBottleneck));
  }
  children.push(sectionDivider());
  return children;
}

function buildCrawlability(crawl) {
  if (!crawl) return [];
  const children = [heading("Crawlability & Indexation", HeadingLevel.HEADING_1)];
  const fields = [
    ["robots.txt", crawl.robotsTxt],
    ["Sitemap", crawl.sitemap],
    ["Canonical", crawl.canonical],
    ["Indexation", crawl.indexation],
    ["Redirects", crawl.redirects],
  ];
  fields.forEach(([label, value]) => {
    if (value) children.push(boldLabel(label, value));
  });
  children.push(sectionDivider());
  return children;
}

function buildOnPage(items) {
  if (!items || items.length === 0) return [];
  const children = [heading("On-Page Summary", HeadingLevel.HEADING_1)];

  const colWidths = [2000, 5560, 1800]; // Element | Finding | Status

  const rows = [
    new TableRow({ children: [
      makeHeaderCell("Element", colWidths[0]),
      makeHeaderCell("Finding", colWidths[1]),
      makeHeaderCell("Status",  colWidths[2]),
    ]}),
  ];

  items.forEach((item, idx) => {
    const shading = idx % 2 === 1 ? COLORS.lightGray : undefined;
    rows.push(new TableRow({ children: [
      makeCell(item.element, { bold: true, width: colWidths[0], shading }),
      makeCell(item.finding, { width: colWidths[1], shading }),
      makeCell(item.status,  { width: colWidths[2], shading, alignment: AlignmentType.CENTER }),
    ]}));
  });

  children.push(new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows,
  }));
  children.push(sectionDivider());
  return children;
}

function buildNextSteps(steps) {
  if (!steps || steps.length === 0) return [];
  const children = [heading("Next Steps (Priority Order)", HeadingLevel.HEADING_1)];
  steps.forEach(step => {
    children.push(new Paragraph({
      numbering: { reference: "numbers", level: 0 },
      spacing: { after: 60 },
      children: [new TextRun({ text: step, font: FONT, size: 22 })],
    }));
  });
  return children;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node generate_docx.js <input.json> <output.docx>");
    process.exit(1);
  }

  const [inputPath, outputPath] = args;

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: input file not found: ${inputPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  // Assemble all content
  const content = [
    ...buildTitlePage(data),
    ...buildTOC(),
    ...buildExecutiveSummary(data),
    ...buildIssueSection("Critical Issues", data.criticalIssues, COLORS.critical),
    ...buildIssueSection("High Priority", data.highPriority, COLORS.high),
    ...buildIssueSection("Medium Priority", data.mediumPriority, COLORS.medium),
    ...buildIssueSection("Quick Wins", data.quickWins, COLORS.quick),
    ...buildWhatsWorking(data.whatsWorking),
    ...buildPageTypeFindings(data.pageTypeFindings),
    ...buildSchema(data.schema),
    ...buildCWV(data.coreWebVitals),
    ...buildCrawlability(data.crawlability),
    ...buildOnPage(data.onPage),
    ...buildNextSteps(data.nextSteps),
  ];

  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: FONT, color: COLORS.headerBg },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: FONT, color: COLORS.headerBg },
          paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: FONT },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: "numbers",
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.tableBorder, space: 4 } },
            children: [
              new TextRun({ text: `SEO Audit: ${data.url || ""}`, font: FONT, size: 18, color: "888888" }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.tableBorder, space: 4 } },
            children: [
              new TextRun({ text: "Page ", font: FONT, size: 18, color: "888888" }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "888888" }),
            ],
          })],
        }),
      },
      children: content,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ DOCX report generated: ${outputPath}`);
}

main().catch(err => {
  console.error("Error generating DOCX:", err);
  process.exit(1);
});
