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
| HTTP security headers | **Blocked: staging X-Robots-Tag missing** | The live HTTP audit confirmed Referrer-Policy and X-Frame-Options, then failed because `X-Robots-Tag: noindex, follow` is absent from the staging homepage response. Permissions-Policy, HSTS and X-Content-Type-Options still need the same complete live check. No Render API key is available in GitHub Actions, so the rule could not be repaired automatically. Add the rule in the Render dashboard for the staging service only, path `/*`, value `noindex, follow`; then rerun the live gate. The CSP meta policy remains in HTML; no HTTP CSP header is confirmed. |
| Performance | Lighthouse measured; known LCP delay documented | Navbar isotipo reduced from 22,758 B PNG to 1,708 B WebP (160×160); favicon and Apple touch icon remain PNG. Latest successful Lighthouse run [#65](https://github.com/cfferraris/Sofi/actions/runs/40688730457): mobile Performance 82, desktop 70; Accessibility, Best Practices and SEO 100 on both. Mobile: LCP 4.1 s, CLS 0, TBT 200 ms, FCP 1.0 s. Desktop: LCP 3.9 s, CLS 0.001, TBT 70 ms, FCP 1.0 s. Repeated runs varied materially (Performance mobile 62–82, desktop 53–70), so scores are not stable enough to claim a fixed improvement. Desktop LCP render delay remains about 2.1 s on the intro-slider image; this is tied to the hero/content reveal and should be reviewed during the user's design audit rather than changing animation behavior blindly. [Lighthouse report artifact](https://github.com/cfferraris/Sofi/actions/runs/40688730457/artifacts/12815848658). |
| SEO | HTML staging noindex removed; live verification pending | Removed the `noindex` meta tag from both `index.html` and `privacidad.html` on `audit/fix-site-baseline`. The user confirmed `X-Robots-Tag: noindex, follow` is saved in Render for staging. Verify the live response header and ensure it is not applied to production. The checked `main` branch remains untouched. |
| Accessibility | Static and browser suites passed on latest code snapshot | The latest visible CI run [#472](https://github.com/cfferraris/Sofi/actions/runs/40688730539) passed syntax checks, 26 static tests and five browser tests. Coverage includes desktop/mobile resource catalog navigation, no horizontal overflow, Axe WCAG 2.2 A/AA scans for home/privacy/resources, and the appointment flow with WhatsApp intercepted. Per-service dialogs were removed by product decision, so obsolete dialog tests were removed. Automated checks do not replace a human screen-reader review or certify WCAG conformance. |
| Integrated closure | **One external configuration blocker remains** | Static and browser tests pass; Lighthouse reports are generated; staging assets and the appointment flow are under automated live verification. The live gate remains red solely because the staging `X-Robots-Tag` header is missing. Once the header is added in Render, rerun the live audit to confirm all six response headers, deployed CSS/JS hashes and the appointment flow. Production/main remains untouched. |

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

- [ ] Add `X-Robots-Tag: noindex, follow` to the Render **Sofi staging service** on path `/*`; then rerun the live HTTP-header audit.
- [ ] Staging-only `X-Robots-Tag` verified on the live response; noindex remains absent from production HTML.
- [x] Latest mobile and desktop Lighthouse reports reviewed and uploaded; remaining intro-slider LCP delay documented for the user's design audit.
- [x] Static tests and desktop/mobile Playwright tests passed at SHA `8397f584fb37683c1142cf4c6056ec3702ddb64f`; rerun after final generated-asset updates.
- [x] Resource catalog Axe scan and keyboard/navigation checks pass at the last tested SHA; no homepage service dialogs remain.
- [ ] Staging assets match the intended branch commit.
- [ ] Booking flow verified without sending a real WhatsApp message.
- [ ] Rollback path documented and understood.
- [ ] Privacy policy and business/contact facts reviewed by the responsible person.
- [ ] User authorizes the final committee and any merge to `main`.

A successful automated accessibility score is not, by itself, certification of WCAG 2.2 AA conformance.
