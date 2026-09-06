from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math, random
OUT=Path('/Users/evansmacbookpro/Desktop/Projects/tradely/artifacts/trading-hall/exchange-v2/textures')
OUT.mkdir(parents=True,exist_ok=True)
def font(size,bold=False):
    p='/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Menlo.ttc'
    try:return ImageFont.truetype(p,size)
    except OSError:return ImageFont.load_default()
symbols=['SPY','QQQ','AAPL','MSFT','NVDA','AMD','META','AMZN','GOOGL','TSLA','IWM','DIA','JPM','BAC','XOM','V']
atlas=Image.new('RGB',(2048,1536),'#071224')
for tile in range(16):
    im=Image.new('RGB',(512,384),'#071323');d=ImageDraw.Draw(im);rng=random.Random(702+tile)
    d.rectangle((0,0,512,28),fill='#143d69');d.text((12,7),f'{symbols[tile]}   MARKET MONITOR',font=font(14,True),fill='#e6f2ff')
    d.text((375,8),'09:34:22',font=font(12),fill='#b4d5ef')
    d.rectangle((0,28,512,45),fill='#d9e5ee');d.text((8,29),'Quotes  Trades  Charts  News  Orders',font=font(11),fill='#142c47')
    if tile<8:
        d.text((12,55),'SYMBOL      LAST      CHANGE     BID      ASK',font=font(12),fill='#71b5ff')
        for row in range(19):
            y=78+row*15;base=rng.uniform(20,640);sym=symbols[(row+tile)%16]
            if row%2:d.rectangle((5,y-1,507,y+14),fill='#0b2540')
            d.text((12,y),f'{sym:6}   {base:7.2f}    {rng.uniform(-4,4):+5.2f}   {base-.02:7.2f}  {base+.03:7.2f}',font=font(11),fill='#7ddacb' if row%3 else '#e59193')
    else:
        vals=[160+math.sin(j*.18+tile)*42+math.sin(j*.57)*13+rng.uniform(-7,7) for j in range(80)]
        for y in range(85,278,38):d.line((12,y,380,y),fill='#1d4160')
        for x in range(12,390,52):d.line((x,76,x,282),fill='#173751')
        for j in range(78):
            x=14+j*4.6;o=vals[j];c=vals[j+1];color='#6bd3bc' if c<o else '#ee9299'
            d.line((x,min(o,c)-rng.uniform(2,9),x,max(o,c)+rng.uniform(2,9)),fill=color)
            d.rectangle((x-1,min(o,c),x+1,max(o,c)+1),fill=color)
            h=rng.randrange(4,35);d.rectangle((x-1,317-h,x+1,317),fill=color)
        d.text((14,52),f'{symbols[tile]}    {rng.uniform(120,580):.2f}   +0.42%',font=font(15,True),fill='#91dbcb')
        for row in range(21):
            y=64+row*12
            d.text((393,y),f'{rng.uniform(160,162):.2f} {rng.randrange(10,900):3}',font=font(10),fill='#e894a0' if row<10 else '#7cdbbd')
        d.rectangle((7,331,505,358),fill='#123d72');d.text((12,337),'NYSE  NASDAQ  ARCA    1m  5m  15m  1h',font=font(12),fill='#d8ecff')
    d.text((12,370),'REFERENCE DATA / EXCHANGE MODEL STUDY',font=font(8),fill='#6c94b9')
    atlas.paste(im,((tile%4)*512,(tile//4)*384))
atlas.save(OUT/'markets-v2.png')
# Tower displays: the same graphic is used on the same physical face in every camera.
for kind in ['flag','nyse']:
    im=Image.new('RGB',(768,1152),'#05080d');d=ImageDraw.Draw(im)
    if kind=='flag':
        # A display photograph of a gently waving flag, not a luminous hologram.
        for y in range(1152):
            for x in range(768):
                yy=y+22*math.sin(x/768*math.tau+0.4)
                stripe=int(yy/(1152/13))%13
                shade=.91+.09*math.sin(x/768*math.tau+.8)
                c=(173,35,52) if stripe%2==0 else (228,231,225)
                if x<330 and yy<1152*7/13:c=(30,53,100)
                im.putpixel((x,y),tuple(int(v*shade) for v in c))
        d=ImageDraw.Draw(im)
        for row in range(9):
            for col in range(6 if row%2==0 else 5):
                cx=25+col*55+(27 if row%2 else 0);cy=34+row*63-22*math.sin(cx/768*math.tau+.4)
                points=[]
                for i in range(10):
                    a=-math.pi/2+i*math.pi/5;r=18 if i%2==0 else 7
                    points.append((cx+math.cos(a)*r,cy+math.sin(a)*r))
                d.polygon(points,fill='#e5e8e4')
    else:
        for i in range(6):
            x=115+i*89
            for y in range(265,610):
                t=(y-265)/345;c=(int(34*(1-t)+7*t),int(137*(1-t)+31*t),int(229*(1-t)+82*t))
                d.line((x,y,x+65,y),fill=c)
        d.text((105,666),'NYSE',font=font(174,True),fill='#e5eaf0')
    im.save(OUT/(kind+'.png'))
print('Wrote market atlas and fixed flag/NYSE tower textures:',OUT)
