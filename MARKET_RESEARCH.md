# Daksha — Go-to-Market Research (India, Legal Vertical)
*Prepared: 2026-09-07. Brutally honest, no sugar-coating.*

## 1. What you're actually selling

Not "AI for lawyers." Every big firm in Bangalore/Mumbai/Delhi has already been pitched 5 AI legal tools this year (CaseMine, SpotDraft, Legistify, Harvey clones, ChatGPT itself). Nobody cares about "AI chat" anymore — it's table stakes, not a USP.

Your actual USP is **data never leaves the lawyer's machine/firm**. That's not a feature, it's a *trust* product. Position it as:

> "Your case files never touch the cloud. Not OpenAI's servers, not ours, not anyone's."

This only works if it's literally true end-to-end (local LLM, local embeddings, local vector store — no OpenAI/Supabase calls). You said you're changing the architecture to match this — good, because right now (per the repo) it calls OpenAI + Supabase, which would be a false claim that gets you sued or shamed publicly if a lawyer ever checks network traffic. **This is non-negotiable before you say "fully local" to a single customer.**

## 2. Brutal reality checks on the target audience

- **Indian lawyers are not early adopters.** Most solo/small-firm lawyers (which is 90%+ of the market outside top-tier firms) run their practice on WhatsApp, physical files, and Tally/Excel. They are not waiting for an AI tool — they don't know they need one.
- **The buyer and the user are often different people.** A senior partner decides to buy; a junior associate/paralegal actually uses it. Your onboarding and pricing need to work for both.
- **Litigation lawyers vs corporate/transactional lawyers have very different document habits.** Litigation = messy PDFs, scanned orders, cause lists, endless case files. Corporate/M&A = contracts, due diligence, templates. Pick ONE beachhead — "organizing documents for litigation lawyers" is a completely different product from "contract review for corporate lawyers." Don't build for both at once.
- **Privacy sells to compliance-conscious segments, not to the median solo practitioner.** A solo lawyer in a tier-2 city doesn't lose sleep over data privacy — they care about "will this save me time and can I afford it." Privacy-first is a strong wedge for:
  - In-house counsel at companies (data governance mandates)
  - Firms handling sensitive litigation (matrimonial, criminal defense, corporate disputes, IP)
  - Firms burned before by a cloud tool leak or a client who explicitly forbids cloud storage of case data
  - NOT the mass-market solo practitioner — for them "cheap and works" beats "private."

- **DPDP Act (India's Digital Personal Data Protection Act, 2023) is your actual tailwind.** Lawyers handle client PII constantly (client names, financial records, medical records in cases, Aadhaar numbers in filings). "DPDP-compliant by design because nothing leaves your device" is a much stronger pitch than "privacy" in the abstract — it's a legal obligation they already have, not a nice-to-have.

## 3. Competitive landscape (be honest with yourself)

| Player | What they do | Why they beat you today |
|---|---|---|
| CaseMine / SCC Online AI | Legal research + case law AI | Brand trust, huge case-law corpus, funded |
| SpotDraft / Leegality | Contract lifecycle mgmt | Enterprise sales motion, integrations |
| Generic ChatGPT/Claude + manual upload | "Just paste my PDF into ChatGPT" | Free/cheap, zero setup, lawyers already do this despite the privacy risk |
| Local practice management (Clio-like, or none) | Case + document filing | Already embedded in workflow, switching cost |

Your real competitor for the mass market isn't another SaaS — **it's a lawyer's paralegal/intern manually searching through a folder, or a lawyer pasting a snippet into ChatGPT and accepting the risk.** You're not just competing on features, you're competing on inertia and "good enough."

## 4. Pricing reality in India

- Indian legal SaaS willingness-to-pay is low compared to US/UK. A solo lawyer will balk at ₹2,000+/month unless ROI is obvious in week one.
- Realistic tiers to test:
  - **Free/very cheap single-user tier** (or one-time desktop license) to get local-first virality — lawyers talk to each other, referrals matter more than ads in this profession.
  - **Firm tier** (5-50 lawyers) priced per seat, sold via a real sales conversation, not self-serve — Indian firms buy relationship-first.
  - Consider a **one-time on-prem license + annual support fee** model instead of pure SaaS subscription — many Indian firms are more comfortable with "we bought software" than "we pay monthly forever," especially if it's local/offline (no server costs to justify recurring billing either).
- If it's genuinely local-only with no server costs to you, your margins are enormous compared to cloud SaaS — you can price aggressively and still profit. Use that.

## 5. Where to actually find and reach lawyers in India

Cold outreach and generic digital ads will burn money with near-zero conversion. Lawyers trust other lawyers and bar associations, not marketing.

**High-leverage channels:**
1. **Bar Associations & Bar Council events** — sponsor/demo at district/state bar association meets. Slow but this is where trust is built.
2. **Legal tech communities**: LinkedIn is where Indian lawyers actually are active (unlike Twitter/X). Legal Twitter is thin in India; LinkedIn legal-tech content (SCC Online, Bar & Bench, LiveLaw contributors) has real reach.
3. **Bar & Bench / LiveLaw** — these are the two dominant Indian legal news sites. A feature/review/sponsored piece here reaches thousands of practicing lawyers directly. Far higher ROI than Google Ads for this audience.
4. **Law school connections** — young lawyers/associates are more tech-open; if you can get adoption in law firm associate cohorts (NLU grads etc.), it spreads upward as they become partners.
5. **Referral-driven, not ad-driven.** Lawyers ask other lawyers "what do you use." Build a simple referral incentive (extra storage/seats for referrals) rather than relying on paid acquisition.
6. **Chartered Accountants and CS professionals adjacent network** — many small law firms share office/referral relationships with CA firms; cross-referral can work but is a secondary channel.
7. **Demo videos, not landing page copy.** Lawyers are skeptical of tech claims. A 90-second screen recording showing "upload 200 PDFs, ask a question, get a cited answer, in an app that has no internet connection" is worth more than any ad copy — because it directly proves the privacy claim visually (show airplane mode / no network calls).

## 6. Messaging — what to say, what to cut

**Cut:**
- "AI-powered" — meaningless now, everyone says it.
- "Revolutionary," "cutting-edge," "next-gen" — lawyers are allergic to hype language, it reads as untrustworthy.
- Long feature lists on the homepage — lawyers scan for one thing: "will this leak my client's data."

**Lead with:**
- "Your files never leave your computer." — one sentence, first thing they see.
- A concrete before/after: "Stop spending 2 hours searching through case files. Ask, get the answer with the source page cited, in seconds."
- Show, don't tell, the offline/local proof — screenshot or video of it working with wifi off is more convincing than any privacy policy page.

## 7. Biggest risks to flag honestly

1. **"Local" is hard to keep true and fast.** Running a capable LLM fully offline on a lawyer's laptop (no GPU, often an old office PC) is a real engineering constraint. If local inference is slow or requires a beefy machine, you'll either compromise on quality or need to sell hardware/an appliance — factor this into your pricing and target segment (firms > solo, since firms can afford a dedicated machine/server).
2. **OCR quality on Indian court documents is a known hard problem** — scanned orders, poor print quality, regional language mixed with English, stamps/seals overlapping text. If your document organization/retrieval breaks on real-world Indian court PDFs, word will spread fast in a small professional community. Test on real scanned cause-lists and orders, not clean PDFs, before any demo.
3. **Trust is binary and slow to build, fast to lose.** One lawyer telling their bar association WhatsApp group "this leaked/lost my file" kills you in that region. Given how small and networked the Indian legal community is per-city, reputation risk is existential-level, not just a churn risk.
4. **You are currently pre-frontend, pre-real-users.** Before spending a rupee on marketing, get 5-10 lawyers (even friends/family in the profession, or your local bar association) using it for free and get brutally honest feedback. Marketing without product-market signal is just expensive noise.

## 8. Concrete next steps, in order

1. Finish the actually-local architecture (no OpenAI/Supabase calls) — this is your entire pitch, don't market before it's true.
2. Pick ONE beachhead segment: recommend **small litigation firms (2-15 lawyers) in a single city** you have personal access to (network effect within one bar association) — not "all lawyers in India."
3. Get 5-10 free pilot users from your own network. Collect specific failure cases (bad OCR, slow retrieval, wrong answers) and fix before wider release.
4. Build one sharp demo video proving the privacy/offline claim visually.
5. Get one write-up/mention on Bar & Bench or LiveLaw once you have real pilot users to cite (not before — "coming soon" pitches get ignored).
6. Price as one-time/annual-license, not monthly SaaS, to match Indian buyer psychology and your low marginal cost as a local-only product.
7. Grow city-by-city through bar association relationships and referrals, not broad digital ads.

---

## 9. Phased GTM plan — for once local implementation is done

Assumes: the app runs fully offline (local LLM + local embeddings + local vector store, verifiable with wifi off), and you have a working desktop/installable build for at least Windows (most Indian lawyers/office PCs are Windows, not Mac).

### Phase 0 — Pre-launch proof (2-4 weeks, 0 rupees spent on marketing)

Goal: get from "it works on my machine" to "it survives contact with a real lawyer's real mess of PDFs."

- Recruit 5-10 pilot users from your own network only (family friends, seniors from law school, anyone in the profession you can call directly). Do not go wider than your direct network yet.
- Give it to them for free, in person if possible — sit with them for the first session. Watch where they get confused; don't explain, just watch.
- Explicitly test on their worst documents: scanned court orders, mixed English/regional-language filings, low-quality photocopies. This is where it will break.
- Track three numbers only: (1) did they come back and use it a second time unprompted, (2) how long from install to "aha, useful," (3) what specifically broke.
- Kill criterion: if fewer than half of pilot users use it unprompted in week 2, the product isn't ready for GTM spend yet — go back to product, not marketing.
- Output of this phase: 2-3 lawyers willing to be a named reference/testimonial, and a fixed list of the top failure modes.

### Phase 1 — Single-city beachhead (Month 1-3)

Goal: dense adoption in one bar association, not broad thin adoption.

- Pick the one city where you have the strongest personal/family/alumni access to the local bar association. Density beats geography here — 20 lawyers in one city talking to each other is worth more than 20 lawyers scattered across India.
- Offer a **free tier or heavily discounted founder pricing** to the first ~50 sign-ups in that city, framed as "founding members" — gives you a reason to ask for feedback and testimonials, and gives them a reason to feel early/special rather than sold-to.
- Do a live demo at one bar association meeting or a small lawyers' WhatsApp-group-organized meetup — show it working with the laptop's wifi visibly off. This single visual is your strongest sales asset; use it in every subsequent pitch too.
- Get one or two pilot users to informally introduce you to 2-3 more lawyers each (warm referral, not a formal "referral program" yet — too early for incentives/mechanics).
- Start collecting structured testimonials/quotes now, even short ones ("saved me an afternoon on the Sharma case") — you'll need these for Phase 2 press.

### Phase 2 — Credibility layer (Month 3-5)

Goal: convert local traction into something a stranger-lawyer in another city would trust.

- Pitch Bar & Bench and/or LiveLaw for a feature or product write-up, now that you have real named users and quotes to cite — "coming soon" pitches get ignored, "20 lawyers in [city] are already using this" gets read.
- Publish the offline-proof demo video (90 seconds, wifi off, real document, real citation) on LinkedIn — post it yourself and ask your Phase 1 users to share/comment, since lawyer LinkedIn is trust-network-driven, not algorithm-driven.
- Write one sharp, concrete piece (not a generic blog post) framed around DPDP Act obligations for lawyers and why cloud AI tools put them at compliance risk — this is a fear-based hook that's true and specific to right now, not evergreen fluff.
- Start light SEO/content only around search terms lawyers actually type when frustrated: "organize case files," "AI for law firm India," "DPDP compliant legal software" — low volume but high intent, cheap to rank for since competition is thin.

### Phase 3 — Second and third city expansion (Month 5-9)

Goal: repeat the beachhead playbook, now with proof assets, without turning into broad ad spend.

- Expand to 2 more cities, prioritizing ones where a Phase 1 user has a personal connection (moved firms, has friends at another bar association, etc.) — always ride an existing trust edge, never cold.
- Introduce a real referral program now that you have enough users to make it worth formalizing: e.g., extra storage/seats or a discount for both referrer and referee.
- Start a small, targeted LinkedIn ad spend (not Google/Meta broad ads) aimed narrowly at "lawyer" + city job-title targeting, retargeting people who watched the demo video — LinkedIn ads are expensive per click but your audience is precise enough that it's still efficient at this scale.
- Consider a light integration/partnership angle: CA firms, legal process outsourcing (LPO) shops, or law-firm-management tool vendors who already have lawyer trust — a co-marketing mention from one of these is worth more than an ad.

### Phase 4 — Firm-tier sales motion (Month 6-12, can overlap Phase 3)

Goal: move from individual solo-lawyer adoption to selling into firms (5-50 lawyers), where the real revenue is.

- By now you should have enough individual users inside firms that a "your associates are already using this, want firm-wide licensing?" conversation opens itself — this is a much easier sale than cold outbound.
- Build one simple case study PDF (not a slide deck) per firm-size segment: solo practitioner, small litigation firm, corporate/transactional firm — each with a different top pain point (time saved searching, DPDP compliance, associate onboarding speed).
- Price firm deals as annual license + per-seat, sold via a real conversation with the managing partner — not self-serve checkout. Indian firm purchasing at this level is relationship-based; expect a sales cycle measured in weeks, not a same-day signup.
- Only now consider a small inside-sales/BD hire if volume justifies it — don't hire for sales before Phase 1-3 have proven the playbook works with just you.

### What NOT to do at any phase

- Don't run broad Google/Meta ad campaigns targeting "lawyers" generally — CPCs will be wasted on students, unrelated searchers, and low-intent traffic; this audience doesn't convert off cold ads.
- Don't discount the offline-proof video/demo in favor of written claims — every phase above leans on the same visual proof asset because it's the one thing competitors with cloud architecture literally cannot replicate on stage.
- Don't skip straight to Phase 3-4 city/firm expansion before Phase 0-1 testimonials exist — an Indian lawyer's first question to a new vendor is usually "who else is using this," and "nobody yet" kills the conversation.
- Don't let pricing experiments (free tier, founder pricing, discounts) run past Phase 2 without a plan to convert them to paid — free users who never had a real conversion path become dead weight.
