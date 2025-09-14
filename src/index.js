import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // === Generate Presigned Upload URL ===
    if (url.pathname === "/get-upload-url" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Bad JSON" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin },
        });
      }

      const { username, password, filename } = body || {};

      if (!username || !password || !filename) {
        return new Response(JSON.stringify({ error: "username, password, filename required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin },
        });
      }

      if (password !== env.UPLOAD_PASSWORD) {
        return new Response(JSON.stringify({ error: "Invalid password" }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin },
        });
      }

      const prefix = `${username}/`;
      const key = `${prefix}${Date.now()}-${filename}`;

      // Create S3 client (R2 uses S3 API)
      const client = new S3Client({
        region: "auto",
        endpoint: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      });

      // Command for uploading this file
      const command = new PutObjectCommand({
        Bucket: env.BUCKET_NAME,
        Key: key,
      });

      // Generate presigned URL (valid for 1 hour)
      const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

      return new Response(JSON.stringify({ url: signedUrl, key }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin },
      });
    }

    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": origin },
    });
  },
};
