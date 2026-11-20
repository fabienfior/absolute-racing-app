# Bundles the web export (dist/) into one self-contained HTML file for sharing a preview.
# Usage: npx expo export -p web && python3 scripts/build-preview.py dist preview.html
import re, base64, glob, sys, os
dist, out = sys.argv[1], sys.argv[2]
js = open(glob.glob(dist + '/_expo/static/js/web/entry-*.js')[0]).read()
css = open(glob.glob(dist + '/_expo/static/css/*.css')[0]).read()
def repl(m):
    p = m.group(1)
    if 'vector-icons' in p and 'Ionicons' not in p:
        return m.group(0)
    data = open(dist + p, 'rb').read()
    mime = 'image/png' if p.endswith('.png') else 'font/ttf'
    return '"data:%s;base64,%s"' % (mime, base64.b64encode(data).decode())
js = re.sub(r'"(/assets/[^"]+\.(?:png|ttf))"', repl, js)
js = js.replace('</script', '<\\/script')
html = '''<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Absolute Racing App</title>
<style>html,body{height:100%%;margin:0;background:#fff}@media (prefers-color-scheme: dark){html,body{background:#0B0C0F}}body{overflow:hidden}#root{display:flex;height:100%%;flex:1}%s</style>
<script>try{if(location.pathname!=="/")history.replaceState(null,"","/")}catch(e){}</script>
</head><body><div id="root"></div><script>%s</script></body></html>''' % (css, js)
open(out, 'w').write(html)
print(len(html))
