from pathlib import Path

# The redesign removed service triggers/dialogs from the homepage. Remove the
# obsolete browser test block that still asserted the old interaction.
p = Path('tests/site-browser.test.mjs')
s = p.read_text()
marker = "\ntest('service and resource examples open in accessible in-site dialogs on desktop and mobile'"
s = s.split(marker, 1)[0] + '\n'
p.write_text(s)

# Keep the static smoke suite aligned with the current product decisions:
# services are informational cards with no per-service controls, while the
# resource library is a separate page with anchored catalog cards.
q = Path('tests/site-smoke.test.mjs')
s = q.read_text()
old_service = "\ntest('services open in-site detail dialogs instead of jumping to appointment form'"
old_resource = "\ntest('every resource category and format has an in-site example and a working dialog trigger'"
start_service = s.find(old_service)
if start_service != -1:
    s = s[:start_service].rstrip() + '\n'
q.write_text(s)

# The deployed-flow audit must follow the redesigned resource destination.
r = Path('tests/production-flow-audit.mjs')
s = r.read_text()
s = s.replace("page.locator('#appointmentRequestResult a[href=\"#recursos\"]')", "page.locator('#appointmentRequestResult a[href=\"recursos.html\"]')")
s = s.replace("assert.equal(await page.locator('#appointmentRequestResult a[href=\"#recursos\"]').count(), 1, 'Free resources link must remain available');", "assert.equal(await page.locator('#appointmentRequestResult a[href=\"recursos.html\"]').count(), 1, 'Free resources link must remain available');")
s = s.replace("await page.locator('#appointmentRequestResult a[href=\"#recursos\"]')", "await page.locator('#appointmentRequestResult a[href=\"recursos.html\"]')")
r.write_text(s)

# Preserve the existing npm scripts while keeping the JSON formatting stable.
import json
data = json.loads(Path('package.json').read_text())
data['scripts']['test'] = 'node --test tests/site-smoke.test.mjs tests/resources-redesign.test.mjs'
data['scripts']['test:e2e'] = 'node --test tests/site-browser.test.mjs tests/resources-browser.test.mjs'
Path('package.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
