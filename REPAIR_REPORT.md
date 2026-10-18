# Repair and branding verification

## Root causes
- The connected authentication project had no users: admin@usedmobile.in did not exist. The email provider was already enabled. A secure setup invitation was sent, and the existing first-account trigger assigned the administrator role. No supplied password was available in this conversation, and no password was guessed, stored or reset by the agent.
- Existing application tables lacked Data API grants. Migration 0001 restores explicit authenticated read/update and service access while preserving admin-only RLS. Customer inserts remain validated server-side, not public table writes.

## Completed
- Secure sign-in-only page, generic errors, password-recovery page and invitation/recovery routing. Public signup disabled in hosted auth configuration. Email confirmation preserved; compromised-password checks and current-password protection enabled.
- Unique submission keys prevent duplicate records for concurrent retries. Server recomputes exact prices. Unverified phone status is persisted. Unlimited slot capacity preserved, as requested.
- Admin shows customer/device/condition/address/estimate/slot/verification details. Search, status filtering, assignments, notes, updates and rescheduling use existing functions. Saves show persisted server data. Logout clears router-held private state through a fresh document navigation.
- Replaced shared header/footer, sign-in and admin logos with the supplied PNG through the asset pipeline. Derived 64px favicon and 180px Apple touch icon, with no regenerated artwork. No PWA manifest exists, so no unused PWA infrastructure was added.
- Standardized business/manufacturer logo classes. Restrained page transitions respect reduced motion. Existing light palette retained, with a lighter photograph overlay.
- Removed customer-facing WhatsApp links and handoff logic; removed How It Works route, links and homepage section. Removed only Apple iPhone Duo and its four price records, preserving Lava Duo devices and all remaining exact prices.
- Privacy and Terms pages linked from footer. Platform badge hiding setting successfully applied.

## Verified
- Latest automatic build: OK. Regression suite: 89 tests passed across five files.
- Real guest booking UI: iPhone 13 128 GB, base INR25,760, estimate INR25,800; success reference and database record matched.
- Missing name and invalid mobile produce actionable errors.
- Concurrent calls using one submission key returned the same reference and created one record.
- Authenticated administrator session: loaded saved bookings; assignment, notes and status saved and read back after refresh; search and status filters worked; rescheduling stored the changed date.
- Signed-out private RPC rejected; protected admin route returned to sign-in after logout.
- Homepage at 1280px, 768px and 375px: no horizontal overflow or broken images. Screenshots inspected for mobile/desktop and admin details. Privacy, Terms and brand-selector pages loaded; deleted How It Works URL returned 404.
- Reduced-motion animation duration suppressed. Favicon and Apple touch icon returned HTTP200 locally. Identifiable verification bookings were deleted precisely; no genuine records were removed.

## Launch checklist and owner actions
- BLOCKED: Intended password login cannot be verified until the owner follows the secure invitation or password-reset email and sets their password. Authenticated admin flows were verified using a securely minted preview session, not a password login. Recovery-email delivery/link completion remains unverified.
- DEFERRED BY OWNER: Custom domain remains blank. No domain/DNS records or absolute canonical URLs were invented. HTTPS, redirects and deployed favicon cannot be checked until a domain is chosen and the site is published.
- INCOMPLETE: Business review of Privacy/Terms, especially retention duration, cancellation and dispute-handling terms. Existing contacts/address retained; no legal entity or guarantees invented.
- COMPLETE IN SETTINGS: Builder badge hidden; published-site appearance awaits publication.
- No notifications or historical audit log exist; none were fabricated. Admin list retains its existing 500-record limit.

## Costs and future OTP
No paid SMS, paid integration, credit purchase or SMS API call was activated. Phone verification stays unverified. Live OTP is not implemented: it needs an explicitly approved provider, server-only credentials, send/verify server functions, rate limits and a trusted verification result before status may change. There is no pretend enabling flag or exposed test code. Until that work is authorized, the existing validated booking flow continues without OTP.
