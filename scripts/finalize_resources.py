from pathlib import Path
import re
p=Path('index.html'); h=p.read_text()
h=re.sub(r'\n\s*<dialog id="siteContentDialog".*?</dialog>\n','\n',h,flags=re.S)
p.write_text(h)
r=Path('recursos.html'); s=r.read_text()
imgs=['assets/img/Niño sobre estimulado.webp','assets/img/Regulacion.webp','assets/img/Duda.webp','assets/img/Zona Gris.webp','assets/img/ayuda.webp','assets/img/Cierre.webp']
i=0
def add_thumb(m):
 global i
 src=imgs[i%len(imgs)]; i+=1
 return f'<article class="resource-tile"><div class="resource-thumb"><img src="{src}" alt="" loading="lazy">' + m.group(1)
s=re.sub(r'<article class="resource-tile">(.*?)</article>',add_thumb,s,flags=re.S)
r.write_text(s)
css=Path('css/styles.css'); c=css.read_text()
if '.resource-thumb' not in c:
 c+='''.resource-thumb{height:125px;margin:-1.3rem -1.3rem 1rem;overflow:hidden;border-radius:1rem 1rem 0 0;background:#e8ece8}.resource-thumb img{width:100%;height:100%;object-fit:cover;display:block}.resource-tile h3{line-height:1.2}.resources-library-page .resource-tile{overflow:hidden}\n'''
css.write_text(c)
