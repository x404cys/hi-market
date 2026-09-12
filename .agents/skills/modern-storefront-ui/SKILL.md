---
name: modern-storefront-ui
description: Improve and review HiMarket customer-facing storefront UI/UX using modern production e-commerce design standards while preserving functionality, branding, RTL Arabic, and mobile-first behavior.
---

# HiMarket Modern Storefront UI/UX Skill

## Purpose

Use this skill whenever creating, redesigning, reviewing, or improving any customer-facing HiMarket storefront interface.

This includes:

- Homepage
- Product cards
- Product grids
- Product details
- Categories
- Offers
- Search
- Cart
- Checkout
- Bottom navigation
- Headers
- Promotional banners
- Empty states
- Filters
- Mobile storefront interactions

This skill is NOT intended for the admin dashboard unless explicitly requested.

---

# Core Principle

The goal is NOT to make the interface merely "pretty".

The goal is to create a storefront that feels like a polished, mature, high-quality modern commerce product.

Prioritize:

1. clarity
2. speed
3. shopping efficiency
4. visual hierarchy
5. consistency
6. mobile usability
7. product discoverability
8. trust
9. restrained visual design

The result should feel intentionally designed by an experienced product designer.

---

# Design Direction

HiMarket is a supermarket / grocery e-commerce store.

The visual language should feel:

- modern
- clean
- commercial
- mature
- lightweight
- practical
- premium without looking luxurious
- friendly without looking childish
- visually calm
- product-focused

The interface must NOT look like:

- an AI-generated landing page
- a generic SaaS dashboard
- a Dribbble concept that is difficult to use
- a crypto website
- a gaming interface
- a glassmorphism showcase
- a template with unnecessary gradients
- a page made entirely from cards

---

# Arabic RTL First

The storefront is primarily Arabic.

Always design RTL-first.

Requirements:

- correct RTL flow
- Arabic typography hierarchy
- correct icon placement
- correct button/icon direction
- natural Arabic spacing
- price layouts readable in Arabic
- horizontal carousels must behave correctly in RTL

Do not simply mirror an English design without considering Arabic reading behavior.

---

# Mobile First

The primary shopping experience is mobile.

Always design mobile first, then enhance tablet and desktop.

Mobile requirements:

- minimum comfortable tap areas
- no tiny icons
- no cramped controls
- no horizontal overflow
- no desktop UI compressed into mobile
- bottom navigation must remain easy to reach
- critical actions should be reachable with one hand
- product cards should remain readable at small widths

Desktop should NOT become an oversized mobile layout.

Use the additional horizontal space intelligently.

---

# Visual Hierarchy

Every screen must have a clear hierarchy.

Users should immediately understand:

1. where they are
2. what they can buy
3. what is important
4. what is discounted
5. what can be tapped
6. how to add an item to cart

Do not give every element the same visual weight.

Use hierarchy through:

- typography
- spacing
- size
- alignment
- restrained color
- grouping
- whitespace

Do not rely on borders around everything.

---

# Spacing System

Use a consistent spacing system.

Prefer Tailwind spacing values rather than random pixel values.

Typical rhythm:

4px
8px
12px
16px
20px
24px
32px
40px
48px

Avoid arbitrary spacing unless necessary.

Related elements should be close together.
Unrelated sections should have stronger separation.

Do not solve layout problems by adding excessive whitespace.

---

# Border Radius

Avoid excessive rounded UI.

Use restrained radii consistently.

Recommended:

small controls:
rounded-md / rounded-lg

cards:
rounded-xl where appropriate

large promotional containers:
rounded-xl or rounded-2xl only when justified

Avoid applying rounded-3xl everywhere.

Do not make every object look like a floating pill.

---

# Shadows

Avoid heavy shadows.

Prefer:

- subtle border
- slight background separation
- minimal shadow when elevation is genuinely needed

Do not use dramatic box shadows on every product card.

Commerce interfaces should feel stable rather than floating.

---

# Colors

Use the existing HiMarket brand palette.

Do not invent new brand colors without explicit instruction.

Use the primary color intentionally for:

- selected state
- primary CTA
- active navigation
- important promotional markers

Do not color every element with the primary color.

Most commerce UI should remain neutral so product imagery gets attention.

---

# Typography

Typography must establish strong hierarchy.

Example hierarchy:

Page title:
strong, compact, not oversized

Section title:
clear and medium weight

Product name:
high readability, limited lines

Metadata:
smaller and quieter

Current price:
high emphasis

Old price:
low emphasis + strikethrough

Avoid giant landing-page headings inside shopping screens.

Do not excessively bold everything.

---

# Homepage

The homepage should help users start shopping immediately.

Preferred structure:

1. compact header
2. search
3. promotional banner
4. categories
5. useful commerce sections
6. product collections
7. bottom navigation on mobile

Examples of useful sections:

- العروض
- الأكثر طلباً
- وصل حديثاً
- أقسام مختارة

Do not add sections simply to make the page longer.

Every section must have a shopping purpose.

---

# Header

Keep the storefront header compact.

Prioritize:

- brand/logo
- search
- cart where appropriate

Avoid unnecessary actions.

On mobile, vertical screen space is valuable.

Do not create a huge header.

---

# Search

Search is a primary commerce action.

It should be:

- immediately recognizable
- easy to tap
- visually prominent without dominating
- properly RTL
- fast to access

Placeholder example:

ابحث عن منتج...

Use a familiar search icon.

Do not hide search behind unnecessary interactions unless there is a strong reason.

---

# Promotional Banner

Promotional banners should support commerce, not dominate the entire viewport.

Prefer:

- clear imagery
- concise messaging
- strong contrast
- simple CTA if required
- responsive crop

Do not overlay unnecessary gradients when the source image already contains the design.

If a banner is image-only, treat the image as the banner itself.

Avoid excessive rounded containers around banners.

---

# Categories

Category browsing should be extremely fast.

Mobile:

Prefer a horizontally scrollable category row when appropriate.

Category item:

- recognizable image
- short label
- comfortable tap target

Do not overcrowd categories with borders and shadows.

Maintain visual consistency between category imagery.

---

# Product Cards

Product cards are one of the most important components.

They must remain simple and product-focused.

A good product card typically contains:

1. image
2. optional badge
3. product name
4. price
5. compare price if applicable
6. add-to-cart interaction

Avoid unnecessary metadata.

Do not display internal database information.

---

# Product Image

Product images should receive significant visual priority.

Requirements:

- consistent aspect ratio
- object-contain when appropriate for packaged supermarket goods
- clean background
- no distortion
- lazy loading where appropriate

Do not crop packaged products aggressively.

---

# Product Name

Product names should remain readable.

Prefer maximum 2 lines.

Use graceful truncation.

Avoid extremely small text.

---

# Prices

Pricing hierarchy must be obvious.

Current price:
strongest

Compare price:
secondary
strikethrough

Discount:
badge or concise label

Example:

2,000 د.ع
2,500 د.ع
خصم 20%

Do not make all three equally prominent.

---

# Discount Badges

Discount badges should be compact and immediately understandable.

Good:

خصم 20%

Avoid:
large decorative badges covering product images.

Never calculate fake discounts.

Use actual backend pricing data.

---

# Add to Cart

Adding a product to cart must feel immediate.

The CTA should be:

- obvious
- touch-friendly
- visually consistent
- accessible

Do not use tiny floating plus buttons if they are difficult to tap.

If quantity controls appear after adding:

[-] 1 [+]

they must remain compact and stable without causing card layout jumps.

---

# Product Grid

Maintain consistent card dimensions.

Typical:

Mobile:
2 columns

Tablet:
3 columns

Desktop:
4–5 columns depending on available width

Do not make desktop product cards unnecessarily huge.

Keep reasonable content width.

---

# Sections

Each homepage section should usually have:

section title
optional "عرض الكل"
content

Example:

العروض عرض الكل

Avoid large decorative section headers.

The products themselves should remain the focus.

---

# Bottom Navigation

Mobile bottom navigation should feel native and stable.

Requirements:

- fixed/sticky where currently intended
- safe-area support
- clear active state
- icon + concise Arabic label
- consistent icon sizes
- cart badge supported
- maximum practical number of items

Avoid excessive animation.

Active state should be clear but restrained.

---

# Offers Page

Offers page should immediately expose discounted products.

Avoid giant hero sections.

Preferred:

عنوان
compact filter/sort controls
products

Users visiting Offers primarily want to browse deals.

---

# Cart

The cart should prioritize:

- products
- quantities
- price
- total
- checkout CTA

Avoid decorative UI that distracts from order completion.

The final total should be obvious.

Checkout action should be clearly dominant.

---

# Checkout

Checkout is a conversion screen.

Keep it extremely focused.

Do not include storefront distractions.

Form fields should be:

- clearly labeled
- large enough
- vertically organized
- easy on mobile
- appropriate input types

Show order summary clearly.

Primary action should be unmistakable.

---

# Empty States

Empty states should be concise.

Example:

لا توجد منتجات حالياً

or:

سلتك فارغة

Provide one useful next action.

Do not use huge illustrations unless explicitly requested.

---

# Filters

On mobile:

Use compact chips for common filters and a Sheet/Drawer for advanced filters when appropriate.

On desktop:

Filters may appear in a compact toolbar or side panel depending on complexity.

Do not permanently consume large screen areas for rarely used controls.

---

# Loading States

Avoid disruptive full-page spinners.

Prefer skeletons matching actual content geometry.

Product skeletons should approximate real product cards.

Prevent layout shifts.

---

# Microinteractions

Use subtle interactions only where useful.

Examples:

- button press feedback
- selected state
- quantity transition
- drawer transition
- cart feedback

Avoid:

- unnecessary floating animation
- excessive spring effects
- large scale transforms
- animations that delay shopping

---

# Iconography

Use the project's existing icon library.

Keep icon visual style consistent.

Avoid mixing different icon families.

Icons must support actions rather than decorate empty space.

---

# Desktop Behavior

Desktop layouts should take advantage of width while maintaining controlled content density.

Use a reasonable max-width.

Do not stretch product cards across the full browser width.

Desktop should feel like a professional commerce website, not a mobile layout enlarged to 1920px.

---

# Avoid Card Overuse

Do NOT wrap every group of information in a card.

A card should indicate meaningful grouping or interaction.

Prefer:

whitespace
alignment
typography
section separation

before adding borders and containers.

---

# Avoid "AI UI"

Actively remove patterns commonly associated with generic AI-generated interfaces:

- random gradients
- purple/blue glow
- excessive glass blur
- huge rounded containers
- gradient text
- too many badges
- unnecessary sparkle icons
- oversized hero text
- excessive shadows
- arbitrary decorative blobs
- every section inside a card
- excessive animations

HiMarket should look like a real production commerce product.

---

# Preserve Existing Functionality

When improving UI, never casually rewrite working business logic.

Preserve:

- cart behavior
- product APIs
- pricing
- inventory
- filters
- category behavior
- checkout
- WhatsApp order flow
- pagination
- backend logic

Separate visual refactoring from business logic changes whenever possible.

---

# Reuse Components

Before creating a new component:

1. inspect existing components
2. determine whether one already solves the problem
3. improve/reuse it where appropriate

Avoid duplicated:

ProductCard
Price
Badge
SectionHeader
CategoryItem
BottomNav
AddToCart controls

Build a coherent storefront design system.

---

# Design Consistency

Before implementing a new page, inspect existing storefront components.

Match:

- typography
- radius
- spacing
- button heights
- icon size
- max-width
- product card dimensions
- colors

When the existing design is inconsistent, normalize it instead of reproducing inconsistencies.

---

# UX Review Workflow

Whenever asked to "improve", "modernize", "redesign", or "make professional":

Do NOT immediately start changing random Tailwind classes.

First audit the current page.

Analyze:

1. visual hierarchy
2. information density
3. spacing
4. typography
5. navigation
6. commerce priorities
7. product card quality
8. mobile behavior
9. desktop behavior
10. interaction states
11. accessibility
12. loading/empty/error states

Then identify the highest-impact problems.

Then implement a coherent improvement.

---

# Implementation Workflow

Before editing:

1. Inspect the relevant page.
2. Inspect shared storefront components.
3. Inspect globals.css and design tokens.
4. Inspect Tailwind conventions.
5. Inspect responsive behavior.
6. Identify reused components.
7. Understand data and interaction requirements.

Then implement.

Do not redesign blindly.

---

# Refactoring Rule

If multiple storefront components use inconsistent values for:

- spacing
- radius
- text sizes
- buttons
- product imagery
- container widths

prefer introducing/reusing shared primitives rather than independently fixing each file.

However:

Do not perform a massive architecture rewrite unless necessary.

---

# Accessibility

Maintain:

- semantic HTML
- keyboard navigation
- visible focus states
- descriptive labels
- adequate contrast
- accessible dialogs/sheets
- appropriate alt text

Do not trade accessibility for aesthetics.

---

# Performance

UI improvements must not degrade storefront performance.

Avoid:

- huge client components
- unnecessary state
- unnecessary JavaScript
- loading all products client-side
- excessive animations
- oversized images
- duplicate API requests

Prefer server components where the current architecture supports them.

Keep client components focused on actual interactions.

---

# Responsive QA

Always review at minimum:

375px mobile
430px large mobile
768px tablet
1024px
1440px desktop

Check:

- overflow
- wrapping
- card sizing
- nav
- banners
- typography
- touch targets
- grid density

---

# Final Self-Review

Before considering a storefront design task complete, ask:

Does this look like a real production supermarket storefront?

Is shopping faster?

Is visual hierarchy clearer?

Did we remove unnecessary UI?

Does it look good without relying on gradients/shadows?

Does mobile feel intentional?

Does desktop feel intentionally designed?

Are the products still the main visual focus?

Is the interface consistent?

Did we preserve business behavior?

If any answer is no, refine the implementation before finishing.

---

# Output Expectations

When performing a major UI improvement:

1. briefly identify the current UX problems
2. state the design approach
3. implement the changes
4. list important changed components
5. report responsive considerations
6. run TypeScript/lint/build where appropriate
7. report any issue that could not be verified

Do not claim the design is improved without actually reviewing the resulting structure.
