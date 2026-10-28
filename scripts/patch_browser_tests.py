from pathlib import Path
import json

# Remove obsolete tests for the former service/resource dialog design.
p = Path('tests/site-browser.test.mjs')
source = p.read_text()
marker = "\ntest('service and resource examples open in accessible in-site dialogs on desktop and mobile'"
source = source.split(marker, 1)[0] + '\n'
source = source.replace('#appointmentRequestResult a[href="#recursos"]', '#appointmentRequestResult a[href="recursos.html"]')
source = source.replace('#navMenu a[href="#recursos"]', '#navMenu a[href="recursos.html"]')
p.write_text(source)

# Services are informational cards, without per-service dialog controls.
p = Path('tests/site-smoke.test.mjs')
source = p.read_text()
marker = "\ntest('services open in-site detail dialogs instead of jumping to appointment form'"
index = source.find(marker)
if index != -1:
    source = source[:index].rstrip() + '\n'
p.write_text(source)

# Update the deployed-flow audit to use the separate resource page.
p = Path('tests/production-flow-audit.mjs')
source = p.read_text().replace('#appointmentRequestResult a[href="#recursos"]', '#appointmentRequestResult a[href="recursos.html"]')
p.write_text(source)

# Keep resource text contrast and mobile layout fixes idempotent.
css = Path('css/styles.css')
source = css.read_text()
overrides = """
/* Resource catalog contrast and narrow-screen overflow fixes. */
.resources-library-page .resource-tile b { color: #3b4d51; opacity: 1; }
.resources-library-page .resource-category-heading > span { color: #526568; opacity: 1; }
.resources-library-page .resources-disclaimer { color: #526568; opacity: 1; }
.resources-library-header { flex-wrap: wrap; gap: .75rem; }
.resources-brand { min-width: 0; }
.resources-brand span { overflow-wrap: anywhere; }
.resources-library-page, .resources-library, .resources-catalog { min-width: 0; }
"""
if 'Resource catalog contrast and narrow-screen overflow fixes' not in source:
    source += overrides
grid_fix = "\n/* Keep the mobile resource sidebar inside the viewport; grid 1fr must have a zero minimum. */\n@media (max-width: 900px) { .resources-library { grid-template-columns: minmax(0, 1fr); } .resources-sidebar { min-width: 0; width: 100%; } .resources-sidebar nav { min-width: 0; max-width: 100%; } }\n"
if 'grid 1fr must have a zero minimum' not in source:
    source += grid_fix
css.write_text(source)

# Keep the served minified stylesheet synchronized.
minified = Path('css/styles.min.css')
min_source = minified.read_text()
min_overrides = '.resources-library-page .resource-tile b{color:#3b4d51;opacity:1}.resources-library-page .resource-category-heading>span{color:#526568;opacity:1}.resources-library-page .resources-disclaimer{color:#526568;opacity:1}.resources-library-header{flex-wrap:wrap;gap:.75rem}.resources-brand{min-width:0}.resources-brand span{overflow-wrap:anywhere}.resources-library-page,.resources-library,.resources-catalog{min-width:0}'
if '.resources-library-header{flex-wrap:wrap;gap:.75rem}' not in min_source:
    min_source = min_source.rstrip() + min_overrides
min_grid_fix = '@media(max-width:900px){.resources-library{grid-template-columns:minmax(0,1fr)}.resources-sidebar{min-width:0;width:100%}.resources-sidebar nav{min-width:0;max-width:100%}}'
if 'grid 1fr must have a zero minimum' not in min_source:
    min_source = min_source.rstrip() + min_grid_fix
minified.write_text(min_source.rstrip() + '\n')

# Keep npm scripts aligned with the actual test files.
package = Path('package.json')
data = json.loads(package.read_text())
data['scripts']['test'] = 'node --test tests/site-smoke.test.mjs tests/resources-redesign.test.mjs'
data['scripts']['test:e2e'] = 'node --test tests/site-browser.test.mjs tests/resources-browser.test.mjs'
package.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
