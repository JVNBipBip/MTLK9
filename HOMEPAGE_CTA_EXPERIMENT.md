# Homepage CTA test — homepage-cta-v1

50/50 visitor-level allocation, retained in a versioned, host-only cookie for 90 days.
Only the primary homepage button copy changes:

- A: Send an Inquiry / Envoyer une demande
- B: Get a training plan / Obtenir un plan d’entraînement

Both versions retain the same headline with its subtle green stroke under the
life-back benefit, layout,
phone number and inquiry flow. The underline styling was updated on September 15
for both allocations; only the CTA copy differs between A and B. Hero copy is
visible immediately rather than waiting for video readiness or staggered text
animations. These shared presentation updates are not separate test variants.
The transformation-story cards and their mobile navigation are also shared by
both allocations; they are not part of the CTA comparison.
The popup is not part of this experiment and still uses one version.

## PostHog reporting

Use two funnels with `hero_cta_experiment = homepage-cta-v1`, breaking down by
`hero_cta_variant` and counting unique people. Filter out `is_test = true` and
restrict `$host` to `www.mtlcaninetraining.com` to exclude development and previews.

1. `hero_cta_experiment_viewed` → `consultation_inquiry_completed`
2. `hero_cta_experiment_viewed` → `phone_link_clicked`

Use a seven-day conversion window. Primary metric: completed inquiry conversion rate.
Secondary metrics: phone-link click rate and `hero_cta_clicked` rate.
Compare rates, not raw totals; also inspect locale and device breakdowns.

Exposure is recorded once per homepage mount when at least half the CTA group is in
view, or immediately before a primary CTA click. Returning visits retain allocation.
Assignment properties are attached to PostHog events across page navigation, saved
with submitted consultations, and saved with server-recorded phone clicks for audit.
The client completed-inquiry event keeps exposure and conversion on PostHog's same
identified person; don't substitute the differently identified server event as the
funnel endpoint.

This is a website-managed split, measured with PostHog events, not a PostHog-managed
feature-flag experiment. Phone clicks measure call intent, not connected calls.
Actual call conversion needs a call-tracking integration. Avoid choosing a winner
from a few conversions; review uncertainty and a complete business cycle before
changing allocation.

SDK reference: https://posthog.com/docs/libraries/js/persistence

## Disable

Replace the primary CTA label with `t("Send an Inquiry")` and remove the experiment
hook from HeroSection. Retain historical events; use a new experiment ID for a
materially different test rather than mixing measurements.
