import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createId, slugify } from "./id.js";

export class LocalArtifactStore {
  constructor(rootDir) {
    this.kind = "local_filesystem";
    this.rootDir = path.resolve(rootDir);
    this.ready = null;
  }

  async initialize() {
    if (this.ready) {
      return this.ready;
    }

    this.ready = mkdir(this.rootDir, { recursive: true }).then(() => this.rootDir);
    return this.ready;
  }

  async writeArtifact({
    workspaceId,
    projectId = "",
    runId = "",
    reportId = "",
    name,
    mediaType = "application/octet-stream",
    kind = "project_attachment",
    content,
    metadata = {},
    createdBy = "system"
  }) {
    await this.initialize();

    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const artifactId = createId("artifact");
    const fileName = buildStoredFileName(artifactId, name);
    const relativePath = path.join(
      sanitizePathSegment(workspaceId),
      sanitizePathSegment(projectId || "workspace"),
      fileName
    );
    const absolutePath = path.join(this.rootDir, relativePath);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    return {
      id: artifactId,
      workspaceId,
      projectId: projectId || null,
      runId: runId || null,
      reportId: reportId || null,
      name: String(name || "artifact.bin").trim() || "artifact.bin",
      mediaType: mediaType || "application/octet-stream",
      kind,
      metadata: structuredClone(metadata),
      createdAt: new Date().toISOString(),
      createdBy,
      byteLength: buffer.byteLength,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      storageBackend: this.kind,
      storagePath: relativePath.replaceAll("\\", "/")
    };
  }

  async readArtifactContent(artifact) {
    await this.initialize();
    const absolutePath = path.join(this.rootDir, artifact.storagePath);
    return readFile(absolutePath);
  }

  describe() {
    return {
      backend: this.kind,
      availableBackends: ["local_filesystem", "s3_layout_filesystem", "remote_http_object_store"],
      bucket: null,
      publicBaseUrlConfigured: false
    };
  }
}

export class S3LayoutFilesystemArtifactStore {
  constructor({ rootDir, bucket = "twintest-artifacts", publicBaseUrl = "" }) {
    this.kind = "s3_layout_filesystem";
    this.rootDir = path.resolve(rootDir);
    this.bucket = sanitizePathSegment(bucket);
    this.publicBaseUrl = String(publicBaseUrl || "").trim().replace(/\/+$/, "");
    this.ready = null;
  }

  async initialize() {
    if (this.ready) {
      return this.ready;
    }

    this.ready = mkdir(path.join(this.rootDir, this.bucket), { recursive: true }).then(() => this.rootDir);
    return this.ready;
  }

  async writeArtifact({
    workspaceId,
    projectId = "",
    runId = "",
    reportId = "",
    name,
    mediaType = "application/octet-stream",
    kind = "project_attachment",
    content,
    metadata = {},
    createdBy = "system"
  }) {
    await this.initialize();

    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const artifactId = createId("artifact");
    const fileName = buildStoredFileName(artifactId, name);
    const objectKey = [
      sanitizePathSegment(workspaceId),
      sanitizePathSegment(projectId || "workspace"),
      new Date().toISOString().slice(0, 10),
      fileName
    ].join("/");
    const storagePath = `${this.bucket}/${objectKey}`;
    const absolutePath = path.join(this.rootDir, this.bucket, ...objectKey.split("/"));

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    return {
      id: artifactId,
      workspaceId,
      projectId: projectId || null,
      runId: runId || null,
      reportId: reportId || null,
      name: String(name || "artifact.bin").trim() || "artifact.bin",
      mediaType: mediaType || "application/octet-stream",
      kind,
      metadata: structuredClone(metadata),
      createdAt: new Date().toISOString(),
      createdBy,
      byteLength: buffer.byteLength,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      storageBackend: this.kind,
      storagePath,
      bucket: this.bucket,
      objectKey,
      objectUrl: this.publicBaseUrl ? `${this.publicBaseUrl}/${storagePath}` : null
    };
  }

  async readArtifactContent(artifact) {
    await this.initialize();
    const absolutePath = path.join(this.rootDir, ...String(artifact.storagePath || "").split("/"));
    return readFile(absolutePath);
  }

  describe() {
    return {
      backend: this.kind,
      availableBackends: ["local_filesystem", "s3_layout_filesystem", "remote_http_object_store"],
      bucket: this.bucket,
      publicBaseUrlConfigured: Boolean(this.publicBaseUrl)
    };
  }
}

export class RemoteHttpArtifactStore {
  constructor({
    baseUrl,
    apiKey = "",
    bucket = "twintest-artifacts",
    publicBaseUrl = "",
    fetchImpl = globalThis.fetch
  }) {
    this.kind = "remote_http_object_store";
    this.baseUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
    this.apiKey = String(apiKey || "").trim();
    this.bucket = sanitizePathSegment(bucket);
    this.publicBaseUrl = String(publicBaseUrl || "").trim().replace(/\/+$/, "");
    this.fetchImpl = fetchImpl;
  }

  async initialize() {
    if (!this.baseUrl) {
      throw new Error("remote_http_object_store requires TWINTEST_ARTIFACT_REMOTE_BASE_URL.");
    }

    if (typeof this.fetchImpl !== "function") {
      throw new Error("remote_http_object_store requires a fetch implementation.");
    }

    return this.baseUrl;
  }

  async writeArtifact({
    workspaceId,
    projectId = "",
    runId = "",
    reportId = "",
    name,
    mediaType = "application/octet-stream",
    kind = "project_attachment",
    content,
    metadata = {},
    createdBy = "system"
  }) {
    await this.initialize();

    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const artifactId = createId("artifact");
    const fileName = buildStoredFileName(artifactId, name);
    const objectKey = [
      sanitizePathSegment(workspaceId),
      sanitizePathSegment(projectId || "workspace"),
      new Date().toISOString().slice(0, 10),
      fileName
    ].join("/");
    const storagePath = `${this.bucket}/${objectKey}`;
    const response = await this.fetchImpl(`${this.baseUrl}/objects/${encodeStoragePath(storagePath)}`, {
      method: "PUT",
      headers: compactHeaders({
        authorization: this.apiKey ? `Bearer ${this.apiKey}` : "",
        "content-type": mediaType,
        "x-twintest-artifact-name": String(name || "artifact.bin"),
        "x-twintest-artifact-kind": kind,
        "x-twintest-workspace-id": workspaceId,
        "x-twintest-project-id": projectId
      }),
      body: buffer
    });

    if (!response?.ok) {
      throw new Error(`Remote artifact store write failed with status ${response?.status || "unknown"}.`);
    }

    let responsePayload = {};

    try {
      responsePayload = await response.json();
    } catch {
      responsePayload = {};
    }

    return {
      id: artifactId,
      workspaceId,
      projectId: projectId || null,
      runId: runId || null,
      reportId: reportId || null,
      name: String(name || "artifact.bin").trim() || "artifact.bin",
      mediaType: mediaType || "application/octet-stream",
      kind,
      metadata: structuredClone(metadata),
      createdAt: new Date().toISOString(),
      createdBy,
      byteLength: buffer.byteLength,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      storageBackend: this.kind,
      storagePath,
      bucket: this.bucket,
      objectKey,
      objectUrl: responsePayload.objectUrl || (this.publicBaseUrl ? `${this.publicBaseUrl}/${storagePath}` : null)
    };
  }

  async readArtifactContent(artifact) {
    await this.initialize();
    const response = await this.fetchImpl(`${this.baseUrl}/objects/${encodeStoragePath(artifact.storagePath)}`, {
      method: "GET",
      headers: compactHeaders({
        authorization: this.apiKey ? `Bearer ${this.apiKey}` : ""
      })
    });

    if (!response?.ok) {
      throw new Error(`Remote artifact store read failed with status ${response?.status || "unknown"}.`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  describe() {
    return {
      backend: this.kind,
      availableBackends: ["local_filesystem", "s3_layout_filesystem", "remote_http_object_store"],
      bucket: this.bucket,
      publicBaseUrlConfigured: Boolean(this.publicBaseUrl),
      remoteConfigured: Boolean(this.baseUrl),
      apiKeyConfigured: Boolean(this.apiKey)
    };
  }
}

export function createArtifactStore({
  backend = "local_filesystem",
  rootDir,
  bucket,
  publicBaseUrl,
  remoteBaseUrl,
  apiKey,
  fetchImpl
} = {}) {
  const normalizedBackend = String(backend || "local_filesystem").trim().toLowerCase();

  if (normalizedBackend === "remote_http_object_store") {
    return new RemoteHttpArtifactStore({
      baseUrl: remoteBaseUrl,
      apiKey,
      bucket,
      publicBaseUrl,
      fetchImpl
    });
  }

  if (normalizedBackend === "s3_layout_filesystem") {
    return new S3LayoutFilesystemArtifactStore({
      rootDir,
      bucket,
      publicBaseUrl
    });
  }

  return new LocalArtifactStore(rootDir);
}

function buildStoredFileName(artifactId, originalName) {
  const trimmed = String(originalName || "").trim();
  const extension = path.extname(trimmed).slice(0, 16);
  const baseName = path.basename(trimmed, extension);
  const slug = slugify(baseName).slice(0, 48) || "artifact";
  return `${artifactId}__${slug}${extension}`;
}

function sanitizePathSegment(value) {
  return slugify(value).slice(0, 48) || "root";
}

function compactHeaders(headers) {
  return Object.fromEntries(Object.entries(headers).filter(([, value]) => String(value || "").length > 0));
}

function encodeStoragePath(storagePath) {
  return String(storagePath || "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
