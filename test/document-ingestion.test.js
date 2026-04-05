import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { createApp } from "../src/app.js";
import { ingestDocumentBuffer } from "../src/core/document-ingestion.js";

test("ingestDocumentBuffer extracts supported document families", () => {
  const fixtures = [
    {
      name: "notes.txt",
      mediaType: "text/plain",
      buffer: Buffer.from("TwinTest plain text intake", "utf8"),
      expectedSnippet: "TwinTest plain text intake",
      detectedType: "text"
    },
    {
      name: "table.csv",
      mediaType: "text/csv",
      buffer: Buffer.from("name,value\nlatency,42\nthroughput,88", "utf8"),
      expectedSnippet: "| name | value |",
      detectedType: "csv"
    },
    {
      name: "summary.pdf",
      mediaType: "application/pdf",
      buffer: createPdfBuffer("TwinTest PDF evidence"),
      expectedSnippet: "TwinTest PDF evidence",
      detectedType: "pdf"
    },
    {
      name: "spec.docx",
      mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: createZipArchive({
        "word/document.xml": wrapXml("<w:document><w:body><w:p><w:r><w:t>TwinTest DOCX body</w:t></w:r></w:p></w:body></w:document>")
      }),
      expectedSnippet: "TwinTest DOCX body",
      detectedType: "docx"
    },
    {
      name: "sheet.xlsx",
      mediaType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: createZipArchive({
        "xl/sharedStrings.xml": wrapXml("<sst><si><t>TwinTest XLSX cell</t></si></sst>"),
        "xl/worksheets/sheet1.xml": wrapXml("<worksheet><sheetData><row r=\"1\"><c r=\"A1\" t=\"s\"><v>0</v></c></row></sheetData></worksheet>")
      }),
      expectedSnippet: "TwinTest XLSX cell",
      detectedType: "xlsx"
    },
    {
      name: "deck.pptx",
      mediaType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      buffer: createZipArchive({
        "ppt/slides/slide1.xml": wrapXml("<p:sld><p:cSld><p:spTree><a:t>TwinTest PPTX slide</a:t></p:spTree></p:cSld></p:sld>")
      }),
      expectedSnippet: "TwinTest PPTX slide",
      detectedType: "pptx"
    },
    {
      name: "notes.odt",
      mediaType: "application/vnd.oasis.opendocument.text",
      buffer: createZipArchive({
        "content.xml": wrapXml("<office:document-content><office:body><office:text><text:p>TwinTest ODT narrative</text:p></office:text></office:body></office:document-content>")
      }),
      expectedSnippet: "TwinTest ODT narrative",
      detectedType: "odt"
    },
    {
      name: "legacy.doc",
      mediaType: "application/msword",
      buffer: Buffer.from("\u0000BinaryPrefix TwinTest DOC legacy payload \u0000", "latin1"),
      expectedSnippet: "TwinTest DOC legacy payload",
      detectedType: "doc"
    },
    {
      name: "legacy.xls",
      mediaType: "application/vnd.ms-excel",
      buffer: Buffer.from("\u0000BinaryPrefix TwinTest XLS legacy payload \u0000", "latin1"),
      expectedSnippet: "TwinTest XLS legacy payload",
      detectedType: "xls"
    },
    {
      name: "legacy.ppt",
      mediaType: "application/vnd.ms-powerpoint",
      buffer: Buffer.from("\u0000BinaryPrefix TwinTest PPT legacy payload \u0000", "latin1"),
      expectedSnippet: "TwinTest PPT legacy payload",
      detectedType: "ppt"
    }
  ];

  for (const fixture of fixtures) {
    const result = ingestDocumentBuffer({
      name: fixture.name,
      mediaType: fixture.mediaType,
      requestedFormat: "markdown",
      buffer: fixture.buffer
    });

    assert.equal(result.format, "markdown");
    assert.equal(result.metadata.detectedType, fixture.detectedType);
    assert.match(result.content, new RegExp(escapeRegExp(fixture.expectedSnippet), "i"));
  }
});

test("TwinTest imports multi-format artifacts into compilable documents", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", `ingestion-${Date.now()}`);
  const dataFilePath = path.join(tempDir, "store.json");
  await mkdir(tempDir, { recursive: true });

  const { server } = await createApp({
    apiKey: "ingestion-key",
    dataFilePath,
    runDelayMs: 5
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": "ingestion-key",
    "x-workspace-id": "ingestion-lab"
  };

  try {
    let response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Universal Intake Project",
        description: "Validate document ingestion across supported source families."
      })
    });

    assert.equal(response.status, 201);
    const projectPayload = await response.json();
    const projectId = projectPayload.project.id;

    const imports = [
      {
        name: "evidence.pdf",
        mediaType: "application/pdf",
        buffer: createPdfBuffer("PDF workflow evidence"),
        expectedSnippet: "PDF workflow evidence",
        detectedType: "pdf"
      },
      {
        name: "brief.docx",
        mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: createZipArchive({
          "word/document.xml": wrapXml("<w:document><w:body><w:p><w:r><w:t>DOCX intake brief</w:t></w:r></w:p></w:body></w:document>")
        }),
        expectedSnippet: "DOCX intake brief",
        detectedType: "docx"
      },
      {
        name: "metrics.xlsx",
        mediaType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: createZipArchive({
          "xl/sharedStrings.xml": wrapXml("<sst><si><t>XLSX throughput metric</t></si></sst>"),
          "xl/worksheets/sheet1.xml": wrapXml("<worksheet><sheetData><row r=\"1\"><c r=\"A1\" t=\"s\"><v>0</v></c></row></sheetData></worksheet>")
        }),
        expectedSnippet: "XLSX throughput metric",
        detectedType: "xlsx"
      },
      {
        name: "notes.odt",
        mediaType: "application/vnd.oasis.opendocument.text",
        buffer: createZipArchive({
          "content.xml": wrapXml("<office:document-content><office:body><office:text><text:p>ODT project note</text:p></office:text></office:body></office:document-content>")
        }),
        expectedSnippet: "ODT project note",
        detectedType: "odt"
      },
      {
        name: "legacy.doc",
        mediaType: "application/msword",
        buffer: Buffer.from("\u0000Legacy DOC planner note\u0000", "latin1"),
        expectedSnippet: "Legacy DOC planner note",
        detectedType: "doc"
      },
      {
        name: "legacy.xls",
        mediaType: "application/vnd.ms-excel",
        buffer: Buffer.from("\u0000Legacy XLS metric trail\u0000", "latin1"),
        expectedSnippet: "Legacy XLS metric trail",
        detectedType: "xls"
      },
      {
        name: "notes.txt",
        mediaType: "text/plain",
        buffer: Buffer.from("TXT operational note", "utf8"),
        expectedSnippet: "TXT operational note",
        detectedType: "text"
      }
    ];

    for (const artifact of imports) {
      response = await fetch(`${baseUrl}/projects/${projectId}/documents/import-artifact`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: artifact.name,
          format: "markdown",
          mediaType: artifact.mediaType,
          contentBase64: artifact.buffer.toString("base64"),
          metadata: {
            source: "ingestion-test"
          }
        })
      });

      assert.equal(response.status, 201);
      const payload = await response.json();
      assert.match(payload.document.content, new RegExp(escapeRegExp(artifact.expectedSnippet), "i"));
      assert.equal(payload.document.metadata.ingestion.detectedType, artifact.detectedType);
      assert.equal(payload.document.metadata.ingestion.extractionMethod, artifact.detectedType === "text" ? "direct_decode" : "structured_ingestion");
    }

    response = await fetch(`${baseUrl}/projects/${projectId}/compile`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        systemName: "Universal Intake System"
      })
    });

    assert.equal(response.status, 202);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

function createPdfBuffer(text) {
  const pdf = [
    "%PDF-1.4",
    "1 0 obj",
    "<< /Length 44 >>",
    "stream",
    "BT",
    "/F1 12 Tf",
    "72 720 Td",
    `(${text}) Tj`,
    "ET",
    "endstream",
    "endobj",
    "trailer",
    "<<>>",
    "%%EOF"
  ].join("\n");

  return Buffer.from(pdf, "latin1");
}

function createZipArchive(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  let entryCount = 0;

  for (const [name, value] of Object.entries(entries)) {
    const fileName = Buffer.from(name, "utf8");
    const content = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(0, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const localRecord = Buffer.concat([localHeader, fileName, content]);
    localParts.push(localRecord);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(0, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(Buffer.concat([centralHeader, fileName]));
    offset += localRecord.length;
    entryCount += 1;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localDirectory = Buffer.concat(localParts);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(entryCount, 8);
  endOfCentralDirectory.writeUInt16LE(entryCount, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDirectory.writeUInt32LE(localDirectory.length, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  return Buffer.concat([localDirectory, centralDirectory, endOfCentralDirectory]);
}

function wrapXml(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>${content}`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
