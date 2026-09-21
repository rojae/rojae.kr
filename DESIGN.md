# Design

## Source of truth
- Status: Active, 2026-09-21.
- Surfaces: homepage, project case studies, web resume, four PDF exports.
- Evidence: `tools/content.mjs`, `tools/build.mjs`, `style.css`, `tools/make-resume-pdf.mjs`, browser review and rendered PDF.

## Audience and intent
Backend hiring reviewers need to identify domain experience, personal responsibility, engineering decisions, and supporting evidence quickly. This is a career portfolio, not a product landing page.

## Visual language
Keep the white/charcoal foundation, blue links, green outcomes, real portrait, existing type scale and 8px card corners. Use consistent text-only homepage project cards; do not use a miniature README as product imagery. Preserve dark mode and reduced motion.

## Information hierarchy
- Homepage: identity, three selected projects, other work, career, public contributions, writing, working practices, contact.
- Case study: responsibility and outcome, problem, decisions, architecture and implementation details. Preserve existing section anchors.
- Resume: concise overview, personal decisions in selected projects, compressed supporting work, public contributions and skills. Additional operational history is available through a native disclosure.
- Default PDF: two deliberately balanced pages. Page one holds the current employer's selected projects; page two holds supporting experience, open source and skills.

## Content constraints
Use only supported facts. Keep daily affiliate consent at approximately 500 people; this is not API throughput. Preserve personal versus team scope and manual routing versus automatic failover. Do not invent baseline periods or traffic-normalized savings. OSS publication and POC are not production adoption.

## Components and accessibility
Reuse project cards, lists, native links/details, diagrams and the existing lightbox. Keep text selectable, headings ordered, keyboard focus visible and touch controls reachable. No new dependencies. Preserve PDF download formats, print, email copy and no-JS navigation.

## Cleanup plan and acceptance checks
1. Add regression checks for concise cards, problem-first case studies, operational-history disclosure and concrete OSS evidence.
2. Remove duplicated summaries/media, compact metadata and move technical inventories after the narrative.
3. Reuse resume-builder templates without changing their source data; expand selected project decisions and balance the compact PDF across two pages.
4. Run content/publishing tests and browser checks at 320, 375, 390, 768, 1024 and 1440px. Visually inspect light/dark screens and every PDF format.
5. Card trailing whitespace under 80px; 390px homepage below 6200px and collapsed web resume below 7500px. No clipping, broken local links or missing images.

## Open evidence questions
- Comparison periods and aggregation basis for authentication cost and CS reductions are not documented. Omit the percentages until those comparisons can be supported.
- Authentication has five types, with ID/password and social authentication grouped under information authentication. The UUID session and administrator-defined validity are shared across types.
- Affiliate Gateway route and Nginx entry separation are user-confirmed design decisions for security policy, monitoring and future partners; the diagram does not claim a verified firewall topology.
- The public Studio demo returned 404 during this review. Use an actual, inspectable screenshot only when available; do not fabricate one.
