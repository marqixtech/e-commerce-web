# MARQIX SHOPPING MALL

A full-stack e-commerce web app.

- **Frontend:** React
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Supabase)
- **Auth:** JWT + bcrypt

## Project structure

```
ecommerce/
├── client/           React frontend
└── server/           Express backend
    ├── config/        db connection, schema.sql
    ├── controllers/   route logic
    ├── routes/        API route definitions
    ├── models/        DB query helpers
    └── middleware/    auth, error handling
```

## Stage 1 setup (done so far): Database + server bootstrap

### 1. Set up the database
1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of `server/config/schema.sql` and run it.
   This creates all tables (users, products, categories, cart_items,
   wishlist_items, orders, order_items, order_status_history, reviews)
   plus a few sample products so the UI has data to show immediately.

### 2. Configure the backend
```bash
cd server
cp .env.example .env
```
Edit `.env`:
- `DATABASE_URL` → Supabase Dashboard → Project Settings → Database →
  Connection string (URI). Replace the password placeholder with your DB password.
- `JWT_SECRET` → any long random string.

### 3. Install & run
```bash
npm install
npm run dev
```
Visit `http://localhost:5000/api/health` — you should see:
```json
{ "success": true, "message": "MARQIX SHOPPING MALL API is running" }
```

That confirms the server + database connection setup is correct before we
build features on top of it.

---

## Stage 2: Auth (JWT + bcrypt)

New endpoints:

| Method | Endpoint          | Auth required | Description               |
|--------|-------------------|----------------|----------------------------|
| POST   | /api/auth/register | No            | Create an account          |
| POST   | /api/auth/login     | No            | Log in, returns a JWT      |
| GET    | /api/auth/me         | Yes (Bearer token) | Get current user profile |

**Test register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jane Doe","email":"jane@example.com","password":"secret123"}'
```

**Test login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret123"}'
```
Copy the `token` from the response.

**Test protected route:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Passwords are hashed with bcrypt before storage (`password_hash` column) and
are never returned in any API response. Tokens expire based on
`JWT_EXPIRES_IN` in `.env` (default 7 days).

---

---

## Stage 3: Products (browse, search, filter)

New endpoints:

| Method | Endpoint                          | Description |
|--------|-----------------------------------|--------------|
| GET    | /api/products                     | List products. Query params: `search`, `category` (slug), `page`, `limit`, `sort` (`price_asc`\|`price_desc`\|`newest`\|`rating`) |
| GET    | /api/products/featured             | Featured products (for homepage) |
| GET    | /api/products/deals                 | Products marked as deals |
| GET    | /api/products/categories/all         | All categories (for filter dropdown) |
| GET    | /api/products/:id                    | Single product with images + related products |

**Examples:**
```bash
# Browse all products
curl http://localhost:5000/api/products

# Search
curl "http://localhost:5000/api/products?search=headphones"

# Filter by category
curl "http://localhost:5000/api/products?category=electronics"

# Search + filter + sort + pagination combined
curl "http://localhost:5000/api/products?search=e&category=electronics&sort=price_asc&page=1&limit=10"

# Featured / Deals (for homepage)
curl http://localhost:5000/api/products/featured
curl http://localhost:5000/api/products/deals

# Categories list (for filter UI)
curl http://localhost:5000/api/products/categories/all

# Single product detail (replace with a real id from the list above)
curl http://localhost:5000/api/products/PRODUCT_ID_HERE
```

Each product in the list includes `avg_rating` and `review_count` (computed
from the reviews table, which will be populated in Stage 6). The single
product endpoint also returns `images` (array) and `related` (same-category
products) for the product details page.

---

---

## Stage 4: Cart + Wishlist

All routes below require `Authorization: Bearer YOUR_TOKEN` (get one from `/api/auth/login`).

**Cart:**

| Method | Endpoint            | Body                          | Description |
|--------|---------------------|--------------------------------|--------------|
| GET    | /api/cart            | —                              | View cart (items + totals) |
| POST   | /api/cart            | `{ "productId", "quantity" }` | Add item (or increments if already in cart) |
| PUT    | /api/cart/:productId | `{ "quantity" }`              | Set an exact quantity |
| DELETE | /api/cart/:productId | —                              | Remove one item |
| DELETE | /api/cart            | —                              | Clear entire cart |

**Wishlist:**

| Method | Endpoint                 | Body               | Description |
|--------|--------------------------|---------------------|--------------|
| GET    | /api/wishlist             | —                   | View wishlist |
| POST   | /api/wishlist             | `{ "productId" }`  | Add a product |
| DELETE | /api/wishlist/:productId | —                   | Remove a product |

**Example (replace YOUR_TOKEN and a real product id from `/api/products`):**
```bash
TOKEN="YOUR_TOKEN"
PRODUCT_ID="a00d5c74-3093-4fde-ae47-ccced3ef667e"

curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}"

curl http://localhost:5000/api/cart -H "Authorization: Bearer $TOKEN"

curl -X PUT http://localhost:5000/api/cart/$PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"quantity":5}'

curl -X DELETE http://localhost:5000/api/cart/$PRODUCT_ID -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\"}"

curl http://localhost:5000/api/wishlist -H "Authorization: Bearer $TOKEN"
```

Adding to cart validates against live product stock and rejects the request
if there isn't enough available. Cart totals automatically apply any
`discount_pct` on the product.

---

---

## Stage 5: Orders + order tracking

All routes require `Authorization: Bearer YOUR_TOKEN`.

| Method | Endpoint             | Auth        | Body / Description |
|--------|----------------------|-------------|----------------------|
| POST   | /api/orders/checkout  | Logged in   | `{ shippingName, shippingPhone, shippingAddress, paymentMethod }` — converts current cart into an order |
| GET    | /api/orders            | Logged in   | List your own order history |
| GET    | /api/orders/:id          | Logged in (own order) or admin | Order detail + items + status timeline (for tracking) |
| PUT    | /api/orders/:id/status    | Admin only  | `{ status, note }` — status: `pending`\|`processing`\|`shipped`\|`delivered`\|`cancelled` |

**Checkout example:**
```bash
TOKEN="YOUR_TOKEN"

# Make sure the cart has something in it first (see Stage 4 examples), then:
curl -X POST http://localhost:5000/api/orders/checkout \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"shippingName":"Jane Doe","shippingPhone":"08012345678","shippingAddress":"12 Lekki Rd, Lagos","paymentMethod":"cash_on_delivery"}'
```

**Order history & tracking:**
```bash
curl http://localhost:5000/api/orders -H "Authorization: Bearer $TOKEN"

# use an order id from the list above
curl http://localhost:5000/api/orders/ORDER_ID_HERE -H "Authorization: Bearer $TOKEN"
```

**Testing the admin status update:** every new account defaults to
`role = 'customer'`. To test `PUT /api/orders/:id/status`, promote your test
user to admin directly in Supabase's SQL Editor:
```sql
update users set role = 'admin' where email = 'your-test-email@example.com';
```
Then log in again (the JWT needs to be re-issued so it carries `role: admin`),
and:
```bash
curl -X PUT http://localhost:5000/api/orders/ORDER_ID_HERE/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"shipped","note":"Left the warehouse"}'
```

Checkout runs as a single database transaction: it validates stock for every
cart item, snapshots product name/price into `order_items` (so later price
changes don't rewrite order history), decrements stock, logs the initial
`pending` status, and clears the cart — all together, or none of it if
anything fails (e.g. insufficient stock).

---

## Stage 6: Reviews

Reviews are nested under a product: `/api/products/:productId/reviews`.

| Method | Endpoint                                     | Auth              | Body / Description |
|--------|-----------------------------------------------|-------------------|----------------------|
| GET    | /api/products/:productId/reviews               | Public            | List all reviews for a product |
| POST   | /api/products/:productId/reviews               | Logged in         | `{ rating (1-5), comment }` — submitting again updates your existing review instead of duplicating it |
| DELETE | /api/products/:productId/reviews/:reviewId      | Logged in (own only) | Delete your review |

**Example:**
```bash
TOKEN="YOUR_TOKEN"
PRODUCT_ID="a00d5c74-3093-4fde-ae47-ccced3ef667e"

curl -X POST http://localhost:5000/api/products/$PRODUCT_ID/reviews \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"rating":5,"comment":"Great fit and very comfortable!"}'

curl http://localhost:5000/api/products/$PRODUCT_ID/reviews

curl -X DELETE http://localhost:5000/api/products/$PRODUCT_ID/reviews/REVIEW_ID_HERE \
  -H "Authorization: Bearer $TOKEN"
```

The `avg_rating` and `review_count` fields you've already seen on
`/api/products` and `/api/products/:id` are computed live from this table —
so as soon as a review is submitted, those numbers update automatically.

Note: `reviewModel.hasPurchased()` exists so you can require a verified
purchase before allowing a review, but it's not enforced by default (kept
open so it's easy to test). Say the word if you'd like that restriction
turned on.

---

## Stage 7: React frontend scaffold

The `client/` folder is now a working React app.

**What's built:**
- Routing (`react-router-dom`): Home, Product Listing, Product Detail, Cart,
  Wishlist, Login, Register, Checkout, Order History, Order Detail, 404 —
  all wired up in `App.js`.
- **Auth is fully functional already**: `Login` and `Register` pages call
  the real backend, store the JWT in `localStorage`, and restore the
  session on page refresh (`context/AuthContext.js`).
- **Cart state** is synced live from the API (`context/CartContext.js`) —
  the header's cart badge count updates automatically.
- **API service layer** (`src/services/`) — one file per backend resource
  (`authService`, `productService`, `cartService`, `wishlistService`,
  `orderService`, `reviewService`) — every page will call these instead of
  fetching directly.
- **Protected routes** (`components/ProtectedRoute.js`) redirect to
  `/login` if you try to visit Cart/Wishlist/Checkout/Orders while logged out.
- Global plain CSS (`styles/global.css`) matching the spec's card-based
  layout, mobile-first with breakpoints for tablet/desktop.
- Product Listing, Product Detail, Cart, Wishlist, Checkout, Order History
  and Order Detail pages are currently **placeholders** — routing and
  layout work, but the real UI for these comes in Stage 8-9.

### Setup
```bash
cd client
cp .env.example .env
npm install
npm start
```
Opens at `http://localhost:3000`. Make sure the backend (`server/`) is
running at the same time on port 5000.

**Try it:** Go to `/register`, create an account, and you'll see the header
switch to show your name + Logout — that's the real backend auth working
end-to-end in the browser.

---

## Stage 8: Home, Product Listing, Product Detail

All three pages are now fully functional, backed by the real API:

- **Home** (`/`) — category chips, Featured Products grid, Latest Deals
  grid, all pulled live from `/api/products/featured` etc.
- **Product Listing** (`/products`) — search (via the header search bar),
  category filter chips, sort dropdown (price/rating/newest), pagination.
  All filters are reflected in the URL (`?search=&category=&sort=&page=`)
  so results are shareable/bookmarkable and survive a refresh.
- **Product Detail** (`/products/:id`) — image gallery (falls back to a
  placeholder if no images are set), description, live stock level with a
  low-stock warning, quantity selector, Add to Cart, wishlist toggle,
  reviews list + submit-a-review form (logged-in users only, one review
  per product — resubmitting updates it), and a "You might also like"
  related-products row.
- **New:** `context/WishlistContext.js` — mirrors the cart context pattern,
  so the ❤️ heart on every product card and detail page reflects live
  wishlist state.
- **New:** `components/ProductCard.js` and `components/StarRating.js` —
  shared across Home, Listing, and (partially) Detail.

Since sample products don't have images uploaded yet, product cards
currently show a styled placeholder (the product's first letter) instead
of a broken image icon. To add real images: insert rows into
`product_images` (see `schema.sql`) with real image URLs, or hook up
image upload later.

Try it: browse `/`, click a category chip, use the search bar, open a
product, add it to cart, heart it, leave a review — all of it hits your
real Supabase-backed API.

---

## Stage 9: Cart, Wishlist, Checkout, Order History & Tracking

The full purchase flow from the spec is now clickable end to end:

- **Cart** (`/cart`) — quantity +/- controls (capped at live stock),
  remove item, clear cart, running total, "Proceed to Checkout" button.
- **Wishlist** (`/wishlist`) — move items to cart, remove from wishlist.
- **Checkout** (`/checkout`) — order summary, shipping form (pre-filled
  with your name/phone from your account), payment method selector
  (Cash on Delivery / Bank Transfer — Paystack can slot in here later),
  places the order via `/api/orders/checkout` and redirects straight to
  the new order's tracking page with a success banner.
- **Order History** (`/orders`) — every past order as a card (id, date,
  status badge, total), click through to see full detail.
- **Order Detail / Tracking** (`/orders/:id`) — visual step tracker
  (pending → processing → shipped → delivered), full item breakdown,
  shipping address, and the complete status timeline from
  `order_status_history` (updated whenever an admin calls
  `PUT /api/orders/:id/status`).

**This completes the full app flow from the original spec:**
Home → Product Listing → Product Details → Add to Cart → Login/Register
→ Checkout → Payment → Order Confirmation → Order History — all wired to
your live Supabase backend.

---

## Stage 10: Mobile responsiveness + deployment

**Mobile:** the app was mobile-first from Stage 7 onward (the product
grid, forms, and detail page all already had responsive breakpoints). This
stage adds a focused refinement pass for small phone screens (≤480px):
- Header now cleanly stacks logo → search bar → nav links instead of
  wrapping unpredictably
- Bigger tap targets on quantity buttons, wishlist heart, category chips
- Product Detail's Add to Cart / Add to Wishlist buttons stack vertically
  instead of squeezing side by side
- Cart/Wishlist rows wrap the price/remove column below the item info
  instead of overflowing
- Single-column product grid below 340px (very small/older phones)

Test it by resizing your browser window down to ~375px wide (or using
your browser's device toolbar / an actual phone) and clicking through
Home → a product → Cart → Checkout.

**Deployment:** see **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a full
step-by-step guide to deploying `server/` and `client/` to Render (or
Railway), including environment variables and connecting the two so CORS
works correctly. Your Supabase database needs no separate deployment step
— it's already live.

---

## 🎉 Project status: complete

Every feature from the original spec is built and tested end-to-end:
browsing, search, category filters, wishlist, cart, registration/login,
checkout, order placement, order tracking, and product reviews — backed
by a real PostgreSQL (Supabase) database, secured with JWT + bcrypt, and
ready to deploy.

## Roadmap
- [x] Stage 1: Project scaffold + database schema
- [x] Stage 2: Auth (JWT + bcrypt) — register/login
- [x] Stage 3: Products — browse, search, filter by category
- [x] Stage 4: Cart + Wishlist
- [x] Stage 5: Orders + order tracking
- [x] Stage 6: Reviews
- [x] Stage 7: React frontend scaffold + routing + API layer
- [x] Stage 8: Home, listing, product details pages
- [x] Stage 9: Cart, wishlist, checkout, order history, reviews UI
- [x] Stage 10: Mobile responsiveness + deployment guide
