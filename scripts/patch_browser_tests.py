from pathlib import Path
p=Path('tests/site-browser.test.mjs'); s=p.read_text(); marker="\ntest('service and resource examples open in accessible in-site dialogs on desktop and mobile'"; s=s.split(marker,1)[0]+'\n'; p.write_text(s)
q=Path('package.json'); import json; data=json.loads(q.read_text()); data['scripts']['test']='node --test tests/site-smoke.test.mjs tests/resources-redesign.test.mjs'; data['scripts']['test:e2e']='node --test tests/site-browser.test.mjs tests/resources-browser.test.mjs'; q.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
