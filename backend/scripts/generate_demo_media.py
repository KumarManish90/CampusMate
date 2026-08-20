#!/usr/bin/env python3
"""
CampusMate demo media generator — profiles, posts, clubs, events, reel thumbnails.

Generates stylized gradient + initials/icon placeholder graphics entirely
offline (Pillow only, no network calls). These are honestly *not*
photorealistic AI-generated people — this environment has no image-generation
model available — but they are real, valid, non-broken image files, colored
per college, which is what backend/seed/seed.js expects to find under
backend/uploads/.

Usage:
    pip install pillow
    python3 scripts/generate_demo_media.py

Run make_reels.sh separately (needs ffmpeg, also offline) for the reel videos.
"""
from PIL import Image, ImageDraw, ImageFont
import random
import os

random.seed(42)

ROOT = os.path.join(os.path.dirname(__file__), "..", "uploads")

COLLEGE_COLORS = {
    "GGITS": [(109, 93, 246), (168, 85, 247)],
    "GGCT": [(56, 189, 248), (99, 102, 241)],
    "GGCE": [(245, 165, 36), (236, 110, 60)],
}

FONT_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def font(size):
    for path in FONT_PATHS:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def gradient(size, c1, c2):
    w, h = size
    base = Image.new("RGB", (w, h), c1)
    top = Image.new("RGB", (w, h), c2)
    mask = Image.new("L", (w, h))
    md = ImageDraw.Draw(mask)
    for i in range(w + h):
        v = int(255 * i / (w + h))
        md.line([(0, i), (i, 0)], fill=v)
    mask = mask.resize((w, h))
    return Image.composite(top, base, mask)


def add_noise_dots(img, n=40):
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    for _ in range(n):
        x, y = random.randint(0, w), random.randint(0, h)
        r = random.randint(2, 5)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, random.randint(10, 30)))
    return img


def avatar(name, college, path, size=400):
    c1, c2 = COLLEGE_COLORS[college]
    img = add_noise_dots(gradient((size, size), c1, c2), 30)
    d = ImageDraw.Draw(img)
    initials = "".join([p[0] for p in name.split()[:2]]).upper()
    f = font(int(size * 0.36))
    bbox = d.textbbox((0, 0), initials, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.ellipse([size * 0.18, size * 0.18, size * 0.82, size * 0.82], outline=(255, 255, 255, 90), width=4)
    d.text((size / 2 - tw / 2 - bbox[0], size / 2 - th / 2 - bbox[1]), initials, font=f, fill=(255, 255, 255, 235))
    img.save(path, quality=90)


def post_image(caption_tag, college, path, size=(1080, 1080), icon="\U0001F4F8"):
    c1, c2 = COLLEGE_COLORS[college]
    img = add_noise_dots(gradient(size, c1, c2), 60)
    d = ImageDraw.Draw(img, "RGBA")
    w, h = size
    for i in range(5):
        bw = random.randint(int(w * 0.08), int(w * 0.16))
        bh = random.randint(int(h * 0.25), int(h * 0.5))
        bx = int(w * 0.1) + i * int(w * 0.16)
        by = h - bh - int(h * 0.12)
        d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=14, fill=(255, 255, 255, 28))
    d.text((size[0] * 0.06, size[1] * 0.08), icon, font=font(int(size[1] * 0.09)), fill=(255, 255, 255, 240))
    d.text((size[0] * 0.06, size[1] * 0.86), caption_tag, font=font(int(size[1] * 0.045)), fill=(255, 255, 255, 235))
    img.save(path, quality=88)


def reel_thumb(caption_tag, college, path, size=(720, 1280)):
    c1, c2 = COLLEGE_COLORS[college]
    img = add_noise_dots(gradient(size, c2, c1), 70)
    d = ImageDraw.Draw(img, "RGBA")
    w, h = size
    d.ellipse([w / 2 - 70, h / 2 - 70, w / 2 + 70, h / 2 + 70], fill=(0, 0, 0, 90))
    d.polygon([(w / 2 - 22, h / 2 - 40), (w / 2 - 22, h / 2 + 40), (w / 2 + 40, h / 2)], fill=(255, 255, 255, 230))
    d.text((w * 0.08, h * 0.88), caption_tag, font=font(int(h * 0.035)), fill=(255, 255, 255, 235))
    img.save(path, quality=88)


def club_logo(mark, college, path, size=300):
    c1, c2 = COLLEGE_COLORS[college]
    img = gradient((size, size), c1, c2)
    d = ImageDraw.Draw(img)
    f = font(int(size * 0.3))
    bbox = d.textbbox((0, 0), mark, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text((size / 2 - tw / 2 - bbox[0], size / 2 - th / 2 - bbox[1]), mark, font=f, fill=(255, 255, 255, 240))
    img.save(path, quality=88)


def event_banner(title, college, path, size=(1200, 630)):
    c1, c2 = COLLEGE_COLORS[college]
    img = gradient(size, c2, c1)
    d = ImageDraw.Draw(img, "RGBA")
    d.text((60, 480), title, font=font(58), fill=(255, 255, 255, 245))
    d.text((60, 420), college, font=font(30), fill=(255, 255, 255, 200))
    img.save(path, quality=88)


STUDENTS = [
    ("Rahul Sharma", "GGITS"), ("Priya Verma", "GGCT"), ("Aditya Singh", "GGCE"),
    ("Ishita Rao", "GGCT"), ("Karan Mehta", "GGITS"), ("Ananya Joshi", "GGCE"),
    ("Yash Patel", "GGITS"), ("Sneha Kulkarni", "GGCT"), ("Devansh Rathore", "GGCE"),
    ("Meera Nair", "GGITS"), ("Rohan Patel", "GGCE"), ("Aarav Sharma", "GGITS"),
    ("Kavya Iyer", "GGCT"), ("Vikram Chauhan", "GGCE"), ("Neha Kapoor", "GGCT"),
]

POSTS = [
    ("Hackathon prep \U0001F525", "GGITS", "\U0001F680"), ("Sketching in studio \u270F\uFE0F", "GGCT", "\U0001F3A8"),
    ("Open-source study group", "GGCE", "\U0001F4BB"), ("RoboWar bot v3 \U0001F916", "GGCE", "\U0001F916"),
    ("Sanskriti soundcheck \U0001F3B6", "GGCT", "\U0001F3B5"), ("AI/ML bootcamp seats open", "GGITS", "\U0001F9E0"),
    ("Campus sunset \U0001F305", "GGCE", "\U0001F305"), ("Chai + code \u2615", "GGITS", "\u2615"),
    ("Cultural fest rehearsal", "GGCT", "\U0001F3AD"), ("Library grind \U0001F4DA", "GGCT", "\U0001F4DA"),
    ("Placement prep workshop", "GGCE", "\U0001F3AF"), ("Cricket league finals \U0001F3CF", "GGITS", "\U0001F3CF"),
]

REELS = [
    ("Campus vibes before the hackathon", "GGITS"), ("60s inside Sanskriti rehearsal", "GGCT"),
    ("RoboWar bot survives round 1", "GGCE"), ("POV: your PR gets merged", "GGCE"),
    ("Late night debugging squad", "GGITS"), ("Coffee break with the club", "GGCT"),
]

CLUBS = [
    ("Coding Club", "GGITS", "</>"), ("Robotics Club", "GGCE", "R"), ("AI/ML Club", "GGCT", "AI"),
    ("Entrepreneurship Cell", "GGITS", "E"), ("Cultural Club", "GGCT", "C"), ("Photography Club", "GGCE", "P"),
]

EVENTS = [
    ("Hackathon 2026", "GGITS"), ("AI/ML Bootcamp", "GGCT"), ("RoboWar Finals", "GGCE"),
    ("Startup Pitch Night", "GGITS"), ("Cultural Fest \u2014 Sanskriti", "GGCT"), ("Placement Prep Workshop", "GGCE"),
    ("Photography Walk", "GGCE"), ("Freshers Meetup", "GGITS"),
]


def main():
    for sub in ["profiles", "posts", "thumbnails", "clubs", "events"]:
        os.makedirs(os.path.join(ROOT, sub), exist_ok=True)

    for i, (name, college) in enumerate(STUDENTS, start=1):
        avatar(name, college, os.path.join(ROOT, "profiles", f"user-{i:02d}.jpg"))

    for i, (cap, college, icon) in enumerate(POSTS, start=1):
        post_image(cap, college, os.path.join(ROOT, "posts", f"post-{i:02d}.jpg"), icon=icon)

    for i, (cap, college) in enumerate(REELS, start=1):
        reel_thumb(cap, college, os.path.join(ROOT, "thumbnails", f"reel-{i:02d}.jpg"))

    for i, (name, college, mark) in enumerate(CLUBS, start=1):
        club_logo(mark, college, os.path.join(ROOT, "clubs", f"club-{i:02d}.jpg"))

    for i, (title, college) in enumerate(EVENTS, start=1):
        event_banner(title, college, os.path.join(ROOT, "events", f"event-{i:02d}.jpg"))

    print(f"CampusMate demo media generated:")
    print(f"  profiles:   {len(STUDENTS)}")
    print(f"  posts:      {len(POSTS)}")
    print(f"  reel thumbs:{len(REELS)}")
    print(f"  clubs:      {len(CLUBS)}")
    print(f"  events:     {len(EVENTS)}")
    print("Run make_reels.sh next to generate the actual reel .mp4 files (needs ffmpeg).")


if __name__ == "__main__":
    main()
