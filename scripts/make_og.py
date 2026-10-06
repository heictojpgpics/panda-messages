FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
FONT_ITALIC = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"
"""Generate the Open Graph social preview image."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
BG_TOP = (11, 42, 29)     # deep forest
BG_BOT = (21, 122, 85)    # jade

img = Image.new("RGB", (W, H), BG_TOP)

# Vertical gradient
gradient = Image.new("L", (1, H))
for y in range(H):
    t = y / H
    gradient.putpixel((0, y), int(255 * (t * 0.85)))
gradient = gradient.resize((W, H))
green = Image.new("RGB", (W, H), BG_BOT)
img = Image.composite(green, img, gradient)

d = ImageDraw.Draw(img)

# Soft radial glow behind panda
glow = Image.new("RGB", (W, H), (0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse((W - 420, -160, W + 160, 420), fill=(6, 60, 40))
gd.ellipse((60, H - 300, 520, H + 180), fill=(8, 70, 48))
glow = glow.filter(ImageFilter.GaussianBlur(60))
img = Image.a_add if hasattr(img, "a_add") else img
img = Image.blend(img, glow, 0.5)

# Subtle bamboo dots
import random
random.seed(7)
d = ImageDraw.Draw(img)
for _ in range(90):
    x = random.randint(0, W)
    y = random.randint(0, H)
    r = random.choice([2, 3])
    d.ellipse((x - r, y - r, x + r, y + r), fill=(16, 71, 52))

# Panda mascot, scaled
panda = Image.open("./public/panda/r-heart.png").convert("RGBA")
panda = panda.resize((360, 360), Image.LANCZOS)
shadow = Image.new("RGBA", (360, 360), (0, 0, 0, 90))
sh_mask = Image.new("L", (360, 360), 0)
sd = ImageDraw.Draw(sh_mask)
sd.ellipse((40, 250, 320, 330), fill=120)
shadow.putalpha(sh_mask)
img.paste(shadow, (W - 470, 300), shadow)
img.paste(panda, (W - 480, 180), panda)

# Envelope chip, small
env = Image.open("./public/panda/d-center.png").convert("RGBA")
env = env.resize((64, 64), Image.LANCZOS)
img.paste(env, (96, 470), env)

# Text
try:
    f_title = ImageFont.truetype(FONT_BOLD, 64)
    f_sub = ImageFont.truetype(FONT_ITALIC, 34)
except Exception:
    f_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 64)
    f_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 34)

# Brand mark top-left
logo = Image.open("./public/panda/d-center.png").convert("RGBA")
logo = logo.resize((56, 56), Image.LANCZOS)
img.paste(logo, (84, 72), logo)

d = ImageDraw.Draw(img)
d.text((156, 76), "Panda Messages", font=ImageFont.truetype(FONT_BOLD, 34), fill=(255, 253, 247))

d.text((84, 190), "A card that arrives", font=f_title, fill=(255, 253, 247))
d.text((84, 268), "like a gift.", font=f_title, fill=(201, 162, 39))

d.text((84, 380), "Pick the day. Panda delivers it in the morning.", font=f_sub, fill=(220, 235, 225))
d.text((84, 428), "They open an envelope. You watch it happen.", font=f_sub, fill=(220, 235, 225))

# Price pill
pill = ImageDraw.Draw(img)
pill.rounded_rectangle((84, 496, 300, 552), radius=28, fill=(201, 162, 39))
pill.text((110, 506), "$4.99 · once", font=ImageFont.truetype(FONT_BOLD, 30), fill=(17, 24, 20))

img.save("./public/og.png", optimize=True)
print("saved public/og.png")
