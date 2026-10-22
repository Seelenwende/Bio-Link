import json, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
SP=sys.argv[1]; REPO=sys.argv[2] if len(sys.argv)>2 else "."
F=SP+"/fonts2/"
def font(n,s): return ImageFont.truetype(F+n+".woff",s)
BEERE=(74,45,56); BEERE2=(110,65,82); ROSE=(217,174,187); HELL=(250,246,244)
logo=Image.open(REPO+"/assets/logo-seelenwende.png").convert("RGBA").crop((190,140,810,760))
def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
def verlauf(w,h):
    g=Image.new("RGB",(w,h)); d=ImageDraw.Draw(g)
    stops=[(0,(53,32,42)),(.45,BEERE),(.75,BEERE2),(1,(154,100,118))]
    for y in range(h):
        t=y/(h-1)
        for i in range(len(stops)-1):
            if stops[i][0]<=t<=stops[i+1][0]:
                c=lerp(stops[i][1],stops[i+1][1],(t-stops[i][0])/(stops[i+1][0]-stops[i][0]));break
        d.line([(0,y),(w,y)],fill=c)
    return g
def wrap(d,text,f,maxw):
    import re
    words=re.findall(r"[^\s-]+-?",text); lines=[]; cur=""
    for w in words:
        t=cur+w if cur.endswith("-") else (cur+" "+w).strip()
        if d.textlength(t,font=f)<=maxw: cur=t
        else: lines.append(cur); cur=w
    lines.append(cur); return lines
def cover(p,W,H,fotow,out):
    bg=verlauf(W,H).convert("RGBA")
    # weicher Lichtfleck
    glow=Image.new("RGBA",(W,H),(0,0,0,0)); gd=ImageDraw.Draw(glow)
    gd.ellipse((-W*.25,H*.55,W*.45,H*1.25),fill=(217,174,187,70)); glow=glow.filter(ImageFilter.GaussianBlur(120))
    bg.alpha_composite(glow)
    foto=Image.open(f"{REPO}/assets/bilder/{p['bild']}.jpg").convert("RGB")
    fw,fh=foto.size; sc=max(fotow/fw,H/fh); foto=foto.resize((round(fw*sc),round(fh*sc)),Image.LANCZOS)
    l=(foto.width-fotow)//2; t=(foto.height-H)//2; foto=foto.crop((l,t,l+fotow,t+H)).convert("RGBA")
    # Übergang Foto -> Verlauf
    m=Image.new("L",(fotow,H),255); md=ImageDraw.Draw(m); fade=int(fotow*.35)
    for x in range(fade): md.line([(x,0),(x,H)],fill=int(255*(x/fade)**1.4))
    x0=W-fotow; bg.paste(foto,(x0,0),m)
    d=ImageDraw.Draw(bg)
    pad=int(W*.065) if W==H else int(W*.05); tw=int((W-fotow)+fotow*.06)-pad
    # Logo + Marke
    ls=int(H*.075); lg=logo.resize((ls,ls),Image.LANCZOS); bg.alpha_composite(lg,(pad-6,pad-4))
    fm=font("jost500",int(H*.024)); d.text((pad+ls+10,pad+ls/2),"SEELENWENDE",font=fm,fill=HELL,anchor="lm")
    # Inhalt von unten nach oben
    fk=font("jost500",int(H*.022)); ts=int(H*.082)
    while True:
        ft=font("pf500",ts)
        if max(d.textlength(w,font=ft) for w in __import__("re").findall(r"[^\s-]+-?",p["bild_titel"]))<=tw and len(wrap(d,p["bild_titel"],ft,tw))<=2: break
        ts-=2
    fu=font("pf-it",int(H*.044)); ff=font("jost400",int(H*.026))
    tl=wrap(d,p["bild_titel"],ft,tw); ul=wrap(d,p["bild_unter"],fu,tw)
    y=H-pad
    # Faktenpille
    fakt=p["bild_fakt"]; pw=d.textlength(fakt,font=ff)+int(H*.05); ph=int(H*.058)
    y-=ph; ov=Image.new("RGBA",(W,H),(0,0,0,0)); ImageDraw.Draw(ov).rounded_rectangle((pad,y,pad+pw,y+ph),radius=ph//2,fill=(250,246,244,38),outline=(250,246,244,170),width=2); bg.alpha_composite(ov); d=ImageDraw.Draw(bg)
    d.text((pad+pw/2,y+ph/2),fakt,font=ff,fill=HELL,anchor="mm")
    y-=int(H*.05)
    lhu=int(H*.056)
    for line in reversed(ul): y-=lhu; d.text((pad,y),line,font=fu,fill=ROSE)
    y-=int(H*.025); lht=int(ts*1.16)
    for line in reversed(tl): y-=lht; d.text((pad,y),line,font=ft,fill=HELL)
    y-=int(H*.035); d.text((pad,y),p["phase"].upper(),font=fk,fill=ROSE)
    d.line([(pad,y-int(H*.025)),(pad+int(H*.06),y-int(H*.025))],fill=ROSE,width=2)
    bg.convert("RGB").save(out,quality=92)
for p in json.load(open(SP+"/tentary/produkte.json")):
    cover(p,1080,1080,560,f"{SP}/tentary/bilder/{p['id']}-quadrat.jpg")
    cover(p,1600,900,680,f"{SP}/tentary/bilder/{p['id']}-breit.jpg")
print("ok")
