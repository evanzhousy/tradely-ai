"""Build original flat owl variants and Figma-ready brand boards from the canonical SVG."""
from pathlib import Path
from html import escape
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'apps/web/public/brand/owl'
DOC = ROOT / 'docs/brand/owl-series'
source = (ROOT / 'apps/web/public/brand/tradely-mark.svg').read_text()
base = re.sub(r'<svg[^>]*>|</svg>|<title>.*?</title>', '', source, flags=re.S).strip()
EYES = '<g fill="#171714">\n    <ellipse cx="45" cy="53" rx="7" ry="9"/>\n    <ellipse cx="83" cy="53" rx="7" ry="9"/>\n  </g>'
RIGHT = '<path d="M104 65Q117 67 116 84Q115 105 101 109Q95 110 96 102L100 70Q100 65 104 65Z"/>'
BROWN='#794829';INK='#171714';PAPER='#FDFCF8';CREAM='#FFF9EB';YELLOW='#FFD23F'

def svg(inner,w,h,title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" fill="none"><title>{escape(title)}</title>{inner}</svg>'
def text(x,y,value,size=18,color=INK,weight=400):
    return f'<text x="{x}" y="{y}" font-family="Inter, sans-serif" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(value)}</text>'
def rect(x,y,w,h,fill,rx=0):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"/>'
def line(x1,y1,x2,y2,color=BROWN,width=3):
    return f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>'

poses = {}
poses['ready']=base
poses['curious']=base.replace(EYES,'<g fill="#171714"><ellipse cx="49" cy="50" rx="7" ry="9"/><ellipse cx="87" cy="50" rx="7" ry="9"/></g>')
poses['curious']='<g transform="rotate(-8 64 70)">'+poses['curious']+'</g>'
poses['reading']=base.replace('cy="53"','cy="57"')+f'<path d="M29 84Q47 80 64 89Q81 80 99 84V113Q81 109 64 118Q47 109 29 113Z" fill="{CREAM}" stroke="{BROWN}" stroke-width="4" stroke-linejoin="round"/>'+line(64,89,64,117)+line(37,93,53,95)+line(37,102,53,104)+line(75,95,91,93)+line(75,104,91,102)
poses['thinking']=base.replace('cy="53"','cy="48"')+f'<circle cx="111" cy="9" r="4" fill="{BROWN}"/><circle cx="124" cy="1" r="5" fill="{BROWN}"/><circle cx="139" cy="-4" r="6" fill="{BROWN}"/>'
poses['complete']=base.replace(EYES,f'<path d="M37 55Q45 43 53 55M75 55Q83 43 91 55" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>')+f'<circle cx="109" cy="103" r="17" fill="{BROWN}"/><path d="m101 103 6 6 11-13" stroke="{CREAM}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
poses['welcome']=base.replace(RIGHT,'<path d="M100 68Q113 60 113 40Q113 33 119 35Q130 41 125 61Q120 80 106 85Q101 85 100 78Z"/>')+line(128,27,134,19)+line(137,39,145,36)

for name,body in poses.items():
    (OUT / f'{name}.svg').write_text(svg('<g transform="translate(12 28)">'+body+'</g>',168,168,'Tradely owl / '+name))
def owl(name,x,y,size):
    return f'<g transform="translate({x} {y}) scale({size/168})"><g transform="translate(12 28)">{poses[name]}</g></g>'

# Standalone product illustration cards, with editable SVG text and geometry.
cards=[('welcome','Start with curiosity.','One clear question is enough to begin.','Explore the free foundations'),('thinking','A blank page. A fresh question.','Choose a lesson to start your research notes.','Browse the curriculum'),('complete','One step further.','Review what you learned, then keep going.','Continue learning')]
card_art={}
for name,title,body,cta in cards:
    art=rect(0,0,600,420,PAPER,24)+owl(name,210,20,180)+text(40,246,title,27,INK,600)+text(40,282,body,18,'#69665C')+rect(40,321,520,58,YELLOW,12)+text(66,357,cta,18,INK,600)
    card_art[name]=art
    (DOC/f'card-{name}.svg').write_text(svg(art,600,420,'Tradely / '+name+' card'))

social=rect(0,0,1200,630,INK)+rect(60,60,136,34,YELLOW,17)+text(77,83,'TRADELY.AI',15,INK,600)+text(60,218,'A little curiosity.',68,CREAM,600)+text(60,300,'A better question.',68,CREAM,600)+text(62,384,'Observe. Question. Verify.',26,CREAM)+text(62,552,'The options field guide.',20,YELLOW)+owl('reading',825,145,330)
(DOC/'social-learning.svg').write_text(svg(social,1200,630,'Tradely / Learning social card'))

# A single presentation board; each export above remains independently reusable.
board=rect(0,0,1440,2400,PAPER)
board+=rect(0,0,1440,330,INK)+text(64,65,'TRADELY.AI / OWL BRAND SERIES / 02',14,YELLOW,600)+text(64,150,'Curiosity, in character.',64,CREAM,600)+text(67,219,'One owl. Six ways to guide the next step.',24,CREAM)+text(67,272,'Flat vector assets · shared anatomy · purposeful expressions',16,YELLOW)+owl('welcome',1110,36,265)
board+=text(64,407,'01 / Character library',28,INK,600)+text(64,443,'Yellow body, brown wings, ivory eye discs, feather tufts and a short beak. Every time.',18,'#69665C')
labels=[('ready','Ready','Default brand presence'),('curious','Curious','Introductions and discovery'),('reading','Reading','Course and guide imagery'),('thinking','Thinking','Reflection and empty states'),('complete','Complete','Confirmed lesson completion'),('welcome','Welcome','First-time orientation')]
for i,(name,label,use) in enumerate(labels):
    x=64+(i%3)*444;y=478+(i//3)*354
    board+=rect(x,y,420,330,'#F2F0E9',18)+owl(name,x+98,y+12,224)+text(x+24,y+271,label,24,INK,600)+text(x+24,y+305,use,16,'#69665C')
board+=text(64,1246,'02 / Useful moments',28,INK,600)+text(64,1282,'Pair the character with a clear message and an action. Expressions never replace feedback.',18,'#69665C')
for i,(name,_,_,_) in enumerate(cards):
    board+=f'<g transform="translate({64+i*444} 1316) scale(.7)">{card_art[name]}</g>'
board+=text(64,1687,'03 / Campaign and small-format assets',28,INK,600)
board+=f'<g transform="translate(64 1725) scale(.65)">{social}</g>'
board+=rect(884,1725,492,410,'#F2F0E9',18)+text(914,1772,'Small, still recognizable.',24,INK,600)
for i,size in enumerate([32,48,72,96]):board+=owl('ready',912+i*112,1820,size)+text(914+i*112,1950,str(size)+' px',15,'#69665C')
board+=text(914,2016,'Use the canonical flat logo for navigation.',16,'#69665C')+text(914,2045,'Keep the character still during focused tasks.',16,'#69665C')+text(914,2074,'Reserve 3D motion for occasional moments.',16,'#69665C')
board+=line(64,2200,1376,2200,'#E6E2D7',1)+text(64,2254,'Consistency rules',23,INK,600)+text(64,2294,'Keep the palette and silhouette. No gradients, drop shadows or invented success states.',17,'#69665C')+text(64,2330,'Use the completion pose only after a confirmed event. Keep next-step copy separate and editable.',17,'#69665C')+text(64,2370,'TRADELY.AI · SEPTEMBER 2026 · FLAT OWL SERIES',12,BROWN,600)
(DOC/'brand-series.svg').write_text(svg(board,1440,2400,'Tradely owl brand series'))
