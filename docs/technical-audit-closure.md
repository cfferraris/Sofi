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
| HTTP security headers | Blocked by hosting configuration access | HSTS and X-Content-Type-Options were previously observed. Configure Referrer-Policy, X-Frame-Options and Permissions-Policy in Render. Review CSP compatibility before adding it as a response header. Verify real response headers after configuration. |
| Performance | Partial; image optimization implemented | Navbar isotipo reduced from 22,758 B PNG to 1,708 B WebP (160×160); favicon and Apple touch icon remain PNG. Latest Lighthouse run before the keyboard-test-only commit: mobile 77, desktop 61; LCP 4.2 s / 4.0 s, CLS 0 / 0.001, TBT 170 ms / 0 ms. Do not claim a stable overall score improvement. LCP element render delay remains about 2.2 s and requires a design-safe follow-up. |
| SEO | Diagnosis complete; release condition unresolved | Lighthouse SEO 69 is caused by the staging `noindex` directive. The checked `main` version does not contain that directive, but this branch does. Configure staging-only `X-Robots-Tag: noindex` in Render, verify it, then remove the HTML `noindex` before any merge. Do not merge while this condition is unresolved. |
| Accessibility | Automated keyboard/modal checks added; latest run pending | Home page and privacy policy previously passed the automated WCAG 2.2 A/AA axe scan. New dialog checks cover keyboard opening, focus placement, Tab/Shift+Tab, Escape, focus restoration and an axe scan of the open dialog. Await a successful run on the current commit. A human screen-reader review is still required before claiming full WCAG conformance. |
| Integrated closure | Pending | Run static, browser, staging, Lighthouse and HTTP-header checks on the final branch SHA; verify staging serves the same commit; attach evidence; confirm rollback readiness. |

## Render staging header checklist

Apply to path `/*` in the Render dashboard:

- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Robots-Tag: noindex, follow` (staging only)

Before adding a response-header CSP, compare the proposed policy with the actual staging console/network behavior. Avoid enforcing a second policy without checking external resources, inline styles, dialogs and generated download behavior.

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
- Before an authorized merge, confirm the staging-only `noindex` has been moved to Render configuration and removed from the HTML.
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
