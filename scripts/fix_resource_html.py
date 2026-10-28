from pathlib import Path
import re
p=Path('recursos.html'); s=p.read_text()
items={'desarrollo':['Hitos del desarrollo','Observación en casa','Señales para consultar'],'crianza':['Límites que enseñan','Rutina de conexión','Elegir entre dos'],'regulacion':['Antes del momento intenso','Semáforo corporal','Después de una crisis'],'juego':['Clasificar y encontrar','Circuito casero','Historias de tres pasos'],'lecturas':['Qué significa acompañar','Conceptos básicos','Conversar en familia'],'guias':['Registro semanal','Rincón de calma','Actividad de la semana']}
imgs=['assets/img/Niño sobre estimulado.webp','assets/img/Regulacion.webp','assets/img/Duda.webp','assets/img/Zona Gris.webp','assets/img/ayuda.webp','assets/img/Cierre.webp']
for n,(key,names) in enumerate(items.items()):
 cards=[]
 for j,name in enumerate(names,1):
  action='<a href="assets/recursos/registro-semanal.txt" download>Descargar</a>' if name=='Registro semanal' else f'<a href="#{key}-{j}">Ver recurso</a>'
  cards.append(f'<article class="resource-tile"><div class="resource-thumb"><img src="{imgs[(n*3+j-1)%len(imgs)]}" alt="" loading="lazy"></div><b>RECURSO</b><h3>{name}</h3><p>Material educativo y práctico para explorar este tema a tu ritmo.</p>{action}</article>')
 block='<div class="resource-grid">'+''.join(cards)+'</div>'
 s=re.sub(r'<div class="resource-grid">.*?<div id="'+re.escape(key)+r'-1"',block+'<div id="'+key+'-1"',s,count=1,flags=re.S)
p.write_text(s)
