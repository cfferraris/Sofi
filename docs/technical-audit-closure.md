# Piel de Mar — technical audit closure gate

## Scope and release controls

- Working branch: `audit/fix-site-baseline`.
- Pull request: [#1](https://github.com/cfferraris/Sofi/pull/1).
- Staging: `https://sofi-ywgo.onrender.com/`.
- `main` must remain untouched until the user explicitly authorizes the final committee and merge.
- The services/resources content is intentionally not considered closed; the user will redefine that scope separately.

## Status by technical block

| Block | Status | Evidence / next action |
|---|---|---|
| HTTP security headers | Configured in Render; live verification pending | The user confirmed the four staging headers are saved: Referrer-Policy, X-Frame-Options, Permissions-Policy and staging-only X-Robots-Tag. Verify actual HTTP responses for the homepage and static assets. HSTS and X-Content-Type-Options were previously observed. Review CSP compatibility before adding it as a response header. |
| Performance | Partial; image optimization implemented | Navbar isotipo reduced from 22,758 B PNG to 1,708 B WebP (160×160); favicon and Apple touch icon remain PNG. Latest Lighthouse audit: mobile 76, desktop 62; LCP 4.3 s / 3.9 s, CLS 0 / 0.001, TBT 150 ms / 50 ms, FCP 2.9 s / 2.4 s. The optimizer ran twice with identical HTML/CSS/report hashes. Do not claim a stable overall score improvement. LCP element render delay remains about 2.2 s and requires a design-safe follow-up. |
| SEO | HTML staging noindex removed; live verification pending | Removed the `noindex` meta tag from both `index.html` and `privacidad.html` on `audit/fix-site-baseline`. The user confirmed `X-Robots-Tag: noindex, follow` is saved in Render for staging. Verify the live response header and ensure it is not applied to production. The checked `main` branch remains untouched. |
| Accessibility | Automated browser checks pass; manual review pending | Home page, privacy policy and the open service dialog passed the automated WCAG 2.2 A/AA axe checks; browser tests also verified keyboard opening, focus placement, Tab/Shift+Tab, Escape and focus restoration. The successful run used the same site/test code before a generated HTML formatting-only commit. The new commit receives another CI run. A human screen-reader review is still required before claiming full WCAG conformance. |
| Integrated closure | Pending | Run static, browser, staging, Lighthouse and HTTP-header checks on the final branch SHA; verify staging serves the same commit; attach evidence; confirm rollback readiness. |

## Render staging header checklist

Apply to path `/*` in the Render dashboard:

- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Robots-Tag: noindex, follow` (staging only)

User confirmed these headers are saved on the staging service. Verify them on live HTTP responses before marking this block complete. Before adding a response-header CSP, compare the proposed policy with the actual staging console/network behavior. Avoid enforcing a second policy without checking external resources, inline styles, dialogs and generated download behavior.

After changing headers, verify the actual response headers for the homepage and static assets. A meta tag alone is not evidence that a response header exists.

## Verification commands

Run from a terminal with network access:

```sh
curl -sSI https://sofi-ywgo.onrender.com/
curl -sSI https://sofi-ywgo.onrender.com/css/styles.min.css
curl -sSI https://sofi-ywgo.onrender.com/js/main.min.js
```

Check the response header names and values, not only the HTML source. Confirm the staging `X-Robots-Tag` is present and that the production HTML does not contain a `noindex` meta tag before release.

## Deployment and rollback

### Staging

1. Commit only to `audit/fix-site-baseline`.
2. Wait for Render to deploy the branch.
3. Verify the published HTML, CSS and JavaScript correspond to the intended commit.
4. Run the static/browser tests and Lighthouse staging audit.
5. If a branch change causes a regression, create a revert commit for the offending commit on this branch and push it. Verify that Render redeploys the reverted state and rerun the affected tests.

### Production

- Do not merge or deploy to production until the user explicitly authorizes the final committee.
- Before an authorized merge, confirm the staging-only `X-Robots-Tag: noindex, follow` is confined to Render staging configuration and the `noindex` meta tag is absent from both HTML pages.
- Keep the merge SHA, deployment result, header verification and test artifacts together as release evidence.
- Any production rollback must follow the user's explicit authorization and the production deployment controls; do not improvise a merge or mutate `main` from this audit workflow.

## Final acceptance gate

- [ ] Required security headers verified on live HTTP responses.
- [ ] Staging-only noindex verified in Render; noindex absent from production HTML.
- [ ] Latest Lighthouse report reviewed; remaining LCP delay accepted or corrected with a repeatable comparison.
- [ ] Static tests and desktop/mobile Playwright tests pass on the final branch SHA.
- [ ] Dialog axe scan and keyboard/focus checks pass.
- [ ] Staging assets match the intended branch commit.
- [ ] Booking flow verified without sending a real WhatsApp message.
- [ ] Rollback path documented and understood.
- [ ] Privacy policy and business/contact facts reviewed by the responsible person.
- [ ] User authorizes the final committee and any merge to `main`.

A successful automated accessibility score is not, by itself, certification of WCAG 2.2 AA conformance.
