# Upload API (Cloudflare Worker + R2)

📌 Overview

This is the backend API for the upload system. It uses a Cloudflare Worker to:

- Authenticate uploads with a shared password.

- Create username “folders” in R2 by prefixing keys with username/.

- Generate presigned upload URLs so clients can upload directly to Cloudflare R2.

The frontend (React app) will use this API later to handle user uploads.

✅ Features

- Password-protected uploads (via UPLOAD_PASSWORD).

- Files organized under username/filename.

- Presigned URL uploads (large files never pass through the Worker).

- Easy to deploy on Cloudflare Workers.

⚙️ Setup

1. Install dependencies

```bash
cd upload-api
npm install
```

1. Configure wrangler.jsonc

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "upload-api",
  "main": "src/index.js",
  "compatibility_date": "2025-09-13",

  "r2_buckets": [
    {
      "binding": "UPLOADS",
      "bucket_name": "private",
      "preview_bucket_name": "private"
    }
  ],

  "vars": {
    "ACCOUNT_ID": "<your-cloudflare-account-id>",
    "BUCKET_NAME": "private"
  }
}
```

1. Local secrets (.dev.vars)

Create `.dev.vars` in the project root:

```env
UPLOAD_PASSWORD=Password
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
```

🧪 Development

Run locally (with live reloading):

```bash
npx wrangler dev --remote
```

Endpoints:

- `POST /get-upload-url` → returns a presigned URL for direct R2 upload.

Example request:

```json
{
  "username": "[username]",
  "password": "UPLOAD_PASSWORD",
  "filename": "filename.txt"
}
```

Example response:

```json
{
  "url": "https://<account>.r2.cloudflarestorage.com/private/[username]/169xxxxx-filenname.txt?...",
  "key": "[username]/169xxxxx-filenname.txt"
}
```

Then perform a `PUT` directly to the `url` given from the respond with the file as the body.

🚀 Deployment

Deploy the Worker to Cloudflare:

```bash
npx wrangler deploy
```

After deployment, map the Worker to your domain (example: `api.example.com`) via Cloudflare dashboard → Worker → Triggers → Custom Domain.

🔒 Notes

Never commit `.dev.vars` to GitHub (add to .gitignore). It's basically a different version of `.env`

Use `wrangler secret put ...` in production to store secrets securely.

Consider adding file size/type validation in the Worker before production use.
