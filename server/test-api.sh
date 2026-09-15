#!/bin/bash
# Full smoke test for MARQIX SHOPPING MALL API — Stages 2-4
# Usage: bash test-api.sh

BASE_URL="http://localhost:5000"
EMAIL="zmonsurat@gmail.com"
PASSWORD="beautiful/12"

hr() { echo "----------------------------------------"; }

echo "1) Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$LOGIN_RESPONSE"
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "Login failed — cannot continue. Check the response above."
  exit 1
fi
hr

echo "2) Fetching products to grab a real product id..."
PRODUCTS_RESPONSE=$(curl -s "$BASE_URL/api/products")
echo "$PRODUCTS_RESPONSE"
# grabs the first "id":"..." value in the response
PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')

if [ -z "$PRODUCT_ID" ]; then
  echo "No products found — cannot continue. Did you run schema.sql (with seed data)?"
  exit 1
fi
echo "Using PRODUCT_ID=$PRODUCT_ID"
hr

echo "3) Add to cart (qty 2)..."
curl -s -X POST "$BASE_URL/api/cart" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}"
echo ""
hr

echo "4) View cart..."
curl -s "$BASE_URL/api/cart" -H "Authorization: Bearer $TOKEN"
echo ""
hr

echo "5) Update quantity to 5..."
curl -s -X PUT "$BASE_URL/api/cart/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"quantity":5}'
echo ""
hr

echo "6) Add to wishlist..."
curl -s -X POST "$BASE_URL/api/wishlist" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\"}"
echo ""
hr

echo "7) View wishlist..."
curl -s "$BASE_URL/api/wishlist" -H "Authorization: Bearer $TOKEN"
echo ""
hr

echo "8) Checkout (converts current cart into an order)..."
CHECKOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders/checkout" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"shippingName":"Jane Doe","shippingPhone":"08012345678","shippingAddress":"12 Lekki Rd, Lagos","paymentMethod":"cash_on_delivery"}')
echo "$CHECKOUT_RESPONSE"
ORDER_ID=$(echo "$CHECKOUT_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo ""
hr

echo "9) View order history..."
curl -s "$BASE_URL/api/orders" -H "Authorization: Bearer $TOKEN"
echo ""
hr

if [ -n "$ORDER_ID" ]; then
  echo "10) View order detail + tracking timeline (order $ORDER_ID)..."
  curl -s "$BASE_URL/api/orders/$ORDER_ID" -H "Authorization: Bearer $TOKEN"
  echo ""
  hr
fi

echo "11) Remove from cart (cart should already be empty after checkout, so this should 404 — expected)..."
curl -s -X DELETE "$BASE_URL/api/cart/$PRODUCT_ID" -H "Authorization: Bearer $TOKEN"
echo ""
hr

echo "12) Submit a review for the product..."
REVIEW_RESPONSE=$(curl -s -X POST "$BASE_URL/api/products/$PRODUCT_ID/reviews" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"rating":5,"comment":"Great product, works exactly as described!"}')
echo "$REVIEW_RESPONSE"
REVIEW_ID=$(echo "$REVIEW_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo ""
hr

echo "13) View reviews for the product..."
curl -s "$BASE_URL/api/products/$PRODUCT_ID/reviews"
echo ""
hr

echo "14) Confirm avg_rating now shows on the product listing..."
curl -s "$BASE_URL/api/products/$PRODUCT_ID"
echo ""
hr

echo "Done."
