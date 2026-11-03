import os
import json
from PIL import Image
import numpy as np

PICTURE_DIR = r'd:\Game\TurnBaseGame\Picture'
OUT_DIR = r'd:\Game\TurnBaseGame\public\assets\sprites'

os.makedirs(OUT_DIR, exist_ok=True)
manifest = {
    'total_sprites': 0,
    'categories': {}
}

def save_crop(img, bbox, out_path, cat_name, item_id, pad=0, orig_file=''):
    x1, y1, x2, y2 = bbox
    w, h = img.size
    x1 = max(0, x1 - pad)
    y1 = max(0, y1 - pad)
    x2 = min(w, x2 + pad)
    y2 = min(h, y2 + pad)
    
    crop = img.crop((x1, y1, x2, y2))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    crop.save(out_path, 'PNG')
    
    rel_path = os.path.relpath(out_path, r'd:\Game\TurnBaseGame\public').replace('\\', '/')
    if not rel_path.startswith('/'):
        rel_path = '/' + rel_path
        
    entry = {
        'id': item_id,
        'path': rel_path,
        'width': int(x2 - x1),
        'height': int(y2 - y1),
        'bbox': [int(x1), int(y1), int(x2), int(y2)],
        'source': orig_file
    }
    
    if cat_name not in manifest['categories']:
        manifest['categories'][cat_name] = []
    manifest['categories'][cat_name].append(entry)
    manifest['total_sprites'] += 1
    return entry

def trim_alpha(img_path, threshold=20):
    img = Image.open(img_path).convert('RGBA')
    arr = np.array(img)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > threshold)
    if len(ys) == 0:
        return 0, 0, img.size[0], img.size[1]
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)

# ============================================================
# 1. 8 CHARACTER BODIES
# ============================================================
print('Processing 8 Character Bodies...')
body_file = os.path.join(PICTURE_DIR, 'Character', 'Tám nhân vật pixel nền trong suốt-6.png')
body_img = Image.open(body_file).convert('RGBA')
body_boxes = [
    # Row 1 (4 chars)
    (131, 31, 328, 494),
    (462, 31, 693, 494),
    (795, 32, 1060, 494),
    (1113, 31, 1401, 494),
    # Row 2 (4 chars)
    (135, 544, 325, 1002),
    (470, 543, 685, 1002),
    (808, 544, 1047, 1002),
    (1122, 544, 1394, 1002)
]
for idx, bbox in enumerate(body_boxes):
    out = os.path.join(OUT_DIR, 'characters', 'bodies', f'body_{idx+1:02d}.png')
    save_crop(body_img, bbox, out, 'bodies', f'body_{idx+1:02d}', pad=2, orig_file='Tám nhân vật pixel nền trong suốt-6.png')

# ============================================================
# 2. 20 HAIRS
# ============================================================
print('Processing 20 Hairs...')
hair_file = os.path.join(PICTURE_DIR, 'Character', 'Bộ tóc pixel đa dạng-1.png')
hair_img = Image.open(hair_file).convert('RGBA')
hair_arr = np.array(hair_img)
hw, hh = hair_img.size
col_w, row_h = hw / 5.0, hh / 4.0

hair_count = 0
for r in range(4):
    for c in range(5):
        hair_count += 1
        x1, x2 = int(c * col_w), int((c + 1) * col_w)
        y1, y2 = int(r * row_h), int((r + 1) * row_h)
        cell = hair_arr[y1:y2, x1:x2, 3] > 20
        cys, cxs = np.where(cell)
        if len(cys) > 0:
            bx1, by1 = x1 + int(cxs.min()), y1 + int(cys.min())
            bx2, by2 = x1 + int(cxs.max() + 1), y1 + int(cys.max() + 1)
        else:
            bx1, by1, bx2, by2 = x1, y1, x2, y2
        out = os.path.join(OUT_DIR, 'characters', 'hair', f'hair_{hair_count:02d}.png')
        save_crop(hair_img, (bx1, by1, bx2, by2), out, 'hair', f'hair_{hair_count:02d}', pad=2, orig_file='Bộ tóc pixel đa dạng-1.png')

# ============================================================
# 3. 10 FACES / EXPRESSIONS
# ============================================================
print('Processing 10 Faces...')
face_file = os.path.join(PICTURE_DIR, 'Character', 'Mười biểu cảm pixel RPG-2.png')
face_img = Image.open(face_file).convert('RGBA')
face_arr = np.array(face_img)
fw, fh = face_img.size
col_w, row_h = fw / 5.0, fh / 2.0

face_count = 0
for r in range(2):
    for c in range(5):
        face_count += 1
        x1, x2 = int(c * col_w), int((c + 1) * col_w)
        y1, y2 = int(r * row_h), int((r + 1) * row_h)
        cell = face_arr[y1:y2, x1:x2, 3] > 20
        cys, cxs = np.where(cell)
        if len(cys) > 0:
            bx1, by1 = x1 + int(cxs.min()), y1 + int(cys.min())
            bx2, by2 = x1 + int(cxs.max() + 1), y1 + int(cys.max() + 1)
        else:
            bx1, by1, bx2, by2 = x1, y1, x2, y2
        out = os.path.join(OUT_DIR, 'characters', 'faces', f'face_{face_count:02d}.png')
        save_crop(face_img, (bx1, by1, bx2, by2), out, 'faces', f'face_{face_count:02d}', pad=3, orig_file='Mười biểu cảm pixel RPG-2.png')

# ============================================================
# 4. 20 SHIRTS / ARMOR
# ============================================================
print('Processing 20 Shirts...')
shirt_file = os.path.join(PICTURE_DIR, 'Character', 'Bộ sprite pixel 20 áo RPG-5.png')
shirt_img = Image.open(shirt_file).convert('RGBA')
shirt_arr = np.array(shirt_img)
sw, sh = shirt_img.size
col_w, row_h = sw / 5.0, sh / 4.0

shirt_count = 0
for r in range(4):
    for c in range(5):
        shirt_count += 1
        x1, x2 = int(c * col_w), int((c + 1) * col_w)
        y1, y2 = int(r * row_h), int((r + 1) * row_h)
        cell = shirt_arr[y1:y2, x1:x2, 3] > 20
        cys, cxs = np.where(cell)
        if len(cys) > 0:
            bx1, by1 = x1 + int(cxs.min()), y1 + int(cys.min())
            bx2, by2 = x1 + int(cxs.max() + 1), y1 + int(cys.max() + 1)
        else:
            bx1, by1, bx2, by2 = x1, y1, x2, y2
        out = os.path.join(OUT_DIR, 'characters', 'shirts', f'shirt_{shirt_count:02d}.png')
        save_crop(shirt_img, (bx1, by1, bx2, by2), out, 'shirts', f'shirt_{shirt_count:02d}', pad=2, orig_file='Bộ sprite pixel 20 áo RPG-5.png')

# ============================================================
# 5. 20 PANTS / LEGWEAR
# ============================================================
print('Processing 20 Pants...')
pants_file = os.path.join(PICTURE_DIR, 'Character', 'Bộ sprite pixel quần áo thân dưới-3.png')
pants_img = Image.open(pants_file).convert('RGBA')
pants_arr = np.array(pants_img)
pw, ph = pants_img.size
col_w, row_h = pw / 5.0, ph / 4.0

pants_count = 0
for r in range(4):
    for c in range(5):
        pants_count += 1
        x1, x2 = int(c * col_w), int((c + 1) * col_w)
        y1, y2 = int(r * row_h), int((r + 1) * row_h)
        cell = pants_arr[y1:y2, x1:x2, 3] > 20
        cys, cxs = np.where(cell)
        if len(cys) > 0:
            bx1, by1 = x1 + int(cxs.min()), y1 + int(cys.min())
            bx2, by2 = x1 + int(cxs.max() + 1), y1 + int(cys.max() + 1)
        else:
            bx1, by1, bx2, by2 = x1, y1, x2, y2
        out = os.path.join(OUT_DIR, 'characters', 'pants', f'pants_{pants_count:02d}.png')
        save_crop(pants_img, (bx1, by1, bx2, by2), out, 'pants', f'pants_{pants_count:02d}', pad=2, orig_file='Bộ sprite pixel quần áo thân dưới-3.png')

# ============================================================
# 6. 20 ACCESSORIES
# ============================================================
print('Processing 20 Accessories...')
acc_file = os.path.join(PICTURE_DIR, 'Character', 'Bộ sprite phụ kiện RPG pixel art-7.png')
acc_img = Image.open(acc_file).convert('RGBA')
acc_arr = np.array(acc_img)
aw, ah = acc_img.size
col_w, row_h = aw / 5.0, ah / 4.0

acc_count = 0
for r in range(4):
    for c in range(5):
        acc_count += 1
        x1, x2 = int(c * col_w), int((c + 1) * col_w)
        y1, y2 = int(r * row_h), int((r + 1) * row_h)
        cell = acc_arr[y1:y2, x1:x2, 3] > 20
        cys, cxs = np.where(cell)
        if len(cys) > 0:
            bx1, by1 = x1 + int(cxs.min()), y1 + int(cys.min())
            bx2, by2 = x1 + int(cxs.max() + 1), y1 + int(cys.max() + 1)
        else:
            bx1, by1, bx2, by2 = x1, y1, x2, y2
        out = os.path.join(OUT_DIR, 'characters', 'accessories', f'acc_{acc_count:02d}.png')
        save_crop(acc_img, (bx1, by1, bx2, by2), out, 'accessories', f'acc_{acc_count:02d}', pad=2, orig_file='Bộ sprite phụ kiện RPG pixel art-7.png')

# ============================================================
# 7. 6 CLASS BUTTONS (TRIMMED)
# ============================================================
print('Processing 6 Class Buttons...')
class_files = {
    'class_assassin': 'Nút ASSASSIN pixel art 16-bit-11.png',
    'class_boxer': 'Nút lớp Boxer pixel 16-bit-15.png',
    'class_juggernaut': 'Nút Juggernaut pixel art 16-bit-14.png',
    'class_mage': 'Nút chọn lớp Pháp sư 16-bit-13.png',
    'class_tanker': 'Nút Tanker pixel art 16-bit-12.png',
    'class_warrior': 'Nút WARRIOR pixel 16-bit viền vàng-16.png',
}
for cid, fname in class_files.items():
    p = os.path.join(PICTURE_DIR, 'ClassUI', fname)
    img = Image.open(p).convert('RGBA')
    bbox = trim_alpha(p)
    out = os.path.join(OUT_DIR, 'ui', 'classes', f'{cid}.png')
    save_crop(img, bbox, out, 'classes', cid, pad=2, orig_file=fname)

# ============================================================
# 8. 9 WEAPONS (TRIMMED)
# ============================================================
print('Processing 9 Weapons...')
weapon_files = {
    'weapon_greatsword': 'Đại kiếm bạc hai tay-1.png',
    'weapon_bow': 'Cung gỗ cong với tên đỏ-2.png',
    'weapon_dagger_dragon': 'Dao găm rồng lửa xanh-8.png',
    'weapon_revolver': 'Súng lục bạc sáu ổ đạn pixel-5.png',
    'weapon_staff': 'Trượng gỗ phép thuật ngọc lam-4.png',
    'weapon_infinity_ring': 'Vòng vô cực hư không-6.png',
    'weapon_spirit_stone': 'Đá linh thú giận dữ-10.png',
    'weapon_chronos_watch': 'Đồng hồ bỏ túi Chronos-7.png',
    'weapon_headband_fire': 'Băng đô lá hắc hỏa-9.png',
}
for wid, fname in weapon_files.items():
    p = os.path.join(PICTURE_DIR, 'Sword', fname)
    img = Image.open(p).convert('RGBA')
    bbox = trim_alpha(p)
    out = os.path.join(OUT_DIR, 'weapons', f'{wid}.png')
    save_crop(img, bbox, out, 'weapons', wid, pad=4, orig_file=fname)

# ============================================================
# 9. 4 MENU BUTTON CARDS
# ============================================================
print('Processing 4 Menu Buttons...')
mb_file = os.path.join(PICTURE_DIR, 'Frame', 'Bộ nút menu RPG xúc xắc 16-bit-3.png')
mb_img = Image.open(mb_file).convert('RGBA')
mb_boxes = [
    (14, 19, 430, 874),
    (457, 19, 873, 874),
    (901, 19, 1318, 874),
    (1345, 19, 1760, 874),
]
mb_names = ['btn_menu_play', 'btn_menu_character', 'btn_menu_weapons', 'btn_menu_settings']
for bbox, name in zip(mb_boxes, mb_names):
    out = os.path.join(OUT_DIR, 'ui', 'buttons', f'{name}.png')
    save_crop(mb_img, bbox, out, 'menu_buttons', name, pad=2, orig_file='Bộ nút menu RPG xúc xắc 16-bit-3.png')

# ============================================================
# 10. 4 MODE CARDS (2x2)
# ============================================================
print('Processing 4 Mode Cards...')
mode_file = os.path.join(PICTURE_DIR, 'Frame', 'Bảng chọn chế độ Dice Maniac (1).png')
mode_img = Image.open(mode_file).convert('RGBA')
mode_boxes = [
    (14, 10, 645, 575),    # Top-Left: Ranked / LMS
    (665, 10, 1300, 575),  # Top-Right: Casual / Arena
    (14, 595, 645, 1160),  # Bottom-Left: PvE Dungeon
    (665, 595, 1300, 1160) # Bottom-Right: Special Tournament
]
mode_names = ['mode_ranked', 'mode_casual', 'mode_pve', 'mode_special']
for bbox, name in zip(mode_boxes, mode_names):
    out = os.path.join(OUT_DIR, 'ui', 'modes', f'{name}.png')
    save_crop(mode_img, bbox, out, 'modes', name, pad=2, orig_file='Bảng chọn chế độ Dice Maniac (1).png')

# ============================================================
# 11. 7 TIER FRAMES
# ============================================================
print('Processing 7 Tier Frames...')
tier_file = os.path.join(PICTURE_DIR, 'Frame', 'Khung xúc xắc pixel art 7 cấp-2.png')
tier_img = Image.open(tier_file).convert('RGBA')
tier_boxes = [
    (82, 13, 948, 209),
    (79, 226, 973, 422),
    (77, 438, 955, 638),
    (80, 655, 958, 851),
    (59, 866, 981, 1067),
    (48, 1083, 976, 1284),
    (48, 1301, 967, 1514)
]
for idx, bbox in enumerate(tier_boxes):
    out = os.path.join(OUT_DIR, 'ui', 'frames', f'tier_{idx+1:02d}.png')
    save_crop(tier_img, bbox, out, 'tier_frames', f'tier_{idx+1:02d}', pad=2, orig_file='Khung xúc xắc pixel art 7 cấp-2.png')

# ============================================================
# 12. 21 ATLAS BUTTONS & INPUTS
# ============================================================
print('Processing 21 Atlas Elements...')
atlas_file = os.path.join(PICTURE_DIR, 'Frame', 'Atlas nút và ô nhập pixel 16-bit-4.png')
atlas_img = Image.open(atlas_file).convert('RGBA')
atlas_boxes = [
    (400, 39, 752, 188), (16, 49, 368, 181), (784, 49, 1136, 181), (1168, 49, 1520, 181),
    (400, 214, 752, 363), (16, 223, 367, 356), (784, 223, 1136, 356), (1168, 223, 1520, 356),
    (400, 385, 752, 990), (16, 394, 368, 527), (784, 394, 1136, 527), (1168, 394, 1520, 527),
    (16, 559, 367, 679), (784, 559, 1135, 680), (1169, 559, 1520, 680),
    (114, 709, 269, 842), (882, 709, 1037, 842), (1266, 710, 1422, 842),
    (784, 870, 1136, 983), (1168, 870, 1520, 983), (16, 871, 368, 983)
]
for idx, bbox in enumerate(atlas_boxes):
    out = os.path.join(OUT_DIR, 'ui', 'atlas', f'atlas_btn_{idx+1:02d}.png')
    save_crop(atlas_img, bbox, out, 'atlas_elements', f'atlas_btn_{idx+1:02d}', pad=2, orig_file='Atlas nút và ô nhập pixel 16-bit-4.png')

# ============================================================
# 13. SINGLE FRAMES & BUTTONS (TRIMMED)
# ============================================================
print('Processing Single Frames...')
single_frames = {
    'frame_d20_tray': 'Khay xúc xắc D20 pixel vàng-3.png',
    'frame_d6_tray': 'Khay xúc xắc D6 kỹ năng trống-4.png',
    'frame_effect_box': 'Khung hiệu ứng vuông pixel xanh ngọc-8.png',
    'frame_battle_log': 'Khung nhật ký chiến đấu pixel-9.png',
    'frame_hp_gold': 'Khung thanh máu pixel vàng rỗng-1.png',
    'frame_square_cyan': 'Khung vuông pixel ngọc lam rỗng-10.png',
    'frame_skill_slot': 'Khung ô kỹ năng pixel tím vàng-7.png',
    'btn_roll_dice': 'Nút ROLL DICE pixel xanh vàng-6.png',
    'btn_end_turn': 'Nút kết thúc lượt xanh vàng-5.png',
    'bar_hp_red': 'Thanh máu đỏ pixel-2.png',
}
for fid, fname in single_frames.items():
    p = os.path.join(PICTURE_DIR, 'Frame', fname)
    img = Image.open(p).convert('RGBA')
    bbox = trim_alpha(p)
    out = os.path.join(OUT_DIR, 'ui', 'frames', f'{fid}.png')
    save_crop(img, bbox, out, 'ui_frames', fid, pad=2, orig_file=fname)

# Save Manifest JSON
manifest_path = os.path.join(OUT_DIR, 'manifest.json')
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

total = manifest["total_sprites"]
print(f"\nSUCCESS! Sliced a total of {total} sprites!")
print(f"Manifest saved at: {manifest_path}")
