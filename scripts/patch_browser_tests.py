from pathlib import Path

# The redesign removed service triggers/dialogs from the homepage. Remove the
# obsolete browser test block that still asserted the old interaction.
p = Path('tests/site-browser.test.mjs')
s = p.read_text()
marker = "\ntest('service and resource examples open in accessible in-site dialogs on desktop and mobile'"
s = s.split(marker, 1)[0] + '\n'
# The appointment result now links to the separate resource library page.
s = s.replace("#appointmentRequestResult a[href=\"#recursos\"]", "#appointmentRequestResult a[href=\"recursos.html\"]")
p.write_text(s)

# Keep the static smoke suite aligned with the current product decisions:
# services are informational cards with no per-service controls, while the
# resource library is a separate page with anchored catalog cards.
q = Path('tests/site-smoke.test.mjs')
s = q.read_text()
old_service = "\ntest('services open in-site detail dialogs instead of jumping to appointment form'"
start_service = s.find(old_service)
if start_service != -1:
    s = s[:start_service].rstrip() + '\n'
q.write_text(s)

# The deployed-flow audit must follow the redesigned resource destination.
r = Path('tests/production-flow-audit.mjs')
s = r.read_text().replace("#appointmentRequestResult a[href=\"#recursos\"]", "#appointmentRequestResult a[href=\"recursos.html\"]")
r.write_text(s)

# Make the resource catalog contrast-safe. The original catalog used opacity
# on text, which Axe correctly flags as a contrast failure in the rendered page.
css = Path('css/styles.css')
source = css.read_text()
overrides = "\n/* Resource catalog contrast overrides: avoid opacity on text-bearing elements. */\n.resources-library-page .resource-tile b { color: #3b4d51; opacity: 1; }\n.resources-library-page .resource-category-heading > span { color: #526568; opacity: 1; }\n.resources-library-page .resources-disclaimer { color: #526568; opacity: 1; }\n"
responsive = "\\n/* Prevent the resource library header from overflowing narrow viewports. */\\n.resources-library-header { flex-wrap: wrap; gap: .75rem; }\\n.resources-brand { min-width: 0; }\\n.resources-brand span { overflow-wrap: anywhere; }\\n.resources-library-page, .resources-library, .resources-catalog { min-width: 0; }\\n"
if 'Resource catalog contrast overrides' not in source:
    source += overrides
if 'Prevent the resource library header from overflowing narrow viewports' not in source:
    source += responsive
css.write_text(source)

# Keep the served minified stylesheet in sync without introducing a new build dependency.
minified = Path('css/styles.min.css')
min_source = minified.read_text()
min_overrides = '.resources-library-page .resource-tile b{color:#3b4d51;opacity:1}.resources-library-page .resource-category-heading>span{color:#526568;opacity:1}.resources-library-page .resources-disclaimer{color:#526568;opacity:1}.resources-library-header{flex-wrap:wrap;gap:.75rem}.resources-brand{min-width:0}.resources-brand span{overflow-wrap:anywhere}.resources-library-page,.resources-library,.resources-catalog{min-width:0}'
if min_overrides not in min_source:
    minified.write_text(min_source.rstrip() + min_overrides + '\n')

# Preserve the existing npm scripts while keeping the JSON formatting stable.
import json
data = json.loads(Path('package.json').read_text())
data['scripts']['test'] = 'node --test tests/site-smoke.test.mjs tests/resources-redesign.test.mjs'
data['scripts']['test:e2e'] = 'node --test tests/site-browser.test.mjs tests/resources-browser.test.mjs'
Path('package.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
