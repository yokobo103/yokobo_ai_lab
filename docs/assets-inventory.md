# LP Asset Inventory

Visual source of truth: local reference captures in `public/design-reference/` are intentionally ignored by Git.  
Reference size: approximately `862 x 1824px`.

## Inferred Layout And Asset Count

The LP is a cute, image-rich AI lab landing page with a white rounded page frame, blue/navy typography, soft lab backgrounds, a large hero illustration, many rounded cards, and repeated mascot/robot motifs.

Approximate visible reusable asset count:

- Hero: 15 reusable visual assets
- Concern cards: 5 line-icon assets plus card-tail/UI treatment
- Play/activity cards: 6 image-rich card thumbnails, not generic icons
- Research log thumbnails: 5 post thumbnail illustrations
- Researcher/profile section: 6 character/profile assets
- Vision section: 8 symbolic/decorative assets
- CTA/footer banner: 8 visual assets
- Decorative icons and UI accents: 15+ small reusable assets

Main LP copy should remain editable HTML text. Character art, robot art, lab scenes, card thumbnails, decorative symbols, and repeated UI accents should be image or vector assets.

## Hero

| Asset ID | Section | Purpose | Visual Description | Suggested File Path | Format | Recommended Size | Transparent | Priority | Text Baked Into Image | Notes |
|---|---|---|---|---|---|---:|---|---|---|---|
| `hero-bg-lab` | hero | Main hero background scene | Bright soft-focus AI lab interior with shelves, plants, glassware, light blue holographic panels, and desk surface. Should sit behind characters and fade into white on the left. | `public/assets/hero/hero-lab-bg.webp` | WebP | `1600x900` | no | high | no | Keep background mostly text-free. Japanese/English copy must be HTML. |
| `hero-dr-yokobo` | hero | Main mascot character | Large fluffy golden-brown cat scientist wearing round black glasses and white lab coat with small YKB badge, seated at desk, holding stylus/pen. | `public/assets/characters/dr-yokobo-hero.png` | PNG | `900x1000` | yes | high | no | YKB badge may be baked into coat. Must have clean alpha edge for layering. |
| `hero-nyabbit` | hero | Main robot mascot | Small cream/white cat-eared robot with black glossy face, cyan glowing eyes, tiny smile, paws, YKB chest mark, top rotor. | `public/assets/characters/nyabbit-hero.png` | PNG | `520x520` | yes | high | no | YKB mark may be baked in. Rotor blur can be baked into asset. |
| `hero-blueprint-tablet` | hero | Desk object under cat hand | Blue glowing blueprint/tablet panel with simple UI diagrams and rounded rectangles. | `public/assets/hero/blueprint-tablet.png` | PNG | `720x360` | yes | medium | no | Avoid readable text. Abstract UI lines only. |
| `hero-stylus` | hero | Desk object/character prop | Dark pen/stylus held by Dr.よこぼ. | `public/assets/hero/stylus.png` | PNG | `220x360` | yes | low | no | Can be baked into `hero-dr-yokobo` if not animated separately. |
| `hero-mug-ykb` | hero | Desk prop | White mug with purple/pink YKB lettering on desk. | `public/assets/hero/mug-ykb.png` | PNG | `260x260` | yes | medium | yes | YKB can be baked into object. |
| `hero-flask-orange` | hero | Lab prop | Small Erlenmeyer flask with orange liquid near mug. | `public/assets/hero/flask-orange.png` | PNG | `180x260` | yes | medium | no | Reusable in footer/decorations. |
| `hero-beaker-blue` | hero | Lab prop | Tall glass beaker/flask with bright blue liquid on right side. | `public/assets/hero/beaker-blue.png` | PNG | `220x420` | yes | medium | no | Should match glossy reference lighting. |
| `hero-test-tube-pink` | hero | Lab prop | Small test tube or flask with pink liquid near bottom right. | `public/assets/hero/test-tube-pink.png` | PNG | `160x260` | yes | low | no | Optional but useful for detail density. |
| `hero-hologram-panel` | hero | Sci-fi lab detail | Transparent cyan holographic UI board with cat doodle, chart, sliders, and icons. | `public/assets/hero/hologram-panel.png` | PNG | `520x420` | yes | high | no | Use image for glow and line art; avoid real Japanese text. |
| `hero-speech-bubble` | hero | Speech bubble near robot | White rounded cloud/speech bubble with soft shadow and pointer, placed over hero art. | `public/assets/ui/speech-bubble-cloud.svg` | SVG | `300x170` | yes | medium | no | Bubble text “今日も新しい発見があるにゃ！” should remain HTML unless exact matching is required. |
| `hero-paper-sketch-left` | hero | Desk decoration | White paper sheet with pale blue sketch/UI doodles near bottom left. | `public/assets/hero/paper-sketch-left.png` | PNG | `360x240` | yes | low | no | Can be baked into hero background if not reused. |
| `hero-paper-sketch-right` | hero | Desk decoration | White paper sheet with cat/robot doodle near bottom right. | `public/assets/hero/paper-sketch-right.png` | PNG | `360x240` | yes | low | no | Can be baked into hero background if not reused. |
| `hero-paw-accent` | hero | Small brand accent | Small light-blue paw mark beside hero eyebrow/logo area. | `public/assets/decor/paw-blue.svg` | SVG | `48x48` | yes | high | no | Reused throughout headings and buttons. |
| `header-logo-mark` | hero/header | Site logo mark | Navy chemistry flask icon with small paw inside, simple rounded line style. | `public/assets/brand/flask-paw-logo.svg` | SVG | `64x64` | yes | high | no | Header text should be HTML. Do not bake “よこぼのAIラボ” into image unless creating a separate full logo asset. |

## Concern Cards

| Asset ID | Section | Purpose | Visual Description | Suggested File Path | Format | Recommended Size | Transparent | Priority | Text Baked Into Image | Notes |
|---|---|---|---|---|---|---:|---|---|---|---|
| `concern-icon-lightbulb` | concern cards | First concern icon | Navy/blue line-art lightbulb with small rays. | `public/assets/concerns/icon-lightbulb.svg` | SVG | `72x72` | yes | high | no | Card text “AIって難しそう…” should be HTML. |
| `concern-icon-scribble` | concern cards | Second concern icon | Loose tangled scribble line symbol, expressing uncertainty. | `public/assets/concerns/icon-scribble.svg` | SVG | `72x72` | yes | high | no | Keep hand-drawn but clean. |
| `concern-icon-star` | concern cards | Third concern icon | Simple rounded outline star. | `public/assets/concerns/icon-star.svg` | SVG | `72x72` | yes | high | no | Use same stroke weight as other concern icons. |
| `concern-icon-cat-face` | concern cards | Fourth concern icon | Simple line-art cat face, rounded ears, dots/whiskers. | `public/assets/concerns/icon-cat-face.svg` | SVG | `72x72` | yes | high | no | Matches mascot theme. |
| `concern-icon-heart` | concern cards | Fifth concern icon | Rounded outline heart. | `public/assets/concerns/icon-heart.svg` | SVG | `72x72` | yes | high | no | Keep text editable. |
| `concern-card-tail` | concern cards | Speech-card visual treatment | Small angled speech-tail shape under each rounded concern card. | CSS or `public/assets/ui/card-tail.svg` | SVG | `64x36` | yes | medium | no | Prefer CSS pseudo-element; asset only if exact matching is needed. |
| `concern-yellow-rays-left` | concern cards | Emphasis decoration | Two small yellow/orange hand-drawn rays around support copy. | `public/assets/decor/yellow-rays-left.svg` | SVG | `80x80` | yes | medium | no | Reusable around “応援します！” copy. |
| `concern-yellow-rays-right` | concern cards | Emphasis decoration | Mirrored yellow/orange rays around support copy. | `public/assets/decor/yellow-rays-right.svg` | SVG | `80x80` | yes | medium | no | Could be CSS mirrored from left asset. |

## Play / Activity Cards

These are image-rich cards. Do not reduce them to generic icons. Each card uses a full miniature illustration plus a small heading icon style.

| Asset ID | Section | Purpose | Visual Description | Suggested File Path | Format | Recommended Size | Transparent | Priority | Text Baked Into Image | Notes |
|---|---|---|---|---|---|---:|---|---|---|---|
| `play-image-generation-thumb` | play/activity cards | Card thumbnail for image generation | Dr.よこぼ standing/posing beside an easel or canvas showing a colorful generated portrait/landscape, soft white card background. | `public/assets/play/play-image-generation.webp` | WebP | `520x420` | no | high | no | Heading and body text must be HTML. Small YKB on coat allowed. |
| `play-3d-thumb` | play/activity cards | Card thumbnail for 3D experiments | Nyabbit floating with rotor, surrounded by light blue 3D construction guides, cubes, orbit lines, small doodle icons. | `public/assets/play/play-3d.webp` | WebP | `520x420` | no | high | no | Should feel like Blender/3D modeling without showing software UI text. |
| `play-game-thumb` | play/activity cards | Card thumbnail for game making | Colorful cozy RPG/game scene with village, mountains, small character/hero, warm playful fantasy palette. | `public/assets/play/play-game.webp` | WebP | `520x420` | no | high | no | No text in image. This is not just a gamepad icon. |
| `play-ai-tool-thumb` | play/activity cards | Card thumbnail for AI tools | Nyabbit using laptop or terminal with chat bubbles/UI panels, white desk, lab atmosphere. | `public/assets/play/play-ai-tool.webp` | WebP | `520x420` | no | high | no | Chat bubble contents should be abstract marks, not readable text. |
| `play-experiment-share-thumb` | play/activity cards | Card thumbnail for sharing experiments | Lab glassware with blue liquid, small Nyabbit, connected node/share symbol, experiment tools. | `public/assets/play/play-experiment-share.webp` | WebP | `520x420` | no | high | no | Keep chemistry lab mood. |
| `play-failure-thumb` | play/activity cards | Card thumbnail for failure logs | Dr.よこぼ laughing with Nyabbit, small “oops” style doodles, cheerful failure mood. | `public/assets/play/play-failure.webp` | WebP | `520x420` | no | high | optional | If using small comic bubble, text can be HTML overlay; avoid baked Japanese unless intentional. |
| `play-icon-image-small` | play/activity cards | Small heading icon | Blue outline image/photo icon above “画像生成であそぶ”. | `public/assets/play/icons/icon-image.svg` | SVG | `44x44` | yes | medium | no | Can be separate from thumbnail for reusable card heading treatment. |
| `play-icon-cube-small` | play/activity cards | Small heading icon | Blue outline cube icon above “3Dであそぶ”. | `public/assets/play/icons/icon-cube.svg` | SVG | `44x44` | yes | medium | no | Same stroke as line icon set. |
| `play-icon-gamepad-small` | play/activity cards | Small heading icon | Blue outline gamepad icon. | `public/assets/play/icons/icon-gamepad.svg` | SVG | `44x44` | yes | medium | no | Used as heading ornament, not thumbnail replacement. |
| `play-icon-flask-small` | play/activity cards | Small heading icon | Blue outline lab flask. | `public/assets/play/icons/icon-flask.svg` | SVG | `44x44` | yes | medium | no | Reused in buttons/vision. |
| `play-icon-share-small` | play/activity cards | Small heading icon | Blue outline connected nodes/share symbol. | `public/assets/play/icons/icon-share.svg` | SVG | `44x44` | yes | medium | no | For experiment sharing card. |
| `play-icon-smile-small` | play/activity cards | Small heading icon | Blue outline smile face. | `public/assets/play/icons/icon-smile.svg` | SVG | `44x44` | yes | medium | no | For failure/laughing card. |

## Research Log Thumbnails

Each research log card uses a top image thumbnail with category pill and HTML text below. Category labels should be HTML overlays, not baked into thumbnail images.

| Asset ID | Section | Purpose | Visual Description | Suggested File Path | Format | Recommended Size | Transparent | Priority | Text Baked Into Image | Notes |
|---|---|---|---|---|---|---:|---|---|---|---|
| `log-thumb-future-lab` | research log thumbnails | First post thumbnail | Dr.よこぼ in bright lab with shelves and glassware, similar to hero but cropped tighter. | `public/assets/logs/thumb-future-lab.webp` | WebP | `640x420` | no | high | no | Category/date/title should be HTML. |
| `log-thumb-3d-nyabbit` | research log thumbnails | Second post thumbnail | Nyabbit floating in blue 3D modeling space with rotor and circular guide lines. | `public/assets/logs/thumb-3d-nyabbit.webp` | WebP | `640x420` | no | high | no | Do not bake “3D” label; use HTML pill. |
| `log-thumb-rpg-game` | research log thumbnails | Third post thumbnail | Cozy RPG village landscape with mountains, green fields, tiny game-like character. | `public/assets/logs/thumb-rpg-game.webp` | WebP | `640x420` | no | high | no | Same visual family as play-game thumbnail, but card crop can differ. |
| `log-thumb-chatgpt-prompt` | research log thumbnails | Fourth post thumbnail | Nyabbit at laptop, prompt/chat UI panels, lab desk, soft blue-white background. | `public/assets/logs/thumb-chatgpt-prompt.webp` | WebP | `640x420` | no | high | no | Avoid readable UI text. |
| `log-thumb-comfyui-cat` | research log thumbnails | Fifth post thumbnail | Dr.よこぼ smiling or laughing in blue lab with image-generation UI mood. | `public/assets/logs/thumb-comfyui-cat.webp` | WebP | `640x420` | no | high | no | “実験メモ” category should be HTML pill. |
| `log-card-wave-mask` | research log thumbnails | Card bottom shape | White curved/wave mask between image thumbnail and text body. | CSS or `public/assets/ui/card-wave-mask.svg` | SVG | `640x120` | yes | medium | no | Prefer CSS border-radius/clip-path unless exact curve is required. |

## Researcher / Profile Section

| Asset ID | Section | Purpose | Visual Description | Suggested File Path | Format | Recommended Size | Transparent | Priority | Text Baked Into Image | Notes |
|---|---|---|---|---|---|---:|---|---|---|---|
| `profile-dr-yokobo-standing` | researcher/profile section | Dr.よこぼ profile image | Full/body or seated fluffy cat scientist in white lab coat, round glasses, friendly expression. | `public/assets/characters/dr-yokobo-profile.png` | PNG | `620x760` | yes | high | no | Can reuse hero character if crop works, but profile version should fit card composition. |
| `profile-nyabbit-standing` | researcher/profile section | Nyabbit profile image | Full robot mascot, cream body, black cyan face, rotor, paws, YKB mark. | `public/assets/characters/nyabbit-profile.png` | PNG | `520x620` | yes | high | no | Clean alpha. |
| `profile-combined-duo` | researcher/profile section | Combined mascot lockup | Dr.よこぼ and Nyabbit standing together for profile card or logo-like layout. | `public/assets/characters/dr-yokobo-nyabbit-duo.png` | PNG | `900x620` | yes | medium | no | Useful for responsive/mobile when separate layout is hard. |
| `profile-button-paw` | researcher/profile section | Button accent | Small paw icon inside profile buttons. | `public/assets/decor/button-paw.svg` | SVG | `28x28` | yes | medium | no | Same as paw accent but sized for buttons. |
| `profile-card-bg-doodles` | researcher/profile section | Subtle card background | Very pale blue lab doodles: flask, atom, stars, paw marks. | `public/assets/backgrounds/profile-card-doodles.svg` | SVG | `900x480` | yes | low | no | Keep low contrast so HTML text stays readable. |
| `profile-name-badge-ykb` | researcher/profile section | Optional character badge | Small YKB logo/badge used on coat/robot. | `public/assets/brand/ykb-badge.png` | PNG | `160x120` | yes | low | yes | May remain baked into character assets instead. |

## Vision Section

Vision section is mostly HTML text plus symbolic icons and pale decorations.

| Asset ID | Section | Purpose | Visual Description | Suggested File Path | Format | Recommended Size | Transparent | Priority | Text Baked Into Image | Notes |
|---|---|---|---|---|---|---:|---|---|---|---|
| `vision-icon-research` | vision section | Value icon for research | Navy/blue outline lab flask or beaker. | `public/assets/vision/icon-research.svg` | SVG | `64x64` | yes | high | no | Label “研究” should be HTML. |
| `vision-icon-creation` | vision section | Value icon for creation | Navy/blue outline lightbulb. | `public/assets/vision/icon-creation.svg` | SVG | `64x64` | yes | high | no | Label “創造” should be HTML. |
| `vision-icon-experiment` | vision section | Value icon for experiment | Navy/blue outline test tube. | `public/assets/vision/icon-experiment.svg` | SVG | `64x64` | yes | high | no | Label “実験” should be HTML. |
| `vision-icon-connection` | vision section | Value icon for connection | Navy/blue outline tangled/connected nodes. | `public/assets/vision/icon-connection.svg` | SVG | `64x64` | yes | high | no | Label “つながり” should be HTML. |
| `vision-icon-infinity` | vision section | Value icon for possibility | Navy/blue infinity mark. | `public/assets/vision/icon-infinity.svg` | SVG | `64x64` | yes | high | no | Label “無限の可能性” should be HTML. |
| `vision-atom-corner` | vision section | Decorative corner icon | Pale blue atom symbol in top/right area. | `public/assets/decor/atom-corner.svg` | SVG | `96x96` | yes | medium | no | Used as low-opacity ornament. |
| `vision-orbit-doodle` | vision section | Decorative icon | Small pale blue orbit/AI doodle. | `public/assets/decor/orbit-doodle.svg` | SVG | `80x80` | yes | low | no | Low contrast. |
| `vision-paw-heading` | vision section | Heading accent | Light blue paw mark near section heading. | `public/assets/decor/paw-heading.svg` | SVG | `48x48` | yes | medium | no | Can reuse `paw-blue.svg`. |

## CTA / Footer Banner

| Asset ID | Section | Purpose | Visual Description | Suggested File Path | Format | Recommended Size | Transparent | Priority | Text Baked Into Image | Notes |
|---|---|---|---|---|---|---:|---|---|---|---|
| `cta-blue-lab-bg` | CTA/footer banner | Banner background | Rounded blue gradient lab scene with pale line drawings of flasks, atom, shelves, sparkle/paw accents. | `public/assets/cta/cta-blue-lab-bg.webp` | WebP | `1400x320` | no | high | no | Banner headline, email placeholder, and button text should be HTML. |
| `cta-nyabbit-left` | CTA/footer banner | Left mascot | Nyabbit flying/standing on left side of blue banner with glowing trail. | `public/assets/cta/nyabbit-banner.png` | PNG | `360x340` | yes | high | no | Can reuse profile robot with additional glow. |
| `cta-dr-yokobo-right` | CTA/footer banner | Right mascot | Dr.よこぼ on right side, smiling and raising one paw, lab coat, glasses. | `public/assets/cta/dr-yokobo-waving.png` | PNG | `420x420` | yes | high | no | Distinct pose from hero; high value for matching reference. |
| `cta-flask-doodles-left` | CTA/footer banner | Background line art | Pale white/blue chemistry bottle and flask outlines on left. | `public/assets/cta/flask-doodles-left.svg` | SVG | `260x260` | yes | medium | no | Can be embedded into `cta-blue-lab-bg`. |
| `cta-atom-doodle-right` | CTA/footer banner | Background line art | Pale atom/chemistry doodle on right. | `public/assets/cta/atom-doodle-right.svg` | SVG | `220x220` | yes | medium | no | Can be embedded into background. |
| `cta-email-input-shape` | CTA/footer banner | Input visual style | Rounded white pill for email field. | CSS | n/a | n/a | n/a | medium | no | Prefer CSS, not image. Placeholder text should be HTML. |
| `cta-submit-button-paw` | CTA/footer banner | Button accent | Yellow/orange rounded CTA button with small paw icon. | CSS + `public/assets/decor/paw-navy.svg` | SVG | `28x28` | yes | medium | no | Text should be HTML. |
| `cta-social-icons` | CTA/footer banner | Social icons row | Small circular icons resembling X, YouTube, music/note, Instagram. | `public/assets/social/*.svg` | SVG | `36x36` each | yes | medium | no | Use actual brand icons only if licensing/brand usage is acceptable; otherwise use neutral placeholders. |

## Decorative Icons And UI Accents

| Asset ID | Section | Purpose | Visual Description | Suggested File Path | Format | Recommended Size | Transparent | Priority | Text Baked Into Image | Notes |
|---|---|---|---|---|---|---:|---|---|---|---|
| `decor-paw-blue` | decorative icons and UI accents | Repeated paw accent | Small rounded light-blue paw print used near headings and buttons. | `public/assets/decor/paw-blue.svg` | SVG | `40x40` | yes | high | no | Appears many times. |
| `decor-paw-white` | decorative icons and UI accents | Paw on blue buttons | White paw mark for primary CTA buttons. | `public/assets/decor/paw-white.svg` | SVG | `32x32` | yes | high | no | Button text remains HTML. |
| `decor-flask-button` | decorative icons and UI accents | Secondary button icon | Small outline flask icon in “最新の研究ログへ” and “研究ログ一覧へ” buttons. | `public/assets/decor/flask-button.svg` | SVG | `34x34` | yes | high | no | Navy stroke. |
| `decor-rounded-page-border` | decorative icons and UI accents | Outer page frame visual | Large white rounded page container border/shadow. | CSS | n/a | n/a | n/a | high | no | Implement as CSS, not image. |
| `decor-section-wave-top` | decorative icons and UI accents | Section transition | Soft white/blue wavy divider between hero and concern section. | CSS or `public/assets/decor/section-wave.svg` | SVG | `1440x120` | yes | medium | no | Reference has gentle wave/rounded transition. |
| `decor-card-border-blue` | decorative icons and UI accents | Card styling | Thin pale blue rounded border with soft shadow. | CSS | n/a | n/a | n/a | high | no | Reused across cards. |
| `decor-blue-sparkles` | decorative icons and UI accents | Small lab sparkle marks | Tiny pale blue sparkles/dots near hero and section headings. | `public/assets/decor/sparkles-blue.svg` | SVG | `80x80` | yes | low | no | Use sparsely. |
| `decor-yellow-rays` | decorative icons and UI accents | Emphasis marks | Yellow/orange hand-drawn rays around important support copy. | `public/assets/decor/yellow-rays.svg` | SVG | `100x80` | yes | medium | no | Can mirror with CSS. |
| `decor-cat-outline` | decorative icons and UI accents | Hologram/UI doodle | Simple cat face outline used inside hologram panel or as tiny decorative mark. | `public/assets/decor/cat-outline.svg` | SVG | `72x72` | yes | low | no | Reusable if hero panel is constructed in layers. |
| `decor-chemistry-bottle` | decorative icons and UI accents | Lab decoration | Outline chemistry bottle icon. | `public/assets/decor/chemistry-bottle.svg` | SVG | `90x90` | yes | medium | no | Used in footer and background doodles. |
| `decor-test-tube` | decorative icons and UI accents | Lab decoration | Outline test tube icon. | `public/assets/decor/test-tube.svg` | SVG | `90x90` | yes | medium | no | Used in vision/buttons. |
| `decor-atom` | decorative icons and UI accents | Science decoration | Rounded atom outline. | `public/assets/decor/atom.svg` | SVG | `100x100` | yes | medium | no | Used in vision and footer. |
| `decor-infinity` | decorative icons and UI accents | Possibility symbol | Navy infinity line icon. | `public/assets/decor/infinity.svg` | SVG | `90x48` | yes | medium | no | Used in vision. |
| `decor-node-share` | decorative icons and UI accents | Sharing symbol | Connected nodes icon. | `public/assets/decor/node-share.svg` | SVG | `80x80` | yes | medium | no | Used in play and vision. |
| `decor-mini-chat` | decorative icons and UI accents | Small chat UI accent | Speech/chat bubble outline with small marks. | `public/assets/decor/mini-chat.svg` | SVG | `80x80` | yes | low | no | Useful for AI tool cards. |

## Text Handling Notes

- Main hero copy, nav labels, section headings, card titles, card descriptions, post dates, post titles, buttons, CTA form text, and footer copy should be HTML text.
- Japanese text visible in cards and buttons in the reference should be recreated as HTML wherever practical.
- Do not bake category pills such as `画像生成`, `3D`, `ゲーム制作`, `AI翻訳`, or `実験メモ` into research thumbnails. Use HTML overlay pills.
- Small object marks such as `YKB` on mug, lab coat badge, or robot chest may be baked into the object/character images.
- Speech bubble shape may be an SVG/PNG asset, but speech text should remain HTML unless exact pixel matching is required.
- Hologram panel should use abstract UI marks and icons, not readable Japanese text, to avoid fragile image text.

## Production Generation Notes

- Character and robot assets should be generated or manually cut out with transparent backgrounds at larger-than-display sizes.
- Full card thumbnails should be WebP scene images, not icons. Keep them visually dense but avoid embedded copy.
- SVG is best for reusable line icons, paw marks, button icons, section doodles, and card accents.
- PNG is best for transparent character/robot/object cutouts.
- WebP is best for non-transparent thumbnails and background scenes.
- Maintain a consistent palette: navy `#102861`, bright blue `#2f7df6`, pale blue backgrounds, white cards, warm beige/yellow accents.
