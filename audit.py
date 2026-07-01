import re
from collections import Counter

with open('src/renderer/index.html', encoding='utf-8') as f:
    content = f.read()

script_start = content.find('<script>')
script_end   = content.rfind('</script>')
body_close   = content.rfind('</body>')
html_close   = content.rfind('</html>')
init_idx     = content.rfind('init();')
js = content[script_start+8:script_end]

sl = lambda idx: content[:idx].count('\n') + 1
order_ok = sl(script_start) < sl(init_idx) < sl(script_end) < sl(body_close) < sl(html_close)
ob = js.count('{'); cb = js.count('}')
bt = js.count('`')
funcs = re.findall(r'function (\w+)\s*\(', js)
dupes = {k:v for k,v in Counter(funcs).items() if v > 1}
confirms = len(re.findall(r'(?<!\w)confirm\(', js))
csp_ok = "script-src 'self' 'unsafe-inline'" in content
key = ['nav','init','openAddTask','openEditTask','saveTask',
       'openModalEl','closeModal','announce']
missing = [f for f in key if f'function {f}(' not in js]

checks = {
    'Document order'  : order_ok,
    'Single script'   : content.count('<script') == 1,
    'Brace balance'   : ob == cb,
    'Backticks even'  : bt % 2 == 0,
    'No duplicates'   : not dupes,
    'No confirm()'    : confirms == 0,
    'One init() call' : content.count('init();') == 1,
    'Key functions'   : not missing,
    'CSP allows JS'   : csp_ok,
}

for name, ok in checks.items():
    print(f"{'OK' if ok else 'FAIL'} {name}")

if dupes:       print(f"   Duplicates: {dupes}")
if missing:     print(f"   Missing: {missing}")
if ob != cb:    print(f"   Braces: {ob} open / {cb} close")

all_ok = all(checks.values())
print(f"\nVERDICT: {'PASS - safe to build' if all_ok else 'FAIL - fix before building'}")
