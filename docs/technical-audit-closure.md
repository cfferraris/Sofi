# Piel de Mar — technical audit closure gate

## Scope and release controls

- Working branch: `audit/fix-site-baseline`.
- Pull request: [#1](https://github.com/cfferraris/Sofi/pull/1).
- Staging: `https://sofi-ywgo.onrender.com/`.
- `main` must remain untouched until the user explicitly authorizes the final committee and merge.
- Services/resources scope is now defined and implemented: service cards are informational with no per-service buttons; Resources opens in a new tab as a responsive catalog with a left-side anchored category menu, six sections and 18 resource cards. Visual-design approval remains with the user.

## Status by technical block

| Block | Status | Evidence / next action |
|---|---|---|
| HTTP security headers | Automated live verification added; final staging run pending | The live flow audit now asserts Referrer-Policy, X-Frame-Options, Permissions-Policy, staging-only X-Robots-Tag, HSTS and X-Content-Type-Options on the staging homepage and records whether an HTTP CSP header exists. The CSP meta policy remains in HTML; do not claim an HTTP CSP header exists unless the report confirms it. |
| Performance | Image optimization implemented; final Lighthouse report pending | Navbar isotipo reduced from 22,758 B PNG to 1,708 B WebP (160×160); favicon and Apple touch icon remain PNG. Earlier Lighthouse baseline: mobile 76, desktop 62; LCP 4.3 s / 3.9 s, CLS 0 / 0.001, TBT 150 ms / 50 ms, FCP 2.9 s / 2.4 s. The existing Lighthouse workflow runs mobile and desktop audits and uploads JSON/HTML reports. Use its latest run for final numbers; staging `noindex` can affect the SEO score. |
| SEO | HTML staging noindex removed; live verification pending | Removed the `noindex` meta tag from both `index.html` and `privacidad.html` on `audit/fix-site-baseline`. The user confirmed `X-Robots-Tag: noindex, follow` is saved in Render for staging. Verify the live response header and ensure it is not applied to production. The checked `main` branch remains untouched. |
| Accessibility | Static and browser suites passed at SHA `8397f584fb37683c1142cf4c6056ec3702ddb64f`; final SHA rerun pending | 26 static tests and five browser tests passed, including desktop/mobile resource catalog navigation, horizontal-overflow checks, Axe WCAG 2.2 A/AA scans for home/privacy/resources, and appointment flow with WhatsApp intercepted. Per-service dialogs were removed by product decision, so their obsolete tests were removed. Automated checks do not replace a human screen-reader review or certify WCAG conformance. |
| Integrated closure | Pending final deployed evidence | Static and browser tests pass on the last tested code snapshot. Finish the live staging audit and latest Lighthouse run against the final branch SHA, confirm the deployed assets match, then record results and rollback readiness. |

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

- [ ] Required security headers verified on live HTTP responses by the staging audit.
- [ ] Staging-only noindex verified in Render; noindex absent from production HTML.
- [ ] Latest mobile and desktop Lighthouse reports reviewed; remaining LCP delay accepted or corrected with a repeatable comparison.
- [x] Static tests and desktop/mobile Playwright tests passed at SHA `8397f584fb37683c1142cf4c6056ec3702ddb64f`; rerun after final generated-asset updates.
- [x] Resource catalog Axe scan and keyboard/navigation checks pass at the last tested SHA; no homepage service dialogs remain.
- [ ] Staging assets match the intended branch commit.
- [ ] Booking flow verified without sending a real WhatsApp message.
- [ ] Rollback path documented and understood.
- [ ] Privacy policy and business/contact facts reviewed by the responsible person.
- [ ] User authorizes the final committee and any merge to `main`.

A successful automated accessibility score is not, by itself, certification of WCAG 2.2 AA conformance.
