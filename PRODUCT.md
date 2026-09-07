# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are hiring managers, recruiters, and technical leaders evaluating Dave Bettner for customer-facing AI-agent deployment roles, especially forward-deployed engineering, solutions engineering, and implementation work. They need to understand who Dave is, the work he can own with customers, and the evidence behind that positioning within seconds.

## Product Purpose

This site is Dave Bettner’s employer-independent professional profile and public proof index. It should make his enterprise-agent deployment direction legible, connect that direction to a decade-plus customer-delivery record, and give visitors direct paths to inspect work, review experience, download the résumé, or start a conversation.

Success means a qualified visitor can quickly identify Dave, understand his target lane, distinguish customer-delivery experience from recent public engineering proof, and take the next step without decoding a product narrative.

## Positioning

Dave combines long-running customer-facing implementation and regulated-workflow delivery with recent hands-on public AI-agent engineering. Finance, audit, and assurance are his strongest vertical proof, not his whole identity. The site must preserve honest boundaries around production-software depth, client environments, affiliations, and public-lab evidence.

## Operating Context

The profile is evaluated during recruiting, role-fit review, professional networking, and technical diligence. Visitors inspect the homepage, résumé, employment timeline, GitHub repositories, public project evidence, and role-fit tool on desktop and mobile.

## Capabilities and Constraints

- The homepage leads with Dave’s identity, enterprise-agent deployment lane, concise claim, real portrait, and direct actions.
- Existing routes and working actions remain available: Work, Experience, First 90 Days (`/fit/`), About, résumé download, email, GitHub, and LinkedIn.
- Public proof includes the Hermes Deployment Lab, Hermes Enterprise Evaluation Kit, and Regulated Reporting MCP, with provenance and claim limits intact.
- Customer-delivery evidence spans statutory reporting, GRC/reporting implementations, and HIPAA imaging integrations.
- The portrait must use Dave’s supplied source pixels. Do not regenerate, composite, reshape, or replace his face, head, neck, body, suit, pose, or crop with synthetic content.
- Do not imply that public labs are client tenants, production-engineering tenure, or Nous/Hermes Enterprise affiliation.
- Do not use a governing product, cable, rack, routing, workflow, or infrastructure metaphor. Dave is the subject.

## Brand Commitments

- Name: Dave Bettner.
- Identity: profile-first forward-deployed technical leader; employer-independent and human-centered.
- Voice: direct, credible, technically specific, concise, and honest about evidence boundaries.
- Positioning priority: enterprise-agent deployment first; finance and assurance as proof.
- The homepage uses the approved source cutout at `public/images/dave-bettner-headshot-20260816-cutout.png`; portrait assets and source pixels must not be altered.
- Location and employment history preserve Chicago followed by current Des Moines; current title is Senior Manager; omit “Remote” from job locations.

## Evidence on Hand

- Current homepage and verified copy: `src/pages/index.astro`.
- Current portrait: `public/images/dave-bettner-headshot-portrait.webp`.
- Employment and project data in `src/data/` and the existing route implementations.
- Résumé: `public/dave-bettner-resume.pdf` and its source under `resume/`.
- Public engineering links and bounded claims are already encoded in the homepage and verification suite.
- No testimonials, client logos, private client artifacts, production usage metrics, or unsupported performance claims may be fabricated.

## Product Principles

1. Identity before framework: visitors meet Dave before any method or proof system.
2. Deployment before domain: enterprise-agent implementation leads; finance and assurance substantiate it.
3. Proof with boundaries: every technical or customer-delivery claim remains inspectable and honestly scoped.
4. Judgment stays visible: the site demonstrates how Dave works without turning a process diagram into the identity.
5. Short path to action: résumé, work, experience, the First 90 Days field plan, and contact remain easy to find.

## Public Route System

The Working Record is the sole public theme, defined in one shared stylesheet (`public/styles/working-record.css`) and one shared masthead component (`src/components/Masthead.astro`). Home, Work, every Work detail, Experience, About, `/fit/`, and 404 all load that stylesheet and that masthead: a compact "Dave Bettner" brand, primary navigation limited to Work, Experience, and About with `aria-current`, and quiet résumé/email utilities. Narrow viewports reach every destination through a native, JS-free `<details>` disclosure rather than a second navigation system. `/fit/` stays off primary navigation but remains reachable from the shared footer on every route. Preview and mockup routes remain separate, non-indexed, isolated surfaces and do not load the public stylesheet.

## Accessibility & Inclusion

The site must remain keyboard navigable, responsive, motion-safe under `prefers-reduced-motion`, readable at common desktop and mobile sizes, and free of document-level horizontal overflow. Portrait effects must preserve a legible source image when animation or canvas features are unavailable.
