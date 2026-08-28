# Supermarket E-Commerce — Schema & Architecture Guide

> This document is intended to be read by Codex together with `schema.prisma` before generating APIs, services, validation, admin features, checkout logic, or database migrations.

## 1. Project Purpose

This project is a **single-supermarket e-commerce store**.

It is **not** a marketplace and it currently has **no customer authentication**.

Customers browse products, add products to a client-side cart, enter their delivery/contact information at checkout, and create an order directly as a guest.

### Core business model

```text
Storefront
   ↓
Browse categories/products
   ↓
Client-side cart
   ↓
Guest checkout
   ↓
Server validates products/prices/stock
   ↓
Server calculates discounts + delivery
   ↓
Order + OrderItems created
   ↓
Stock updated atomically
```

---

## 2. Important Architectural Rules

Codex MUST follow these rules when implementing features.

### 2.1 No customer User model

There is intentionally no `User` or `Customer` table for storefront customers.

Customer information is stored as a snapshot directly on the `Order`:

- `customerName`
- `customerPhone`
- `secondaryPhone`
- delivery address fields
- location coordinates if supplied

Do not introduce authentication or a customer account dependency unless explicitly requested.

---

### 2.2 Cart is not persisted in PostgreSQL

The shopping cart is expected to live on the client, preferably using:

```text
Zustand + LocalStorage
```

The backend MUST NOT trust prices, totals, discounts, delivery fees, or stock values sent by the frontend.

The checkout request should normally contain only identifiers and customer intent, for example:

```json
{
  "customerName": "Ahmed",
  "customerPhone": "07xxxxxxxxx",
  "deliveryZoneId": "...",
  "address": "Baghdad ...",
  "items": [
    {
      "productId": "...",
      "quantity": 2
    }
  ],
  "couponCode": "WELCOME"
}
```

The server must reload products from PostgreSQL and calculate all authoritative values itself.

---

### 2.3 Prisma Decimal must be handled carefully

The schema uses PostgreSQL `Decimal` extensively for money, stock, weight, quantity, latitude, and longitude.

Do not use JavaScript floating point arithmetic for financial calculations when avoidable.

Prefer `Prisma.Decimal` or another safe decimal workflow.

Never silently convert money calculations to imprecise floating point operations.

---

### 2.4 Checkout must be atomic

Creating an order and reducing stock should happen inside a single database transaction.

Conceptually:

```text
prisma.$transaction
   ├── validate products
   ├── validate quantities
   ├── validate stock
   ├── resolve promotions
   ├── resolve coupon
   ├── calculate delivery
   ├── create Order
   ├── create OrderItems
   ├── update Product.stock
   ├── create StockMovement records
   ├── increment Coupon.usedCount when applicable
   └── create OrderStatusHistory
```

If any critical step fails, the full checkout transaction should rollback.

---

## 3. Schema Modules

The current Prisma schema is organized into these domains:

```text
Catalog
├── Category
├── Brand
├── Product
└── ProductImage

Inventory
└── StockMovement

Delivery
└── DeliveryZone

Discounting
├── Coupon
├── Promotion
├── PromotionProduct
└── PromotionCategory

Orders
├── Order
├── OrderItem
└── OrderStatusHistory
```

---

# 4. Catalog Domain

## Category

`Category` supports a hierarchical tree using the self-relation:

```text
Category
   ├── parent
   └── children[]
```

Example:

```text
Drinks
├── Soft Drinks
├── Juices
└── Water
```

Use `parentId = null` for root categories.

Important fields:

- `slug` is unique and intended for storefront URLs.
- `sortOrder` controls display ordering.
- `isActive` controls visibility.
- `image` and `icon` are optional media references.

Products reference exactly one category through `categoryId`.

---

## Brand

Represents supermarket brands/manufacturers.

Examples:

```text
Pepsi
Coca-Cola
Nestlé
Puck
```

Important fields:

- `slug` unique
- `logo` optional
- `isActive`

A product may have no brand.

---

## Product

`Product` is the central sellable catalog entity.

Important groups of fields:

### Identity

```text
name
slug
sku
barcode
```

`slug`, `sku`, and `barcode` have uniqueness constraints where defined.

### Pricing

```text
price
comparePrice
costPrice
```

- `price`: authoritative current selling price.
- `comparePrice`: optional old/reference price for storefront discount display.
- `costPrice`: optional internal cost value; never expose unnecessarily to storefront clients.

### Units

Supported `ProductUnit` values:

```text
PIECE
KG
GRAM
LITER
ML
PACK
BOX
BOTTLE
CAN
```

`unitValue` describes package/unit size.

Examples:

```text
Coca Cola 1.5L
unit      = BOTTLE
unitValue = 1.5

Rice 5KG
unit      = KG
unitValue = 5
```

### Weighted products

`isWeighted = true` is intended for products such as:

- fruit
- vegetables
- meat
- cheese sold by weight

`quantity` is Decimal throughout the order flow to support values such as:

```text
0.250 kg
0.500 kg
1.750 kg
```

### Ordering rules

The fields:

```text
minOrderQty
orderStep
```

must be validated server-side.

Examples:

```text
Normal product:
minOrderQty = 1
orderStep   = 1

Weighted product:
minOrderQty = 0.250
orderStep   = 0.250
```

If `orderStep = 0.250`, quantities such as `0.3` should not be accepted.

### Inventory snapshot

`Product.stock` is the current fast stock snapshot.

It must remain synchronized with `StockMovement` records.

Do not modify stock without recording the corresponding movement when inventory tracking is enabled.

`trackInventory = false` means stock validation may be skipped for that product.

`allowBackorder = true` means checkout may allow the requested quantity to exceed current stock according to business rules.

### Status

`ProductStatus`:

```text
DRAFT
ACTIVE
INACTIVE
OUT_OF_STOCK
ARCHIVED
```

Only sellable product states should appear in customer checkout flows.

At minimum, checkout should normally reject products that are not `ACTIVE`.

---

## ProductImage

Stores additional product gallery images.

`Product.image` can be treated as the primary/cover image.

`ProductImage[]` provides the remaining gallery images.

Use `sortOrder` to control gallery display order.

Images should be stored in an external object-storage service and PostgreSQL should only store their URL/key.

Possible object storage providers include S3-compatible services such as Storj, Cloudflare R2, or Amazon S3.

---

# 5. Inventory Domain

## StockMovement

Every meaningful stock change should create a `StockMovement`.

Supported types:

```text
PURCHASE
SALE
RETURN
DAMAGE
EXPIRED
ADJUSTMENT
CANCELLATION
```

Each movement stores:

```text
quantity
stockBefore
stockAfter
```

This provides a reliable inventory audit trail.

### Quantity convention

Use a consistent sign convention in business logic.

Recommended convention:

```text
PURCHASE      positive
RETURN        positive
CANCELLATION  positive when restoring stock
SALE          negative
DAMAGE        negative
EXPIRED       negative
ADJUSTMENT    positive or negative
```

The `stockAfter` value must always equal the resulting authoritative product stock.

### Order stock flow

Recommended behavior:

```text
Order created/confirmed
      ↓
SALE movement
      ↓
Product.stock decreases

Order cancelled before fulfillment
      ↓
CANCELLATION movement
      ↓
Product.stock restored
```

Do not restore stock twice if a cancelled order has already been restored.

---

# 6. Delivery Domain

## DeliveryZone

Represents delivery areas and pricing rules.

Important fields:

```text
name
governorate
city
fee
freeDeliveryFrom
minimumOrder
estimatedMinutesMin
estimatedMinutesMax
```

Checkout must validate that the selected zone is active.

### Delivery calculation

Conceptually:

```text
if subtotal < minimumOrder
    reject checkout

if freeDeliveryFrom exists
   and eligible subtotal >= freeDeliveryFrom
    deliveryFee = 0
else
    deliveryFee = zone.fee
```

The exact order of coupon/promotion/free-delivery calculations should be centralized in one pricing service rather than duplicated across route handlers.

`Order.deliveryZoneName` is a snapshot so historical orders remain understandable even if the zone is later renamed or deleted.

---

# 7. Coupon Domain

## Coupon

Coupons are explicitly entered by the customer.

Supported types:

```text
PERCENTAGE
FIXED_AMOUNT
FREE_DELIVERY
```

Validate all of the following server-side:

- `isActive`
- `startsAt`
- `endsAt`
- `minimumOrderAmount`
- `usageLimit`
- `usedCount`
- `maximumDiscount`

Coupon codes should be normalized consistently before comparison, e.g. uppercase + trimmed, if the application adopts that convention.

`usedCount` should only increment when checkout succeeds.

---

# 8. Automatic Promotion Domain

## Promotion

Promotions are automatic pricing rules and do not require a coupon code.

Supported promotion types:

```text
PERCENTAGE
FIXED_AMOUNT
FIXED_PRICE
BUY_X_GET_Y
```

Supported scopes:

```text
ALL_PRODUCTS
PRODUCTS
CATEGORIES
```

Relations:

```text
Promotion
├── PromotionProduct[]
└── PromotionCategory[]
```

Use `priority` when multiple promotions are eligible.

Do not invent promotion stacking behavior inside random API handlers.

A centralized promotion engine/service should decide:

- which promotions are eligible
- promotion priority
- whether promotions can stack
- maximum discount
- product-level discount allocation

Until stacking rules are explicitly defined, prefer deterministic behavior and avoid applying multiple conflicting discounts automatically.

---

# 9. Order Domain

## Order

An `Order` is both the transaction record and the immutable snapshot of checkout/customer information.

### Customer snapshot

The order stores guest customer details directly.

Do not create a required `Customer` relation.

### Address snapshot

The following values must remain historical snapshots:

```text
governorate
city
area
street
address
landmark
latitude
longitude
```

Do not make order history depend exclusively on mutable delivery configuration.

### Totals

```text
subtotal
discountTotal
deliveryFee
taxTotal
total
```

Recommended invariant:

```text
total = subtotal - discountTotal + deliveryFee + taxTotal
```

All values must be calculated on the server.

### Coupon snapshot

Both are intentionally stored:

```text
couponId
couponCode
```

`couponId` provides the relation.

`couponCode` preserves the original human-readable coupon identifier for historical orders.

### Order status

```text
PENDING
CONFIRMED
PREPARING
READY
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
```

Every meaningful status transition should also create an `OrderStatusHistory` record.

Recommended transitions:

```text
PENDING
  ↓
CONFIRMED
  ↓
PREPARING
  ↓
READY
  ↓
OUT_FOR_DELIVERY
  ↓
DELIVERED
```

Cancellation may be allowed from selected pre-delivery states.

Do not blindly accept arbitrary transitions from the client.

Use a dedicated order-status service/state machine.

---

## OrderItem

`OrderItem` intentionally stores a **product snapshot**.

Snapshot fields include:

```text
productName
sku
barcode
image
unit
unitValue
unitPrice
```

This is essential.

Historical orders must not change when the corresponding product is later edited, repriced, archived, or deleted.

`productId` is nullable intentionally.

Never replace snapshot fields with live product joins when rendering historical invoice/order data.

### Item total

Recommended invariant:

```text
lineBase = quantity × unitPrice

total = lineBase - discountAmount + taxAmount
```

Use Decimal-safe arithmetic.

---

## OrderStatusHistory

Tracks status changes.

Each transition should record:

```text
fromStatus
toStatus
note
createdAt
```

Use this for admin timeline/history views.

---

# 10. Checkout Implementation Contract

When implementing checkout, Codex should follow this sequence.

## Input validation

Validate request data with a schema validator such as Zod.

Validate:

- customer name
- phone
- address
- delivery zone
- product IDs
- quantities
- coupon code if supplied

Do not accept frontend-computed totals as authoritative values.

## Load products

Fetch all requested products in a single query when possible.

Reject if:

- any product does not exist
- any product is not sellable
- duplicate product IDs are malformed/unexpected
- quantity violates `minOrderQty`
- quantity violates `orderStep`
- inventory is insufficient and backordering is not allowed

## Calculate pricing

Calculate:

```text
base item totals
↓
automatic promotions
↓
coupon
↓
subtotal / discount allocation
↓
delivery rules
↓
tax if applicable
↓
final total
```

Pricing logic should live in reusable services, not directly inside UI components.

## Create snapshots

Before creating the order, construct immutable OrderItem values from current authoritative product data.

## Transaction

Create order, items, stock changes, stock movements, history, and coupon usage in the same transaction.

---

# 11. API / Service Architecture Recommendation

For a Next.js App Router project, prefer domain-oriented modules.

Example:

```text
src/
├── app/
│   └── api/
│       ├── products/
│       ├── categories/
│       ├── checkout/
│       ├── orders/
│       ├── promotions/
│       └── delivery-zones/
│
├── modules/
│   ├── catalog/
│   │   ├── product.service.ts
│   │   ├── product.repository.ts
│   │   └── product.schema.ts
│   │
│   ├── checkout/
│   │   ├── checkout.service.ts
│   │   ├── checkout.schema.ts
│   │   └── pricing.service.ts
│   │
│   ├── inventory/
│   │   └── inventory.service.ts
│   │
│   ├── orders/
│   │   ├── order.service.ts
│   │   └── order-status.service.ts
│   │
│   ├── promotions/
│   │   └── promotion.service.ts
│   │
│   └── delivery/
│       └── delivery.service.ts
│
└── lib/
    ├── prisma.ts
    └── decimal.ts
```

The exact folder structure may differ, but domain logic must remain separated from HTTP handlers.

API route handlers should be thin.

Example responsibility split:

```text
route.ts
   ↓ validates/parses HTTP
checkout.service.ts
   ↓ orchestrates use-case
pricing.service.ts
inventory.service.ts
promotion.service.ts
   ↓
Prisma
```

---

# 12. Storefront Data Rules

When returning catalog data to customers:

Do not expose internal fields unnecessarily, especially:

```text
costPrice
internal admin notes
inventory audit metadata
```

Typical storefront product response may contain:

```text
id
name
slug
image
images
price
comparePrice
unit
unitValue
isWeighted
minOrderQty
orderStep
availability
category
brand
```

Avoid returning raw Prisma models directly from every route. Prefer response DTOs/selects.

---

# 13. Media / Object Storage

Images should not be stored as binary data in PostgreSQL.

The DB stores strings such as public URLs or object keys.

Suggested folders/buckets:

```text
products/
categories/
brands/
banners/
```

When replacing/deleting media, application code should consider cleaning orphaned objects from storage.

---

# 14. Homepage Banner Extension

The storefront requires promotional banners at the top/homepage for discounts and campaigns.

The current `schema.prisma` may not yet contain the `Banner` model. When the banner feature is implemented, use a separate model rather than hardcoding a single banner in application settings.

Recommended model:

```prisma
model Banner {
  id String @id @default(uuid())

  title       String?
  description String?

  image       String
  mobileImage String?

  buttonText String?
  link       String?

  position BannerPosition @default(HERO)
  sortOrder Int           @default(0)

  startsAt DateTime?
  endsAt   DateTime?

  isActive Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([position, isActive, sortOrder])
  @@index([startsAt, endsAt])
}

enum BannerPosition {
  HERO
  HOME_MIDDLE
  HOME_BOTTOM
}
```

Banner behavior:

- `HERO` = main top-of-store carousel/banner.
- `mobileImage` allows a mobile-specific crop/design.
- `startsAt` and `endsAt` allow scheduled campaigns.
- multiple active banners can be rendered as a carousel ordered by `sortOrder`.

Only active banners whose current time is within the configured schedule should be returned to the storefront.

---

# 15. Things Codex Must NOT Do Without Explicit Request

Do not automatically introduce:

- customer accounts
- authentication requirement for checkout
- marketplace/seller models
- multi-store architecture
- product variants
- POS system
- supplier ERP
- warehouse/multi-location inventory
- loyalty points
- complex tax engine

These may be added later, but they are not part of the current core architecture.

Do not redesign the Prisma schema merely because another e-commerce pattern is more common.

Preserve the current business constraints unless a migration/change is explicitly requested.

---

# 16. Future-Compatible Areas

The architecture should remain easy to extend later with:

```text
Banner
Supplier
PurchaseOrder
InventoryBatch / Expiry Date
ProductVariant
DeliverySlot
Driver
PaymentTransaction
Refund
Return
POS
Analytics
Notifications
```

Avoid implementation choices that would block these future additions.

---

# 17. Coding Quality Expectations

Generated code should be production-oriented:

- TypeScript strict-friendly
- clear naming
- Zod validation where useful
- minimal duplication
- server-side authority for all business rules
- Prisma transactions for atomic operations
- Decimal-safe financial calculations
- predictable error handling
- no massive route handlers
- no business logic inside React components
- avoid `any`
- do not query the database repeatedly inside loops when a batch query is possible
- select only needed fields for public endpoints
- indexes in Prisma should be respected when designing queries

---

# 18. Mental Model

The simplest correct mental model for this system is:

```text
PostgreSQL
│
├── Catalog
│   ├── Category
│   ├── Brand
│   └── Product
│
├── Inventory
│   ├── Product.stock
│   └── StockMovement audit trail
│
├── Pricing
│   ├── Product.price
│   ├── Promotion
│   └── Coupon
│
├── Delivery
│   └── DeliveryZone
│
└── Sales
    ├── Order
    ├── OrderItem snapshots
    └── OrderStatusHistory

Object Storage
│
├── product images
├── category images
├── brand logos
└── promotional banners

Browser
│
└── Zustand + LocalStorage cart
```

---

# 19. Final Rule for Codex

Before generating or changing code related to catalog, inventory, checkout, orders, delivery, coupons, promotions, or banners:

1. Read `schema.prisma`.
2. Read this file.
3. Preserve existing relations and business rules.
4. Treat backend values as authoritative.
5. Prefer the simplest production-safe implementation that fits the current architecture.

If implementation requirements conflict with the current schema, explain the conflict and propose the smallest safe schema migration instead of silently changing business behavior.
