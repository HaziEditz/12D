// Object Storage Service using Replit's native object storage HTTP API
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const PRIVATE_OBJECT_DIR = process.env.PRIVATE_OBJECT_DIR || "";
const DEFAULT_BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

async function getSignedUrl(
  bucketName: string,
  objectName: string,
  method: "GET" | "PUT" | "DELETE" | "HEAD",
  ttlSec: number
): Promise<string> {
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: bucketName,
        object_name: objectName,
        method,
        expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to sign object URL: ${response.status}`);
  }
  const { signed_url } = await response.json();
  return signed_url;
}

function parseStoragePath(fullPath: string): { bucketName: string; objectName: string } {
  // fullPath like: /bucket-name/path/to/object
  const normalized = fullPath.startsWith("/") ? fullPath.slice(1) : fullPath;
  const slash = normalized.indexOf("/");
  if (slash === -1) return { bucketName: normalized, objectName: "" };
  return { bucketName: normalized.slice(0, slash), objectName: normalized.slice(slash + 1) };
}

export class ObjectStorageService {
  constructor() {}

  async downloadObject(objectKey: string, res: Response, cacheTtlSec: number = 3600) {
    try {
      const { bucketName, objectName } = parseStoragePath(objectKey);
      const signedUrl = await getSignedUrl(bucketName, objectName, "GET", 900);

      const upstream = await fetch(signedUrl);
      if (!upstream.ok) {
        if (upstream.status === 404) throw new ObjectNotFoundError();
        res.status(502).json({ error: "Failed to fetch object" });
        return;
      }

      const contentType = upstream.headers.get("content-type") || "application/octet-stream";
      const contentLength = upstream.headers.get("content-length");

      res.set({
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
      });

      const buffer = await upstream.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      if (error instanceof ObjectNotFoundError) throw error;
      console.error("Error downloading object:", error);
      if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
    }
  }

  async getObjectEntityUploadURL(): Promise<{ uploadURL: string; objectPath: string }> {
    if (!PRIVATE_OBJECT_DIR) {
      throw new Error("PRIVATE_OBJECT_DIR not configured. Set up Replit Object Storage.");
    }
    const { bucketName, objectName: dir } = parseStoragePath(PRIVATE_OBJECT_DIR);
    const objectId = randomUUID();
    const objectName = dir ? `${dir}/uploads/${objectId}` : `uploads/${objectId}`;

    const signedUrl = await getSignedUrl(bucketName, objectName, "PUT", 900);
    const objectPath = `/objects/${bucketName}/${objectName}`;
    return { uploadURL: signedUrl, objectPath };
  }

  async getObjectKey(objectPath: string): Promise<string> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    // Strip /objects/ prefix to get full storage path
    return objectPath.slice("/objects/".length - 1); // keep leading /
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }
    // Handle GCS-style signed URL or direct GCS URLs
    try {
      const url = new URL(rawPath);
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        return `/objects/${pathParts.join("/")}`;
      }
    } catch {
      // Not a URL
    }
    if (rawPath.startsWith("uploads/")) {
      return `/objects/${rawPath}`;
    }
    return rawPath;
  }
}
