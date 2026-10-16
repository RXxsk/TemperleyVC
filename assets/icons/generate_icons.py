from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math
root=Path(__file__).parent
W,H=480,134
items=[('lock','Lock','🔒'),('unlock','Unlock','🔓'),('hide','Hide','🙈'),('unhide','Unhide','👁'),('limit','Límite','👥'),('invite','Invitar','➕'),('ban','Expulsar','⛔'),('permit','Permitir','✓'),('rename','Renombrar','✎'),('bitrate','Bitrate','♫'),('region','Región','▤'),('template','Plantilla','▣'),('chat','Chat','▰'),('waiting','Espera','◷'),('claim','Reclamar','♛'),('transfer','Transferir','⇄')]
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
boldpath='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font=ImageFont.truetype(boldpath,25); small=ImageFont.truetype(fontpath,14)
# 4x4 polished panel sheet
sheet=Image.new('RGB',(1280,520),(13,14,31)); d=ImageDraw.Draw(sheet)
for i,(slug,label,glyph) in enumerate(items):
    x=(i%4)*320+14; y=(i//4)*130+12
    d.rounded_rectangle((x,y,x+292,y+100),radius=18,fill=(76,80,89),outline=(115,92,154),width=2)
    # neon gradient-ish icon circle
    d.ellipse((x+18,y+23,x+72,y+77),fill=(137,59,238),outline=(255,255,255),width=3)
    try:
        gf=ImageFont.truetype(fontpath,27)
        box=d.textbbox((0,0),glyph,font=gf); d.text((x+45-(box[2]-box[0])/2,y+50-(box[3]-box[1])/2-4),glyph,font=gf,fill='white')
    except: pass
    d.text((x+84,y+31),label,font=font,fill=(255,255,255))
    d.text((x+84,y+66),'TemperleyVC',font=small,fill=(220,203,255))
    # individual png icon
    icon=Image.new('RGBA',(128,128),(0,0,0,0)); q=ImageDraw.Draw(icon)
    q.rounded_rectangle((8,8,120,120),radius=28,fill=(27,21,55,255),outline=(178,76,255,255),width=4)
    q.ellipse((28,28,100,100),fill=(153,58,230,255),outline=(255,255,255,255),width=4)
    gf2=ImageFont.truetype(fontpath,48); bb=q.textbbox((0,0),glyph,font=gf2)
    q.text(((128-(bb[2]-bb[0]))/2,(128-(bb[3]-bb[1]))/2-5),glyph,font=gf2,fill=(255,255,255,255),stroke_width=1,stroke_fill=(255,255,255,255))
    icon.save(root/f'{slug}.png')
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d946ef"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs><rect x="5" y="5" width="118" height="118" rx="28" fill="#17152f" stroke="#b84dff" stroke-width="4"/><circle cx="64" cy="64" r="37" fill="url(#g)" stroke="#fff" stroke-width="4"/><text x="64" y="80" text-anchor="middle" font-size="48" font-family="DejaVu Sans, sans-serif" fill="#fff">{glyph}</text></svg>'''
    (root/f'{slug}.svg').write_text(svg,encoding='utf-8')
sheet.save(root/'temperleyvc-panel-controles.png')
# branded 16:9 overview matching the reference aesthetic
panel=Image.new('RGB',(1600,900),(0,0,0)); d=ImageDraw.Draw(panel)
title=ImageFont.truetype(boldpath,48); sub=ImageFont.truetype(fontpath,22)
d.text((56,36),'TemperleyVC  •  Centro de control',font=title,fill=(255,255,255))
d.text((58,102),'Canales de voz temporales · Creado por AstridVMD',font=sub,fill=(204,183,255))
labels=[('🔒','Bloquear'),('🔓','Desbloquear'),('🙈','Ocultar'),('👁','Mostrar'),('👥','Límite'),('＋','Invitar'),('×','Expulsar'),('✓','Permitir'),('✎','Renombrar'),('♫','Bitrate'),('▤','Región'),('▣','Plantilla'),('▰','Chat'),('◷','Espera'),('♛','Reclamar'),('⇄','Transferir')]
for i,(g,l) in enumerate(labels):
    x=50+(i%4)*390; y=170+(i//4)*174
    d.rounded_rectangle((x,y,x+350,y+126),radius=22,fill=(78,82,91))
    d.ellipse((x+25,y+28,x+93,y+96),fill=(170,64,220),outline=(255,255,255),width=4)
    gf=ImageFont.truetype(fontpath,35); bb=d.textbbox((0,0),g,font=gf)
    d.text((x+59-(bb[2]-bb[0])/2,y+62-(bb[3]-bb[1])/2-5),g,font=gf,fill='white')
    d.text((x+112,y+43),l,font=ImageFont.truetype(boldpath,29),fill='white')
panel.save(root.parent/'branding'/'temperleyvc-panel.png')
