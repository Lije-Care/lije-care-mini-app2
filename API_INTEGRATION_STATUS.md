# Lije Care Mini App - API & Integration Documentation

This document provides a comprehensive overview of backend API endpoints, current frontend integration status, and identifies missing features.

---

## Table of Contents

- [All Backend Endpoints](#all-backend-endpoints)
- [Current Integration Status](#current-integration-status)
- [Redux Slices & Their Endpoints](#redux-slices--their-endpoints)
- [Missing Backend Endpoints/Features](#missing-backend-endpointsfeatures)
- [Integration Notes](#integration-notes)

---

## All Backend Endpoints

**Base URL:** `http://localhost:1020/api/v1`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signin` | No | Sign in with phone + password |
| POST | `/auth/forget-password` | No | Request password reset OTP |
| POST | `/auth/reset-password` | No | Reset password with OTP |
| POST | `/auth/change-password` | Yes | Change password (authenticated) |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/create` | Yes | Create new user |
| GET | `/users/find-all` | Yes | Get all users (paginated) |
| GET | `/users/find-alluser` | Yes | Get all users (variant) |
| GET | `/users/find-one/:id` | Yes | Get user by ID |
| PATCH | `/users/update/:id` | Yes | Update user |
| DELETE | `/users/delete/:id` | Yes | Delete user |

### Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile/get-my-profile` | Yes | Get authenticated user profile |
| PATCH | `/profile/update` | Yes | Update own profile |

### Children

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/children/create` | Yes | Create child record |
| GET | `/children/find-all` | Yes | Get all children (paginated, filterable by `parentId`) |
| GET | `/children/find-one/:id` | Yes | Get child by ID |
| PATCH | `/children/:id` | Yes | Update child |
| DELETE | `/children/:id` | Yes | Delete child |

### Specialists

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/specialists/create` | Yes | Create specialist profile |
| GET | `/specialists/find-all` | Yes | Get all specialists (paginated) |
| GET | `/specialists/find-one/:id` | Yes | Get specialist by ID |
| PATCH | `/specialists/update/:id` | Yes | Update specialist |
| DELETE | `/specialists/delete/:id` | Yes | Delete specialist |
| POST | `/specialists/approve-status/:id` | Yes | Approve/reject specialist |

### Availability

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/availability/create` | Yes | Create availability slot |
| GET | `/availability/find-all` | Yes | Get all slots |
| GET | `/availability/find-one/:id` | Yes | Get slot by ID |
| GET | `/availability/find-availability/:userId` | Yes | Get slots by expert |
| PATCH | `/availability/update/:id` | Yes | Update slot |
| DELETE | `/availability/:id` | Yes | Delete slot |

### Booking

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/booking/create` | Yes | Create booking |
| GET | `/booking/find-all` | Yes | Get all bookings |
| GET | `/booking/find-one/:id` | Yes | Get booking by ID |
| PATCH | `/booking/update/:id` | Yes | Update booking |
| DELETE | `/booking/delete/:id` | Yes | Delete booking |
| GET | `/booking/my-booking/:userType/:userId` | Yes | Get user's bookings |

### Consultations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/consultations/create` | Yes | Create consultation |
| GET | `/consultations/find-all` | Yes | Get all consultations |
| GET | `/consultations/find-one/:id` | Yes | Get consultation by ID |
| PATCH | `/consultations/update/:id` | Yes | Update consultation |
| DELETE | `/consultations/delete/:id` | Yes | Delete consultation |

### Chat (Real-time & HTTP)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat/message` | Yes | Post a message |
| GET | `/chat/room/:chatRoomId/messages` | Yes | Get room messages |
| POST | `/chat/room` | Yes | Create chat room |
| GET | `/chat/rooms` | Yes | Get all chat rooms |
| POST | `/chat/rooms/find-or-create` | Yes | Find or create room |

### AI Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat` | Yes | Send AI chat message |

### Meals

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/meal/create` | Yes | Create meal |
| GET | `/meal/find-all` | Yes | Get all meals |
| GET | `/meal/find-one/:id` | Yes | Get meal by ID |
| PATCH | `/meal/update/:id` | Yes | Update meal |
| DELETE | `/meal/delete/:id` | Yes | Delete meal |

### Ingredients

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ingredient/create` | Yes | Create ingredient |
| GET | `/ingredient/find-all` | Yes | Get all ingredients |
| GET | `/ingredient/find-one/:id` | Yes | Get ingredient by ID |
| PATCH | `/ingredient/update/:id` | Yes | Update ingredient |
| DELETE | `/ingredient/delete/:id` | Yes | Delete ingredient |

### Meal Plans

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/meal-plans/create` | Yes | Create meal plan |
| GET | `/meal-plans/find-all` | Yes | Get all meal plans |
| GET | `/meal-plans/find-one/:id` | Yes | Get meal plan by ID |
| PUT | `/meal-plans/update/:id` | Yes | Update meal plan |
| DELETE | `/meal-plans/:id` | Yes | Delete meal plan |
| GET | `/meal-plans/by-child/:childId` | Yes | Get plans for child |

### E-commerce Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ecommerce` | Yes | Create product |
| GET | `/ecommerce` | Yes | Get all products |
| GET | `/ecommerce/:id` | Yes | Get product by ID |
| PATCH | `/ecommerce/:id` | Yes | Update product |
| DELETE | `/ecommerce/:id` | Yes | Delete product |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/product/order` | Yes | Create order |
| GET | `/product/order` | Yes | Get all orders |
| GET | `/product/order/:txRef` | Yes | Get order by reference |

### Booked Orders (Package Purchases)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/booked/chapa/initialize` | Yes | Initialize package payment |
| POST | `/booked/verify` | Yes | Verify payment status |
| POST | `/booked/webhook` | No | Chapa webhook callback |
| GET | `/booked` | Yes | Get all booked orders |
| GET | `/booked/:txRef` | Yes | Get order by transaction ref |
| GET | `/booked/by-parent/:parentId` | Yes | Get orders by parent |

### Packages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/package/create` | Yes | Create package |
| GET | `/package/find-all` | Yes | Get all packages |
| GET | `/package/find-one/:id` | Yes | Get package by ID |
| PATCH | `/package/update/:id` | Yes | Update package |
| DELETE | `/package/remove/:id` | Yes | Delete package |

### User Packages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/user-package/create` | Yes | Assign package to user |
| GET | `/user-package/find-all` | Yes | Get all user packages |
| GET | `/user-package/find-one/:id` | Yes | Get user package by ID |
| GET | `/user-package/active?userId=` | Yes | Get active package for user |
| PATCH | `/user-package/update/:id` | Yes | Update user package |
| DELETE | `/user-package/:id` | Yes | Delete user package |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notification/find-all` | Yes | Get all notifications |
| POST | `/notification/broadcast` | Yes | Broadcast to all users |
| POST | `/notification/send-notification` | Yes | Send to specific user |

### Articles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/articles` | Yes | Create article |
| GET | `/articles/find-all` | Yes | Get all articles |
| GET | `/articles/find-one/:id` | Yes | Get article by ID |
| PATCH | `/articles/update/:id` | Yes | Update article |
| DELETE | `/articles/delete/:id` | Yes | Delete article |

### Promotions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/promotion/create` | Yes (Admin) | Create promotion |
| GET | `/promotion/find-all` | No | Get all promotions |
| GET | `/promotion/find-one/:id` | No | Get promotion by ID |
| PATCH | `/promotion/update/:id` | Yes (Admin) | Update promotion |
| DELETE | `/promotion/delete/:id` | Yes (Admin) | Delete promotion |

### File Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/file-upload/upload-image` | Yes | Upload image (FormData) |
| POST | `/file-upload/upload-file` | Yes | Upload document (FormData) |

### Nutrients, Cooking Methods, Units (Admin/Content)

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Nutrients | `/nutrient/*` | CRUD for nutrient definitions |
| Cooking Methods | `/cooking-method/*` | CRUD for cooking methods |
| Cooking Effects | `/cooking-effect/*` | CRUD for cooking effects on nutrients |
| Affected Nutrients | `/affectednutrient/*` | CRUD for affected nutrient records |
| Retention Models | `/retention/*` | CRUD for retention models |
| Units | `/unit/*` | CRUD for measurement units |
| How To Serve | `/how-to-serve/*` | CRUD for serving methods |

### Dashboard (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/admin-overview` | Yes | Admin dashboard stats |
| GET | `/dashboard/nutritionist-overview` | Yes | Nutritionist dashboard stats |

---

## Current Integration Status

### ✅ Fully Integrated (Real API)

| Feature | View/Component | Redux Slice | Endpoint | Thunks |
|---------|---------------|-------------|----------|--------|
| **Products** | ShopView, HomeDashboard | `productSlice.ts` | `GET /ecommerce` | `fetchProducts` |
| **Specialists** | CallCenterView | `specialistSlice.ts` | `GET /specialists/find-all` | `fetchSpecialists` |
| **Meals** | MealsView | `mealSlice.ts` | `GET /meal/find-all` | `fetchMeals` |
| **Ingredients** | MealsView | `mealSlice.ts` | `GET /ingredient/find-all` | `fetchIngredients` |
| **Children** | Header, Profile, Assessment | `childSlice.ts` | `GET /children/find-all`, `POST /children/create`, `PATCH /children/:id`, `DELETE /children/:id` | `fetchChildrenByParentId`, `addChild`, `updateChild`, `deleteChildById` |
| **Parent Profile** | Header, Profile | `itemSlice.ts` | `GET /users/find-one/:id`, `PATCH /users/update/:id` | `fetchParent`, `updateParent` |
| **Articles** | Knowledge base | `articlesSlice.ts` | `GET /articles/find-all`, `GET /articles/:id`, `POST /articles`, `PATCH /articles/:id`, `DELETE /articles/:id` | `fetchArticles`, `fetchArticleById`, `createArticle`, `updateArticle`, `deleteArticle` |
| **Notifications** | Notification page | `notificationSlice.ts` | `GET /notification/find-all` | `fetchAllNotifications` |

### ⚪ Local Only (No Backend)

| Feature | View/Component | Data Source | Notes |
|---------|---------------|-------------|-------|
| **Cart** | Shop, Checkout | `cartSlice.ts` (localStorage) | Cart persists locally; no backend sync |

### ❌ Mock/Static Data

| Feature | View/Component | Current Implementation | Notes |
|---------|---------------|------------------------|-------|
| **Assessments** | AssessmentView | Mock data / static UI | No API integration |
| **Assessment Prompts** | HomeDashboard | Static data | "Complete assessment" prompts |
| **Product Ratings** | ShopView, HomeDashboard | Default 4.5-4.8 | Backend `Ecommerce` model lacks `rating` field |
| **Specialist Fees** | CallCenterView | Default 350 ETB | Backend `SpecialistDetail` model lacks `fee` field |
| **Onboarding OTP** | OTPStep | Console log only | No `POST /auth/verify-otp` endpoint |
| **Growth Metrics** | Assessment results | Not connected | Backend has GrowthMetrics table, no frontend integration |

---

## Redux Slices & Their Endpoints

| Slice | File Path | Endpoints Used | Async Thunks |
|-------|-----------|----------------|--------------|
| **productSlice** | `/src/redux/slices/productSlice.ts` | `GET /ecommerce` | `fetchProducts` |
| **mealSlice** | `/src/redux/slices/mealSlice.ts` | `GET /meal/find-all`, `GET /ingredient/find-all` | `fetchMeals`, `fetchIngredients` |
| **specialistSlice** | `/src/redux/slices/specialistSlice.ts` | `GET /specialists/find-all` | `fetchSpecialists` |
| **childSlice** | `/src/redux/slices/childSlice.ts` | `GET /children/find-all`, `POST /children/create`, `PATCH /children/:id`, `DELETE /children/:id` | `fetchChildrenByParentId`, `addChild`, `updateChild`, `deleteChildById` |
| **articlesSlice** | `/src/redux/slices/articlesSlice.ts` | `GET /articles/find-all`, `GET /articles/:id`, `POST /articles`, `PATCH /articles/:id`, `DELETE /articles/:id` | `fetchArticles`, `fetchArticleById`, `createArticle`, `updateArticle`, `deleteArticle` |
| **itemSlice** | `/src/redux/slices/itemSlice.ts` | `GET /users/find-one/:id`, `PATCH /users/update/:id` | `fetchParent`, `updateParent` |
| **cartSlice** | `/src/redux/slices/cartSlice.ts` | None (localStorage) | N/A (sync reducers only) |
| **notificationSlice** | `/src/redux/slices/notificationSlice.ts` | `GET /notification/find-all` | `fetchAllNotifications` |

---

## Missing Backend Endpoints/Features

### High Priority - Required for Core Features

| Feature | Required Endpoint/Change | Current Workaround | Impact |
|---------|--------------------------|-------------------|--------|
| **Product ratings** | Add `rating: Float` field to `Ecommerce` model | Hardcoded 4.5 default | User trust, purchase decisions |
| **Specialist fees** | Add `fee: Float` field to `SpecialistDetail` model | Hardcoded 350 ETB | Booking flow, pricing transparency |
| **OTP verification** | `POST /auth/verify-otp` | Console log, bypassed | Onboarding security |
| **Growth metrics display** | Wire up `GET /growth-metrics/:childId` | Not shown | Assessment results page |

### Medium Priority - Enhances User Experience

| Feature | Required Endpoint/Change | Current Workaround | Impact |
|---------|--------------------------|-------------------|--------|
| **Product reviews** | `POST /reviews`, `GET /reviews/:productId` | Not implemented | Social proof, engagement |
| **Meal plan save** | Wire up `POST /meal-plans/create` in frontend | UI-only, no persistence | Meal planning feature |
| **Cart sync** | `POST /cart`, `GET /cart/:userId` | localStorage only | Cart lost on device switch |
| **Order history** | Frontend integration with `GET /product/order` | Not integrated | User can't view past orders |
| **Booking payment** | Full Chapa integration in booking flow | Partial | Can't complete paid bookings |

### Lower Priority - Future Enhancements

| Feature | Required Endpoint/Change | Notes |
|---------|--------------------------|-------|
| Child avatar upload | Use `/file-upload/upload-image` | Currently no avatar support |
| Specialist availability UI | Wire up `/availability/find-availability/:userId` | Show expert's free slots |
| AI chat history | Display `/chat` conversation history | Currently fresh each session |
| Push notifications | Mobile push via Telegram or FCM | In-app only currently |

---

## Integration Notes

### Authentication Flow

1. User opens Telegram Mini App
2. App extracts `telegramId` from launch params
3. Calls `GET /users/find-one/:telegramId` to fetch user
4. If user exists, JWT token is obtained and stored
5. All subsequent API calls include `Authorization: Bearer <token>`

### WebSocket Chat

The backend supports real-time chat via Socket.io:

```javascript
// Events
socket.emit('join_room', { chatRoomId });
socket.emit('send_message', { content, chatRoomId, senderId });
socket.on('receive_message', (message) => { /* handle */ });
```

### Payment Integration (Chapa)

Flow for package purchases:
1. `POST /booked/chapa/initialize` → returns `checkout_url`
2. Redirect user to Chapa payment page
3. Webhook callback to `/chapa/webhook`
4. Verify with `POST /booked/verify`

### API Response Formats

Most endpoints return:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "lastPage": 10,
    "currentPage": 1,
    "perPage": 10,
    "prev": null,
    "next": 2
  }
}
```

---

## Quick Reference: Endpoint → Slice Mapping

```
/ecommerce          → productSlice
/meal/*             → mealSlice
/ingredient/*       → mealSlice
/specialists/*      → specialistSlice
/children/*         → childSlice
/users/*            → itemSlice
/articles/*         → articlesSlice
/notification/*     → notificationSlice
/cart (local)       → cartSlice
```

---

*Last updated: February 2026*
