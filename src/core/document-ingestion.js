import path from "node:path";
import { inflateRawSync } from "node:zlib";

export function ingestDocumentBuffer({
  name,
  mediaType = "",
  requestedFormat = "",
  buffer,
  encoding = "utf8"
}) {
  const detectedType = detectDocumentType({
    name,
    mediaType,
    requestedFormat
  });

  switch (detectedType) {
    case "text":
    case "markdown":
    case "json":
    case "yaml":
    case "xml":
    case "html":
      return buildTextResult({
        detectedType,
        requestedFormat,
        content: decodeBuffer(buffer, encoding)
      });
    case "csv":
    case "tsv":
      return buildStructuredResult({
        detectedType,
        requestedFormat,
        content: renderDelimitedText(decodeBuffer(buffer, encoding), detectedType === "tsv" ? "\t" : ",")
      });
    case "pdf":
      return buildStructuredResult({
        detectedType,
        requestedFormat,
        content: extractPdfText(buffer)
      });
    case "docx":
      return buildStructuredResult({
        detectedType,
        requestedFormat,
        content: extractDocxText(buffer)
      });
    case "xlsx":
      return buildStructuredResult({
        detectedType,
        requestedFormat,
        content: extractXlsxText(buffer)
      });
    case "pptx":
      return buildStructuredResult({
        detectedType,
        requestedFormat,
        content: extractPresentationText(buffer, "pptx")
      });
    case "odt":
    case "ods":
    case "odp":
      return buildStructuredResult({
        detectedType,
        requestedFormat,
        content: extractOpenDocumentText(buffer)
      });
    case "doc":
    case "xls":
    case "ppt":
      return buildStructuredResult({
        detectedType,
        requestedFormat,
        content: extractBinaryStrings(buffer)
      });
    default:
      return buildStructuredResult({
        detectedType,
        requestedFormat,
        content: extractBinaryStrings(buffer)
      });
  }
}

function buildTextResult({ detectedType, requestedFormat, content }) {
  return {
    format: requestedFormat || (detectedType === "markdown" ? "markdown" : "text"),
    content: normalizeExtractedText(content),
    metadata: {
      detectedType,
      extractionMethod: "direct_decode"
    }
  };
}

function buildStructuredResult({ detectedType, requestedFormat, content }) {
  const normalizedContent = normalizeExtractedText(content);

  if (!normalizedContent) {
    throw new Error(`No extractable text found for ${detectedType}.`);
  }

  return {
    format: requestedFormat || "markdown",
    content: normalizedContent,
    metadata: {
      detectedType,
      extractionMethod: "structured_ingestion"
    }
  };
}

function detectDocumentType({ name, mediaType, requestedFormat }) {
  const normalizedRequested = String(requestedFormat || "").trim().toLowerCase();
  const extension = path.extname(String(name || "").trim()).toLowerCase();
  const normalizedMediaType = String(mediaType || "").trim().toLowerCase();
  const requestedType = {
    text: "text",
    txt: "text",
    markdown: "markdown",
    md: "markdown",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    html: "html",
    htm: "html",
    csv: "csv",
    tsv: "tsv",
    pdf: "pdf",
    docx: "docx",
    xlsx: "xlsx",
    pptx: "pptx",
    odt: "odt",
    ods: "ods",
    odp: "odp",
    doc: "doc",
    xls: "xls",
    ppt: "ppt"
  }[normalizedRequested] || "";

  const byExtension = {
    ".txt": "text",
    ".log": "text",
    ".md": "markdown",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".xml": "xml",
    ".html": "html",
    ".htm": "html",
    ".csv": "csv",
    ".tsv": "tsv",
    ".pdf": "pdf",
    ".docx": "docx",
    ".xlsx": "xlsx",
    ".pptx": "pptx",
    ".odt": "odt",
    ".ods": "ods",
    ".odp": "odp",
    ".doc": "doc",
    ".xls": "xls",
    ".ppt": "ppt"
  };

  if (byExtension[extension]) {
    return byExtension[extension];
  }

  if (normalizedMediaType.startsWith("text/")) {
    if (normalizedMediaType === "text/csv") {
      return "csv";
    }

    if (normalizedMediaType === "text/tab-separated-values") {
      return "tsv";
    }

    if (normalizedMediaType === "text/xml") {
      return "xml";
    }

    if (normalizedMediaType === "text/html") {
      return "html";
    }

    if (normalizedMediaType === "text/yaml") {
      return "yaml";
    }

    return normalizedMediaType.includes("markdown") ? "markdown" : "text";
  }

  if (normalizedMediaType === "application/json") {
    return "json";
  }

  if (normalizedMediaType === "application/xml") {
    return "xml";
  }

  if (normalizedMediaType === "application/yaml" || normalizedMediaType === "application/x-yaml") {
    return "yaml";
  }

  if (normalizedMediaType === "application/pdf") {
    return "pdf";
  }

  if (normalizedMediaType.includes("wordprocessingml")) {
    return "docx";
  }

  if (normalizedMediaType.includes("spreadsheetml")) {
    return "xlsx";
  }

  if (normalizedMediaType.includes("presentationml")) {
    return "pptx";
  }

  if (normalizedMediaType === "application/vnd.oasis.opendocument.text") {
    return "odt";
  }

  if (normalizedMediaType === "application/vnd.oasis.opendocument.spreadsheet") {
    return "ods";
  }

  if (normalizedMediaType === "application/vnd.oasis.opendocument.presentation") {
    return "odp";
  }

  if (normalizedMediaType === "application/msword") {
    return "doc";
  }

  if (normalizedMediaType === "application/vnd.ms-excel") {
    return "xls";
  }

  if (normalizedMediaType === "application/vnd.ms-powerpoint") {
    return "ppt";
  }

  if (requestedType) {
    return requestedType;
  }

  return "binary";
}

function decodeBuffer(buffer, encoding) {
  return Buffer.from(buffer).toString(encoding || "utf8");
}

function renderDelimitedText(source, delimiter) {
  const lines = source.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (!lines.length) {
    return "";
  }

  const rows = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
  const [header, ...body] = rows;
  const markdownTable = [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...body.map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");

  return `# Tabular Extract\n\n${markdownTable}`;
}

function extractDocxText(buffer) {
  const entries = readZipEntries(buffer);
  const relevantParts = Object.entries(entries)
    .filter(([name]) => name.startsWith("word/") && name.endsWith(".xml"))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, content]) => extractWordprocessingXmlText(content))
    .filter(Boolean);

  return `# DOCX Extract\n\n${relevantParts.join("\n\n")}`;
}

function extractXlsxText(buffer) {
  const entries = readZipEntries(buffer);
  const sharedStringsXml = entries["xl/sharedStrings.xml"];
  const sharedStrings = sharedStringsXml
    ? [...sharedStringsXml.toString("utf8").matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXmlEntities(match[1]))
    : [];
  const sheets = Object.entries(entries)
    .filter(([name]) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, content], index) => extractSpreadsheetSheet(content.toString("utf8"), sharedStrings, index + 1));

  return `# XLSX Extract\n\n${sheets.join("\n\n")}`;
}

function extractPresentationText(buffer, label) {
  const entries = readZipEntries(buffer);
  const slides = Object.entries(entries)
    .filter(([name]) => name.includes("/slides/slide") && name.endsWith(".xml"))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, content], index) => `## Slide ${index + 1}\n${extractXmlText(content.toString("utf8"))}`)
    .filter(Boolean);

  return `# ${label.toUpperCase()} Extract\n\n${slides.join("\n\n")}`;
}

function extractOpenDocumentText(buffer) {
  const entries = readZipEntries(buffer);
  const contentXml = entries["content.xml"];
  return `# OpenDocument Extract\n\n${contentXml ? extractXmlText(contentXml.toString("utf8")) : ""}`;
}

function extractPdfText(buffer) {
  const source = Buffer.from(buffer).toString("latin1");
  const streamMatches = [...source.matchAll(/<<(.*?)>>\s*stream\r?\n([\s\S]*?)endstream/gs)];
  const extracted = [];

  for (const match of streamMatches) {
    const dictionary = match[1] || "";
    let streamBuffer = Buffer.from(match[2] || "", "latin1");

    if (dictionary.includes("/FlateDecode")) {
      try {
        streamBuffer = inflateRawSync(streamBuffer);
      } catch {
        continue;
      }
    }

    const streamText = streamBuffer.toString("latin1");
    extracted.push(...extractPdfStreamStrings(streamText));
  }

  return `# PDF Extract\n\n${normalizeExtractedText(extracted.join("\n"))}`;
}

function extractPdfStreamStrings(streamText) {
  const strings = [];

  for (const match of streamText.matchAll(/\(([^()]*(?:\\.[^()]*)*)\)\s*Tj/g)) {
    strings.push(decodePdfLiteral(match[1]));
  }

  for (const match of streamText.matchAll(/\[(.*?)\]\s*TJ/gs)) {
    const chunks = [...match[1].matchAll(/\(([^()]*(?:\\.[^()]*)*)\)/g)].map((item) => decodePdfLiteral(item[1]));
    strings.push(chunks.join(""));
  }

  for (const match of streamText.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
    strings.push(Buffer.from(match[1], "hex").toString("utf8"));
  }

  return strings.filter(Boolean);
}

function decodePdfLiteral(value) {
  return String(value || "")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

function extractBinaryStrings(buffer) {
  const text = Buffer.from(buffer).toString("latin1");
  const matches = text.match(/[\x20-\x7E]{4,}/g) || [];
  return `# Binary Text Extract\n\n${matches.join("\n")}`;
}

function extractWordprocessingXmlText(content) {
  return normalizeExtractedText(
    content.toString("utf8")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<w:br\/>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\r/g, "")
  );
}

function extractSpreadsheetSheet(xml, sharedStrings, index) {
  const rows = [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const cells = [...rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)].map((cellMatch) => {
      const cellAttributes = cellMatch[1] || "";
      const valueMatch = cellMatch[2].match(/<v>([\s\S]*?)<\/v>/);
      const rawValue = valueMatch ? valueMatch[1] : "";

      if (cellAttributes.includes('t="s"')) {
        return sharedStrings[Number(rawValue)] || "";
      }

      return decodeXmlEntities(rawValue);
    });

    return cells.join(" | ");
  });

  return `## Sheet ${index}\n${rows.join("\n")}`;
}

function extractXmlText(xml) {
  return normalizeExtractedText(
    String(xml || "")
      .replace(/<\/(p|div|tr|text:p|table:table-row)>/g, "\n")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]+>/g, " ")
  );
}

function readZipEntries(buffer) {
  const archive = Buffer.from(buffer);
  const eocdOffset = findEocdOffset(archive);

  if (eocdOffset === -1) {
    throw new Error("Unsupported ZIP container.");
  }

  const totalEntries = archive.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = archive.readUInt32LE(eocdOffset + 16);
  const entries = {};
  let cursor = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (archive.readUInt32LE(cursor) !== 0x02014b50) {
      break;
    }

    const compressionMethod = archive.readUInt16LE(cursor + 10);
    const compressedSize = archive.readUInt32LE(cursor + 20);
    const fileNameLength = archive.readUInt16LE(cursor + 28);
    const extraLength = archive.readUInt16LE(cursor + 30);
    const commentLength = archive.readUInt16LE(cursor + 32);
    const localHeaderOffset = archive.readUInt32LE(cursor + 42);
    const fileName = archive.slice(cursor + 46, cursor + 46 + fileNameLength).toString("utf8");
    const localFileNameLength = archive.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = archive.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressedData = archive.slice(dataStart, dataStart + compressedSize);

    entries[fileName] = compressionMethod === 0 ? compressedData : inflateRawSync(compressedData);
    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEocdOffset(buffer) {
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65557); index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      return index;
    }
  }

  return -1;
}

function decodeXmlEntities(value) {
  return String(value || "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'");
}

function normalizeExtractedText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
