# GHL Welcome Flow Rollout

## Current website behavior

- Opens after either 10 seconds on a page or 40% scroll depth, whichever happens first.
- Does not open on booking, checkout, training portal, privacy, or terms pages.
- Suppresses for 30 days after dismissal and permanently in that browser after signup.
- Captures email plus an optional dog-behavior message.
- Upserts the contact in GHL with these tags:
  - `website-welcome-flow`
  - `welcome-cohort-treatment`
  - `lang-en` or `lang-fr`
  - `popup-variant-a` or `popup-variant-b`
  - `welcome-intent-help` or `welcome-intent-tips`
  - a bounded source tag such as `welcome-source-reactivity` or `welcome-source-blog`
- Shows Call Nick and Start a consultation request actions after signup.

The production popup remains disabled until the email workflow and dedicated sending domain pass an end-to-end test.

## Conversion measurement

The pre-launch rolling 30-day baseline, generated July 9, 2026, is 45 completed website inquiries, or 1.50 per day. Seventeen of those inquiries are currently scheduled or completed. Historical phone-link clicks are not part of this baseline because phone tracking was inconsistent across the site.

- Randomly assign 20% of eligible visitors to a persistent no-popup holdout.
- Split the remaining 80% evenly between help-first variant A and education-first variant B.
- Primary outcome: an inquiry completion or phone-link click after assignment.
- Secondary outcomes: popup signup, consultation-form open, scheduled consultation, and completed consultation.
- Compare conversion rates per assigned visitor, not raw lead counts. Use the previous 30 days only as a directional baseline; the simultaneous holdout is the causal comparison.
- Review after 14 days for tracking quality, after 30 days for direction, and after 60-90 days for a business decision.
- A phone-link click measures call intent. Confirmed connected calls require Nick's phone logs or a GHL tracking number.

## GHL workflow

Create `Website Welcome Flow - EN/FR` in the Montreal Canine Training sub-account.

1. Trigger: **Contact Tag**, event **Tag Added**, tag `website-welcome-flow`.
2. Disable re-entry so the same contact cannot restart the sequence repeatedly.
3. Add an If/Else branch for `lang-fr`; use English as the fallback branch.
4. Add an internal notification when the contact has `welcome-intent-help`. Include the contact email and latest note so Nick can reply personally.
5. Send Email 1 immediately.
6. Wait two days. If the contact has `in-person-evaluation`, end the workflow; otherwise send Email 2.
7. Wait three more days. Check `in-person-evaluation` again; otherwise send Email 3.
8. Ensure every email contains the GHL unsubscribe link and uses the verified sending domain.

### Draft status (July 9, 2026)

- Created the unpublished `Website Welcome Flow - EN/FR` workflow in GHL.
- Added the `website-welcome-flow` trigger, French/English routing, all six emails, the two-day and three-day waits, and link-click tracking.
- Disabled workflow re-entry and enabled stop-on-response.
- Created the language, intent, and treatment-cohort contact tags used by the website.
- The help-intent internal notification and `in-person-evaluation` stop checks remain pending. The website does not currently sync a completed consultation request to that GHL tag, so adding those checks now would not suppress booked contacts reliably.
- Keep the workflow in Draft until the sender address is confirmed and a test contact passes delivery, reply, tracked-link, and unsubscribe checks.

## Email 1: immediate

### English

**Subject:** A clear next step for you and your dog

Hi there,

Thanks for reaching out to Montreal Canine Training. The fastest way to make progress is to understand what is driving the behavior, then choose the right training format for your dog and your daily life.

If you shared what your dog is struggling with, Nick or one of our trainers will review it. You can also start your consultation request now:

https://www.mtlcaninetraining.com/en/booking?utm_source=ghl&utm_medium=email&utm_campaign=welcome-flow&utm_content=email-1

Prefer to talk? Call Nick at 514 826 9558.

Montreal Canine Training

### French

**Objet :** Une prochaine étape claire pour votre chien et vous

Bonjour,

Merci d'avoir contacté Entraînement Canin Montréal. La façon la plus rapide de progresser est de comprendre ce qui provoque le comportement, puis de choisir le bon format d'entraînement pour votre chien et votre quotidien.

Si vous avez décrit la difficulté de votre chien, Nick ou un de nos entraîneurs l'examinera. Vous pouvez aussi commencer votre demande de consultation maintenant :

https://www.mtlcaninetraining.com/fr/booking?utm_source=ghl&utm_medium=email&utm_campaign=welcome-flow&utm_content=email-1

Vous préférez parler à quelqu'un? Appelez Nick au 514 826 9558.

Entraînement Canin Montréal

## Email 2: proof and expectations

### English

**Subject:** What real progress looks like

Good dog training is not about a perfect session. It is about calmer walks, clearer communication, and skills that still work around real distractions.

See how Montreal dogs progressed through reactivity and puppy training:

https://www.mtlcaninetraining.com/en/results?utm_source=ghl&utm_medium=email&utm_campaign=welcome-flow&utm_content=email-2

When you are ready, start your consultation request:

https://www.mtlcaninetraining.com/en/booking?utm_source=ghl&utm_medium=email&utm_campaign=welcome-flow&utm_content=email-2

### French

**Objet :** À quoi ressemblent de vrais progrès

Un bon entraînement canin ne se résume pas à une séance parfaite. Il vise des promenades plus calmes, une communication plus claire et des compétences qui fonctionnent malgré les distractions réelles.

Découvrez les progrès de chiens montréalais en réactivité et en entraînement des chiots :

https://www.mtlcaninetraining.com/fr/results?utm_source=ghl&utm_medium=email&utm_campaign=welcome-flow&utm_content=email-2

Lorsque vous êtes prêt, commencez votre demande de consultation :

https://www.mtlcaninetraining.com/fr/booking?utm_source=ghl&utm_medium=email&utm_campaign=welcome-flow&utm_content=email-2

## Email 3: consultation

### English

**Subject:** What happens during your evaluation

Your evaluation gives the trainer time to understand your dog's behavior, your goals, and what has or has not worked before. You leave with a recommended path instead of guessing between private training and group classes.

Start your consultation request:

https://www.mtlcaninetraining.com/en/booking?utm_source=ghl&utm_medium=email&utm_campaign=welcome-flow&utm_content=email-3

Questions first? Reply to this email or call Nick at 514 826 9558.

### French

**Objet :** Ce qui se passe pendant votre évaluation

L'évaluation permet à l'entraîneur de comprendre le comportement de votre chien, vos objectifs et ce qui a déjà fonctionné ou non. Vous repartez avec un parcours recommandé au lieu de devoir choisir au hasard entre les cours privés et les cours de groupe.

Commencez votre demande de consultation :

https://www.mtlcaninetraining.com/fr/booking?utm_source=ghl&utm_medium=email&utm_campaign=welcome-flow&utm_content=email-3

Vous avez d'abord des questions? Répondez à ce courriel ou appelez Nick au 514 826 9558.

## Dedicated sending domain and Square DNS

Use `mail.mtlcaninetraining.com` as the dedicated GHL sending subdomain. A subdomain protects the reputation of the root website domain and avoids replacing any existing root-domain mail records.

1. In the GHL sub-account, open **Settings > Email Services > Dedicated Domain and IP**.
2. Add `mail.mtlcaninetraining.com` and keep the generated DNS-record screen open.
3. In Square Dashboard, open **Channels > Domains > Manage > Manage domain > DNS Records**.
4. Add every record exactly as GHL provides it. GHL normally generates two TXT records, two MX records, and one CNAME record. Add DMARC too if it appears in the account-specific list.
5. Do not change nameservers and do not edit the website's existing A or CNAME records.
6. Return to GHL and verify the domain. Confirm the SSL status is active, then send a test email.
7. Publish the workflow only after the test email passes SPF, DKIM, and unsubscribe checks.
8. Enable `NEXT_PUBLIC_WELCOME_POPUP=1` in Vercel Production and redeploy.

DNS values are account-specific. Copy them from GHL rather than using example values from documentation.
