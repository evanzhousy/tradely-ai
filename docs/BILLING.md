# Tradely billing operations

Tradely sells two independent offers through Stripe-hosted Checkout:

- **Tradely Membership** is a recurring subscription. An active or trialing
  subscription containing `STRIPE_MEMBERSHIP_PRICE_ID` grants member access.
- **Evidence-Led Options Research — Lifetime Course Pass** is a one-time
  payment. A completed, paid Checkout Session containing
  `STRIPE_COURSE_PASS_PRICE_ID` grants permanent access to the current course
  and its revisions. Future distinct courses are excluded.

Stripe remains payment, refund, and dispute truth. `app_user` stores the
verified Course Pass entitlement needed for low-latency lesson access; PostHog
checkout events remain directional product telemetry and never revenue truth.

## Configuration

```text
STRIPE_API_KEY=<test or production restricted key>
STRIPE_ACCOUNT_ID=acct_...
STRIPE_MEMBERSHIP_PRICE_ID=price_...
STRIPE_COURSE_PASS_PRICE_ID=price_...
LIFETIME_CHECKOUT_ENABLED=false
```

Tradely reuses Stripe account `acct_1LZx3GFrxuhJplqI` by product decision. Use
separate test and production Products, Prices, and keys within that account.
Prefer a restricted API key with only the Customer, Product/Price read,
Subscription read, Checkout Session, and Customer Portal permissions required
by the application. Because branding, customers, reporting, and statement
descriptors are account-scoped, changes can affect every product on this shared
account.

Production and non-production must use distinct Clerk instances and Neon
branches/databases. `app_user` stores one Stripe Customer reference, and Stripe
test and live Customers are different objects even when their IDs have the same
shape. Sharing one learner row across key modes can replace or strand the
Customer mapping, so environment isolation is a billing invariant rather than
an optional deployment preference.

`LIFETIME_CHECKOUT_ENABLED` controls only the creation and display of new
one-time purchases. Verification, restore, and previously granted access must
continue working when it is false.

Preview Checkout sessions return to the current Vercel deployment using the
platform-provided `VERCEL_URL`. Production and local callbacks continue to use
the configured `APP_URL`; Preview rejects any callback host outside
`*.vercel.app`.

## Billing preflight

Run the read-only preflight before accepting a test result, deploying disabled
production code, or enabling production Checkout:

```text
pnpm billing:preflight -- \
  --environment test \
  --stage acceptance \
  --checkout-session-id cs_test_...
```

The preflight retrieves the configured Stripe account, both exact Prices and
Products, and the supplied Checkout Session. It verifies account ID, key mode,
canonical amounts, currency, interval, Product names and metadata, feature-flag
posture, APP_URL, Session Price, and captured Checkout display name without
printing the API key.

Production supports two separate gates:

```text
--environment production --stage deploy-disabled
--environment production --stage launch --checkout-session-id cs_live_...
```

Production checks require injected configuration, a restricted live key, live
Prices, the canonical Tradely origin, an activated account, and the appropriate
disabled or enabled flag. Launch additionally requires a live-mode Session
proof. Creating or paying a live Session remains a separately approved
operation; the preflight itself is read-only.

## Fulfillment invariant

The browser query string is never proof of purchase. The server retrieves the
Checkout Session and grants access only when all of these conditions hold:

1. Session mode is `payment`, status is `complete`, and payment status is `paid`.
2. Session Customer matches the signed-in user's stored Stripe Customer.
3. `client_reference_id` matches the signed-in Clerk user.
4. A line item contains the exact Course Pass Price ID.
5. Session metadata contains the exact Course Pass entitlement code.

The unique Checkout Session column makes repeated return callbacks idempotent.

## Restore purchase

If payment succeeded but the browser never returned, a signed-in learner can
run **Restore purchase**. The server paginates through Checkout Sessions for
that Stripe Customer and applies the same verification contract. No
browser-supplied Customer or Price ID is accepted. Recovery remains available
when new Course Pass sales are disabled.

## Refunds and disputes

There is no Stripe webhook in the current minimal-table architecture. A refund
or dispute therefore requires two operator actions:

1. Process or confirm the refund/dispute in Stripe.
2. Dry-run and then apply the bounded revocation command for the exact Clerk
   user and Checkout Session.

```text
pnpm billing:revoke-course-pass -- \
  --environment test \
  --clerk-user-id user_... \
  --checkout-session-id cs_test_... \
  --reason refund \
  --reference re_...
```

The command's JSON result uses identifier hashes/suffixes and makes no change by
default. Shell history and pnpm's command preamble can still contain the raw
arguments, so treat the complete operator transcript as customer-sensitive.
After verifying the JSON result against Stripe and the support record, repeat
the command with both `--apply` and an exact duplicate confirmation:

```text
  --apply --confirm-session-id cs_test_...
```

Use `--environment production` only with a `cs_live_...` Session and with the
approved production `DATABASE_URL` injected into the operator environment. The
command refuses cross-environment Session IDs, mismatched stored Sessions, and
changes that race after the dry-run. Keep its JSON output with the Stripe or
support reference.

Revocation keeps the original Checkout Session reference so Restore purchase
cannot reactivate a refunded purchase. A later new paid Session can establish a
new grant. That revocation state also advances the Checkout idempotency
generation, so the next purchase cannot reuse the completed revoked Session.

## Test-mode acceptance matrix

- Membership checkout creates a subscription Session with the membership Price.
- Course Pass checkout creates a payment Session with the Course Pass Price.
- Wrong user, Customer, Price, entitlement metadata, incomplete Session, and
  unpaid Session never grant access.
- Repeating a verified callback remains successful without duplicating state.
- Restore purchase repairs a missed callback.
- Course Pass access works when Stripe subscription lookup is unavailable.
- Existing membership, preview, and manual-grant behavior remains unchanged.
- Disabling new checkout keeps existing Course Pass access active.

### Recorded acceptance evidence

On 2026-08-31, Vercel Preview deployment
`dpl_C1pbLcYKvB6w2LFgN2VuuT3EHmVg` completed the Course Pass flow with
Stripe's documented interactive test card:

- Stripe reported `livemode=false`, `mode=payment`, `status=complete`,
  `payment_status=paid`, and a succeeded PaymentIntent for USD 49.00.
- The Session contained exactly one line item with the configured Course Pass
  Price and returned to the deployment-specific Preview origin.
- The clean `/pricing` route showed **Lifetime access active** without Checkout
  query parameters, proving the entitlement persisted beyond the return page.
- Every paid lesson rendered as **Unlocked**, including its video, written
  lesson, TradingFlow practice link, and completion action.
- Production aliases were not promoted and production Course Pass checkout
  remained disabled.

This is test-environment acceptance evidence, not production payment proof.

Preview deployment `dpl_VTykmaZiwdjaj6H1PScL99QZBP2U` then verified the
shared Checkout branding contract. A fresh unpaid Session captured
`branding_settings.display_name=Tradely.ai`, used the exact Course Pass Price,
and passed the automated test preflight. Initial browser evidence still showed
`TradingMap AI` in the tab title and Link copy because those surfaces inherited
the account-level public name. After the user selected account reuse, the
account public name, website, owl icon, brand colors, and statement descriptors
were changed to Tradely. A final unpaid Session rendered `Tradely.ai` in its tab
title, header, and Link copy. Both proof Sessions were cancelled and granted no
access. These shared-account settings can affect every product on the account.

## Production gate

Before enabling production Checkout:

1. Confirm Product names, prices, refund terms, and Course Pass scope.
2. Confirm the reused Stripe account ID, public business name, owl icon,
   black/yellow colors, and statement descriptors remain Tradely-specific. This
   shared-account decision applies those customer-facing settings to all
   products using the account.
3. Confirm applicable sales-tax or VAT registrations. Do not assume enabling
   Stripe Tax creates a registration.
4. Install production Price IDs and a sensitive, least-privilege Vercel key.
5. Apply the versioned database migration before deploying application code.
6. Run the `deploy-disabled` billing preflight.
7. Deploy with `LIFETIME_CHECKOUT_ENABLED=false` and smoke-test membership.
8. Run the `launch` billing preflight against an approved unpaid Session proof.
9. Enable Course Pass checkout only after a real production verification plan
   is approved. Never create an unapproved real charge for testing.

Rollback is `LIFETIME_CHECKOUT_ENABLED=false`. Do not delete the Product/Price,
clear entitlement columns, or revoke existing purchasers during rollback.
