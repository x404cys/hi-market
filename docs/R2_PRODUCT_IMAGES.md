# Cloudflare R2 Product Images

Product image uploads use Cloudflare R2 through its S3-compatible API. The browser requests a short-lived presigned `PUT` URL from `/api/uploads/products/presign`, uploads the file directly to R2, then the product API stores the permanent public CDN URL in `Product.image` and `ProductImage.url`.

## Environment

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
NEXT_PUBLIC_R2_PUBLIC_URL=https://cdn.example.com
```

Only `NEXT_PUBLIC_R2_PUBLIC_URL` is exposed to browser code. The R2 access key and secret must remain server-only.

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

Use a Cloudflare custom domain for production public delivery. Do not use wildcard production origins unless the deployment model explicitly requires it.
