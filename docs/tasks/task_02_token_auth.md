# Task 02: Token Authentication & Access Denied Fix

## Overview
Group members are encountering an "Access Denied" error when clicking the daily reminder links sent via Telegram. The objective is to implement secure, server-side JWT validation to authenticate users seamlessly using the `?token=xyz` URL parameter.

## Referenced Protocols
- `@03-backend-warden.mdc`
- `@01-foundation.mdc`

## Assigned Agent
**03-backend-warden**

## 1. Architectural Constraints
- **Stateless Authentication:** As mandated by `@01-foundation.mdc`, **NEVER** use traditional email/password flows. Authentication must be purely stateless and "Telegram-First", relying on the JWT passed in the URL (`?token=xyz`).
- **Server-Side Validation:** As heavily emphasized in `@03-backend-warden.mdc`, **NEVER** rely solely on client-side properties like `window.Telegram.WebApp.initDataUnsafe` for security. Validation must happen securely on the server-side.
- **Supabase Admin:** When updating or querying the user's `profiles` or `user_kanji_progress` during this validation phase from the backend, use the Supabase Admin Client (`@supabase/supabase-js`) if bypassing RLS is required.

## 2. Step-by-Step Execution Plan

### Step 1: Implement JWT Validation Utility
- Navigate to the auth libraries (e.g., `lib/auth/**/*.ts`).
- Create or update a utility function to safely decode and verify the JWT string against the server's `JWT_SECRET`.
- Using a library compatible with Next.js Edge environments (such as `jose`) is highly recommended if this will run in `middleware.ts`.

### Step 2: Intercept & Validate via Middleware / Server Components
- Locate the entry point for the daily Telegram link (either via Next.js `middleware.ts` or the specific Server Component handling the page load).
- Extract the `token` parameter from the requested URL search parameters.
- Pass the token into the validation utility from Step 1.
- **If Valid:** Allow the request to proceed. Attach the extracted `telegram_id` to the session/context or pass it as props to Client Components so they know exactly who the user is.
- **If Invalid/Missing:** Safely redirect the user to a localized "Access Denied" or "Please open this link through the Telegram Bot" fallback UI.

### Step 3: Remove Client-Side Trust Vulnerabilities
- Scan the application for components relying exclusively on frontend Telegram Web App data for authorization.
- Refactor these components to consume the `telegram_id` that has been explicitly verified and passed down by the Next.js server-side logic in Step 2.

### Step 4: Verification
- Simulate a daily link click with a correctly signed `?token=...` parameter and verify seamless authentication.
- Tamper with the token, use an expired token, or remove the parameter completely to ensure the backend correctly denies access and handles the error gracefully.
