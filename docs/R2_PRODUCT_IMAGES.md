# Cloudflare R2 Product Images

Product and banner image uploads use Cloudflare R2 through its S3-compatible API. The browser requests a short-lived presigned `PUT` URL, uploads the file directly to R2, then the API stores the permanent public R2 Development URL in `Product.image`, `ProductImage.url`, `Banner.image`, and `Banner.mobileImage`.

The S3 API endpoint and the public display URL must never be interchanged:

- S3 API endpoint: `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`
- Bucket: `R2_BUCKET_NAME`
- Public display URL: `NEXT_PUBLIC_R2_PUBLIC_URL`

## Environment

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
NEXT_PUBLIC_R2_PUBLIC_URL=https://<public-bucket-id>.r2.dev
```

Only `NEXT_PUBLIC_R2_PUBLIC_URL` is exposed to browser code. The R2 access key and secret must remain server-only.

## Migrating Old URLs

If old database records contain `r2.cloudflarestorage.com` image URLs, run:

```bash
npm run migrate:r2-public-urls
```

The script rewrites product and banner image fields to `NEXT_PUBLIC_R2_PUBLIC_URL`, strips the bucket name from old paths when needed, and does not re-upload or delete existing objects.

## R2 CORS

Configure CORS on the R2 bucket for the admin dashboard origins that need direct browser uploads.

Development origin:

```text
http://localhost:3000
```

Production origin:

```text
https://admin.example.com
```

Recommended bucket CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://admin.example.com"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 300
  }
]
```

For this project, public display uses the Cloudflare R2 Public Development URL (`r2.dev`). Do not use wildcard production origins unless the deployment model explicitly requires it.
