# SADO Project — Full Context Handoff

Paste this entire file into a new chat, or upload it, so Claude can continue exactly where this conversation left off. This is written for Claude to read, not for Xusan to parse — it's dense and detailed on purpose.

---

## Who Xusan is / how to work with him

- Developer based in Uzbekistan, intermediate skill level (knows Python basics, pandas/numpy basics), learning ML/AI hands-on through this project.
- Wants to be treated as an active agent-directed collaborator: Claude should take initiative, execute directly, minimize unnecessary back-and-forth, and actually do things rather than just explain them — but Xusan has also explicitly said **"do not build anything — including websites — without my permission first."** Always check before generating new artifacts/code, especially large ones.
- Values honesty over cheerleading. Has explicitly called out Claude for being slow to suggest existing datasets/pre-trained models instead of manual work, and for making a reasoning mistake tweaking `frame_interval`. Wants direct, corrected answers, not defensive hedging.
- Gets easily distracted/anxious about "am I ready," "should I take a course first," "should I learn X first" — Claude has repeatedly (successfully) redirected him toward just building, with the philosophy of just-in-time learning (learn only what's needed for the next concrete step).
- Uses Sonnet 5 by default to conserve usage; wants Claude to flag proactively when a task genuinely benefits from a stronger model (Opus/Fable 5) so he can switch in advance. Had a free week of Claude Pro + Fable 5 access (used for MediaPipe debugging and exploring frontend ideas); that trial has since ended, back on the free plan.
- Has a Google AI (Gemini) Pro free trial month too — agreed use is research/translation/pitch-deck writing, NOT coding (coding stays with Claude, which has full project context).
- Communicates casually and briefly; prefers being walked through UI clicks/terminal commands step by step with screenshots, since he's still building git/VS Code fluency.

---

## The project: SADO

**What it is:** An AI-powered real-time sign language translator for the deaf community in Uzbekistan, targeting Russian Sign Language (RSL) and Uzbek Sign Language (USL) — USL is a dialect of RSL, not separately well-resourced online. Personal motivation: a deaf neighbor was denied a job due to communication barriers.

**Name meaning:** "SADO" means "voice" in Uzbek, also a word used in poetry — chosen deliberately as a strong, meaningful brand name. Not yet used publicly anywhere except the new GitHub repo name; save for when there's a working demo.

**Competition target:** President AI Award 2026 (Uzbekistan), "President AI Award" track specifically (not "President Tech Award," a separate program on the same site) — National AI Startup Competition and Acceleration Program, Education AI category most relevant (also touches Government AI / accessibility). Prize fund $5,000,000 site-wide / $1,000,000 for this program per the official Telegram announcement Xusan found. Key dates from the site: Applications opened July 1; Early Bird deadline Aug 15; **Final Deadline Sept 30**; Judging begins Oct 15; Finalists announced Nov 5; Awards ceremony Nov 20.

**Official requirements (per the President AI Award Telegram channel, which Xusan pasted verbatim — this is the authoritative source, more reliable than the website UI exploration):**
- Team of 3–8 people, Uzbekistan citizens or permanent residents
- A **working MVP** (not just an idea/mockup)
- A 3-minute video pitch
- A GitHub repository link ("experts will review your code")
- A PDF pitch deck + project logo
- Everything prepared in Uzbek, Russian, AND English

**Important framing Xusan pushed back on and Claude now agrees with:** the goal is real-world *impact* for the deaf community, not passing a code-review exam. A past IT Park CEO said impact matters most and that AI-assisted building is fully expected/normal — last year's winners reportedly used AI extensively. So heavy AI-assisted development is fine and expected; the bar is "does it work and help people," not "did a human type every line."

**Team:**
- **Xusan** — AI/ML lead (this is his account, he's the one Claude has been talking to all along)
- **Jaloliddin** — Frontend/App Lead (was mistakenly referred to as "Body" for a long stretch of this conversation due to a typo Xusan made — NOT a real person, just Jaloliddin mistyped once and Claude ran with it as a separate teammate name for many turns. This has been corrected.)
- **Muhammadaziz** — Data & Community Research Lead

Both teammates were sent (or are about to be sent) detailed setup instructions to replicate Xusan's dev environment and either (a) learn+record the same 25 RSL signs independently for data diversity, or (b) build the frontend using their own Claude accounts.

---

## Full technical build history, in order

### Phase 1 — Environment setup (painful, extended troubleshooting)
- Started on Python 3.13 (installed by default) — MediaPipe does not support 3.13 reliably.
- Project folder moved from `C:\...` to `D:\sign-language-translator` mid-setup, causing a cascade of broken venvs, wrong pip targets, mismatched paths.
- Resolved by: uninstalling Python 3.13 entirely, installing **Python 3.11.9** specifically (had to find the right python.org release page — 3.11.9 was the last version with a Windows GUI installer; 3.11.15 only offered source tarball on Windows), creating a fresh venv with `py -3.11 -m venv venv` **inside `D:\sign-language-translator`**, activating it, then:
  ```
  pip install opencv-python==4.9.0.80 mediapipe==0.10.14 numpy==1.26.4
  ```
  This exact version pinning is what ended up working reliably. (Earlier attempts with unpinned `mediapipe` installed 0.10.35, which uses a different/newer API — `mp.solutions.hands` didn't exist in that version, causing `AttributeError: module 'mediapipe' has no attribute 'solutions'`. Pinning to 0.10.14 restored the classic `mp.solutions.hands` API used throughout the rest of the project.)
- Recurring gotcha: VS Code's "Run" button sometimes reused a stale terminal causing `KeyboardInterrupt` on launch — workaround is always opening a **new terminal** (the `+` button) before running scripts.
- Recurring gotcha: git default branch was `master` (not `main`), causing repeated `src refspec main does not match any` push failures until this was understood. Standard fix used repeatedly: `git push origin master:main` (sometimes with `--force` or after `git pull origin main --allow-unrelated-histories`).

### Phase 2 — Basic scripts (Week 1 conceptually)
- `webcam_test.py` — first script, opens webcam with OpenCV, draws text, flip/BGR color basics taught here (`cv2.VideoCapture(0)`, `cv2.flip(frame,1)`, BGR color tuples, `cap.release()`/`destroyAllWindows()`).
- `hand_detection.py` — added MediaPipe Hands, drew 21-landmark skeleton overlay. Initially `max_num_hands=1`, later upgraded to `max_num_hands=2`.
- First GitHub repo created: **`mediapipe-hand-demos`** (github.com/abdullayevhusan1015/mediapipe-hand-demos) — Public, with a `.gitignore` (Python template) and a written README. This repo currently only contains `webcam_test.py` and `hand_detection.py` — later work (`data_collection.py` etc.) was never pushed here before the team pivoted to a new repo (see below). **This repo is effectively superseded/deprecated now.**

### Phase 3 — Data collection pipeline
- `data_collection.py` built (originally via Claude Code, later hand-edited directly by Xusan without Claude Code once his Pro trial ended): press a key to select a sign label, hold SPACE to record, saves 21-landmark-per-hand data to `data/signs.csv`.
- First recording attempt used **placeholder/made-up gestures** (fist, open palm, peace sign, thumbs up/down, etc.) mapped to 10 word labels (salom, rahmat, yaxshi, yordam, oila, ish, ha, yoq, kechirasiz, xayr) — NOT real RSL. This was explicitly a proof-of-concept to validate the pipeline mechanics (record → train → predict), not real sign data.
- `train_classifier.py` built: loads CSV, 80/20 train/test split (stratified by label), trains a `RandomForestClassifier`, prints accuracy, saves `model.pkl` via pickle.
- First training run on placeholder data hit **100% accuracy** — flagged as likely **data leakage** (near-duplicate consecutive frames from the same continuous recording burst ending up split across train/test) rather than genuine generalization.
- Built `live_test.py`: loads `model.pkl`, runs live webcam inference, shows predicted label on screen with no recording — the real generalization test.
- Live test revealed real confusion (e.g., thumbs-up vs thumbs-down, mapped to "yaxshi" vs "ish," were confused with each other) — diagnosed as the two gestures being near-mirror-images with very similar hand landmark geometry, a genuine, structural confusability, not a data quantity problem alone. Recommended fix at the time: pick more visually distinct placeholder shapes, OR (the actual eventual decision) move to real signs entirely.

### Phase 4 — Two-hand upgrade
- Xusan asked whether any RSL words require two hands (yes — e.g. "семья"/family commonly does) and flagged that MediaPipe was only tracking one hand.
- Full pipeline upgraded via Claude Code to `max_num_hands=2`:
  - `hand_detection.py`: `max_num_hands=1` → `2`.
  - `data_collection.py`: now records **129 columns** total: `label`, `left_present`, `right_present`, then 21 landmarks × (x,y,z) for left hand (63 values) + same for right hand (63 values) = 126 real feature columns + 3 bookkeeping columns = 129. A hand not currently visible is zero-filled rather than the row being skipped, keeping every row's shape consistent. A **schema guard** was added: on startup, the script reads the existing CSV header and refuses to append if it doesn't match the new 129-column layout, preventing silent corruption from mixing old 65-column single-hand data with new data.
  - **Handedness/mirroring detail (important, documented in code comments):** MediaPipe's Left/Right classification (`results.multi_handedness`) assumes a mirrored/selfie-view input. The scripts' existing `cv2.flip(frame, 1)` mirror step is what makes MediaPipe's "Left"/"Right" output match the user's true anatomical hand. If that flip line is ever removed or altered, Left/Right labels would silently swap with no obvious error — flagged as fragile and commented in the code.
  - `train_classifier.py` and `live_test.py` updated to expect/produce 126 feature columns (dropping the 3 bookkeeping columns before training/inference).
- Old single-hand placeholder data (`data/signs.csv`) was deleted entirely since it was structurally incompatible with the new 129-column format AND was placeholder gestures anyway, not real signs.

### Phase 5 — Switch to real RSL signs
- Xusan realized the placeholder gesture data wasn't real sign language and wouldn't actually help anyone — pivoted to learning real RSL from **spreadthesign.com** (switched interface to Russian sign language; searches by Russian word even though Xusan doesn't speak Russian — just watches the video, doesn't need to read).
- One search glitch encountered: searching "Извините" (sorry) at one point returned an unrelated mistranslated result ("космическое пространство" / outer space) due to a language-setting mismatch on the site — resolved by properly setting the "Select language" dropdown to Russian and/or trying alternate words (простите).
- Final word list locked in — **25 words**, mapped to keyboard keys (top number row + top two letter rows), covering greetings, politeness, workplace/school vocabulary per the original pitch:

| Key | Uzbek | Russian search term | English |
|---|---|---|---|
| 1 | salom | Привет | hello |
| 2 | xayr | Пока | goodbye |
| 3 | rahmat | Спасибо | thank you |
| 4 | kechirasiz | Извините | sorry/excuse me |
| 5 | ha | Да | yes |
| 6 | yoq | Нет | no |
| 7 | yordam | Помощь | help |
| 8 | yaxshi | Хорошо | good |
| 9 | yomon | Плохо | bad |
| 0 | oila | Семья | family (likely two-handed) |
| q | ish | Работа | work |
| w | ism | Имя | name |
| e | tushunaman | Понимаю | I understand |
| r | tushunmayman | Не понимаю | I don't understand |
| t | iltimos | Пожалуйста | please |
| y | vaqt | Время | time |
| u | bugun | Сегодня | today |
| i | ertaga | Завтра | tomorrow |
| o | suv | Вода | water |
| p | ovqat | Еда | food |
| a | pul | Деньги | money |
| s | kitob | Книга | book |
| d | maktab | Школа | school |
| f | do'st | Друг | friend |
| g | sog'lik | Здоровье | health |

- `SIGNS` dictionary in `data_collection.py` was manually updated (by Xusan, without Claude Code, following exact code Claude wrote out in chat) to this key→word mapping. Note: the on-screen UI text still says "(press 0–9)" as a leftover cosmetic label bug — functionally harmless, just not updated to reflect the new key range.
- Xusan raised a real, unresolved concern: some RSL signs (per what he's observed learning them) involve **mouth movement, facial expression, or proximity to the face/cheeks**, meaning pure MediaPipe Hands tracking may be structurally blind to distinguishing information for those specific words (this is analogous to real "non-manual markers" in sign language linguistics). Discussed at length; **not yet resolved**. Proposed diagnostic: for each of the 25 words, check "if I covered my face, could someone who knows RSL still tell this sign apart from the others using hand movement alone?" Proposed real fix if needed: add MediaPipe Face Mesh landmarks alongside Hands and re-record with the combined feature set — a real, non-trivial upgrade, not yet built. Xusan was pointed to **rslcorpus.nstu.ru** (an academic, ELAN-annotated RSL linguistic corpus from Novosibirsk State Technical University, ~230 videos/43 signers, covers two regional RSL dialects, has a linked linguistics textbook) as a more authoritative resource to check this than guessing — **exploration of this site was not completed in this conversation.**
- Xusan recorded the full 25-word set once cleanly (after having earlier redone a smaller "fist/palm/peace" 3-shape test that got summary counts salom:109/rahmat:116/yaxshi:107 — that was placeholder data, later fully replaced). Final full recording summary for the two-hand real-sign 25-word session: **all 10 of the original first batch succeeded** (salom 109, rahmat 123, yaxshi 103, yordam 104, oila 108, ish 112, ha 119, yoq 109, kechirasiz 110, xayr 117 — note this specific summary table was from an earlier 10-word batch structure, may not map 1:1 to the newer 25-word key scheme; **the exact final sample counts for the full 25-word real-RSL recording were not confirmed/pasted into this conversation** — worth checking `data/signs.csv` directly in the next session to see current state).

### Phase 6 — Pre-trained model detour (Slovo / SignFlow / MViTv2) — tried and explicitly abandoned
This was a long, important detour. Full detail because the reasoning matters for not repeating it:

- Xusan wanted to scale past self-recording (worried about needing "100+ signs" or eventually "1000s" and not wanting the whole team to hand-record everything). Claude pointed to the **Slovo dataset**: github.com/hukenovs/slovo — "Slovo: Russian Sign Language Dataset," 20,400 RGB videos, 1000 sign classes, 194 signers, ~16GB full video, arXiv paper linked. Repo offers several download options:
  - `Slovo` (~16GB) — trimmed HD+ videos
  - `Origin` (~105GB) — original uncut videos
  - `360p` (~13GB) — resized videos
  - **`Landmarks` (~1.2GB)** — pre-extracted MediaPipe hand-landmark annotations for each frame of trimmed videos — **this is the one identified as most useful/lightweight for Xusan's actual use case, but was NOT actually downloaded or used yet in this conversation** — remains a real, promising next step.
  - `annotations.csv` — columns: `attachment_id`, `user_id`, `width`, `height`, `length`, `text` (Russian word/gloss), `train` (bool), `begin`, `end` (frame range of the gesture).
- Repo also offers **pre-trained full models** (not just data): MViTv2-small (16-4 / 32-2 / 48-2 frame configs), Swin-large, ResNet-i3d — each with ONNX and TorchScript weights and a documented accuracy "Metric" score. Also a separate **SignFlow models** table: SignFlow-A (63.3 Top-1 on WLASL-2000, which is an *American* Sign Language benchmark — likely not RSL-relevant) and SignFlow-R (~50,000 samples, 267 classes, "tested with GigaChat").
- Xusan downloaded **SignFlow-R.onnx** first. On investigation, this was found to have **no documented usage instructions, no published class list, and no separate demo script** in the repo — using it would mean guessing at input format/normalization and, more importantly, having no reliable way to map its 267 output indices to actual words. **Decision: abandoned SignFlow-R** due to lack of documentation, not tried live.
- Pivoted to **MViTv2-small-32-2.onnx** (filename on disk: `mvit32-2.onnx`, ~134–140MB) — this model IS documented: repo's `demo.py` + `config_example.yaml` + `constants.py` (the actual 1000-word class list, in Russian, confirmed to include many of Xusan's 25 target words: семья/family, помочь/help, хороший/good, да/yes, друг/friend, вода/water, деньги/money, книга/book, школа/school, имя/name, понимаю/understand, плохо/bad, привет/hello, пока/goodbye, etc.) form a complete, working pipeline.
- **How `demo.py` actually works (important architectural fact):** it does NOT use MediaPipe or hand landmarks at all. It's a raw-video transformer: takes full camera frames (not cropped to hands), resizes to 224×224, normalizes with `mean=[123.675,116.28,103.53]` / `std=[58.395,57.12,57.375]` (config-file values, must match training — NOT freely tunable), collects a **window of 32 frames sampled at `frame_interval=2`** (meaning ~64 raw camera frames / roughly 2+ seconds at normal webcam framerate) before making one prediction via ONNX Runtime, then looks up the predicted class index in `constants.py`. Since it sees the whole frame (not isolated hand landmarks), it can in principle handle two-handed signs and full-body signs without MediaPipe's hand-count limitations — this was confirmed as a real architectural advantage over the self-built approach, though not confirmed as *working correctly* live.
- Setup process for this (all files were placed together in `D:\sign-language-translator`): downloaded `mvit32-2.onnx` weights, copied `demo.py` and `constants.py` from the GitHub repo into the project folder, created `my_config.yaml`:
  ```yaml
  model_path: mvit32-2.onnx
  frame_interval: 2
  mean: [123.675, 116.28, 103.53]
  std: [58.395, 57.12, 57.375]
  ```
  Installed new packages: `pip install onnxruntime loguru omegaconf`. Ran with `python demo.py -p my_config.yaml`.
- **Live testing result — this model was ultimately REJECTED as the project's core recognizer.** Reasons, in the order they surfaced:
  1. The documented benchmark accuracy itself is only **64.09%** ("Metric" column) — meaning even in the researchers' own controlled test conditions, roughly 1 in 3 predictions is wrong. This is inherent to the model weights, not fixable via config.
  2. Xusan mistakenly changed `frame_interval` from 2 to 3 hoping to fix perceived timing issues (predictions felt like they fired after ~1 second instead of matching his ~2-second sign) — this made things **worse**, correctly diagnosed afterward as a real mistake: `frame_interval` is a training-matched hyperparameter baked into the model name (`32-2`), not a free tuning knob; changing it feeds the model a sampling pattern it was never trained on. Reverted back to `2`.
  3. Even after reverting to correct config, live predictions remained frequently wrong across multiple tested signs, including on words Xusan was confident he signed correctly.
  4. One correct prediction *was* observed once (привет/hello), but repeat testing under nominally the same conditions did not reliably reproduce this — consistent with genuine ~64%-ish real-world accuracy rather than a config bug.
  5. Combined with the ~2-second-per-prediction latency (inherent to the 32-frame-window architecture), this was judged **too slow and too unreliable for a live product demo or real conversational use** — a real, structural limitation of this class of model at this accuracy level, not something fixable by Xusan/Claude in the available timeframe (would require actual fine-tuning with real GPU training infrastructure — discussed and also set aside, see below).
- **A teammate (Jaloliddin) separately proposed spending ~$300 on RunPod GPU rental to train a model on the "16GB, 20,400 videos" from scratch**, citing (inaccurately) that "multiple CPUs" could finish training in 72 hours. Claude corrected the technical inaccuracy (video model training needs GPUs, not CPUs, for that timeframe) and, more importantly, pointed out this would be re-attempting the same general approach (train/use a large raw-video model) that was just tested and found to have inherent accuracy/latency issues — **not clearly worth the cost or time given what was just learned.** This was NOT resolved with Jaloliddin directly in this conversation — Xusan was going to relay the explanation, but confirmation that this happened, or Jaloliddin's response, is not in this conversation.

- **Final decision (explicit, repeated, and firm) at the end of this conversation: ABANDON the large pre-trained video model (MViTv2/Slovo-model and SignFlow-R) as SADO's core recognizer. Return to and continue building out the self-built lightweight pipeline (MediaPipe landmarks → RandomForestClassifier)** — reasons: instant single-frame inference (no 2-second wait), fully understood/explainable/debuggable by Xusan himself, was more reliable within its own smaller vocabulary during earlier testing, and matches the "genuinely useful for real people" bar better than a technically larger but unreliable system.
- **Agreed-upon path forward (not yet executed):** use Slovo's **Landmarks** file (~1.2GB pre-extracted MediaPipe keypoints, NOT the video or the pre-trained model) as additional training data for the *existing* self-built classifier — cross-reference target words against `annotations.csv`'s `text` column and `constants.py`'s class list (many matches already identified, listed above), extract matching landmark rows, reformat into the existing 129-column CSV schema, merge with the team's own recorded data, retrain `train_classifier.py` on the combined, larger, multi-signer dataset. **This extraction/merge script has NOT been written yet** — it's the immediate next concrete technical task.
- The downloaded `SignFlow-R.onnx` and `mvit32-2.onnx` files (large, no longer needed) were flagged to be excluded from git via `.gitignore` (`*.onnx` rule) rather than deleted from disk (kept locally in case revisited, but not to be pushed to GitHub).

### Phase 7 — Frontend
- A detailed frontend brief was written twice: first scoped to a single-page "demo-focused" SADO interface (camera panel + translation feed + language toggles), then — after Xusan clarified he wants a large, ambitious multi-page site (landing page, sign→text translator, text→sign translator with placeholder animation, login/signup UI-only, user dashboard mock, admin user-table mock, about/impact/team pages) — rewritten to that fuller scope, explicitly as **frontend-only with clearly commented mock/placeholder logic everywhere**, meant to be swappable for real backend/model/auth later. Design direction specified: Uzbek visual identity (Registan-tilework-inspired deep lapis blue / turquoise / warm sand, NOT generic blue/white SaaS), strong accessibility (high contrast, large text, non-audio-only status cues) given the target users are deaf/HoH.
- An early React frontend attempt (built via Claude Code on a git branch literally named `frontend`, with real component files like `Hero.jsx`, `LoginPage.jsx`, `WebcamPanel.jsx`, `TileBand.jsx` — a decorative Registan-pattern SVG divider component) was reviewed by Xusan and **explicitly rejected/called "trash."** The entire `frontend` git branch and the local `frontend/` folder on disk were **deleted** (`git branch -D frontend`, then `Remove-Item -Recurse -Force frontend`) at Xusan's explicit request. **Frontend is being restarted from scratch**, to be built by teammate Jaloliddin using his own separate Claude account, following the multi-page brief above.
- Separately, earlier in this conversation (before the "trash" verdict), Claude itself built a **standalone HTML/CSS/JS single-file prototype** of a simpler SADO interface (camera panel with real `getUserMedia` webcam access, mock translation feed with a "voicewave" animation motif, RSL/USL and Uzbek/Russian toggles, Registan-tilework-inspired color palette) as an artifact, delivered as `/mnt/user-data/outputs/sado-ui.html`. Xusan's reaction to this specific artifact was not explicitly stated as good or bad, but the **general instruction "don't build anything, including websites, without asking permission first" was given after this**, and should be treated as a standing rule for the rest of the project.

### GitHub state (as of end of this conversation — LIKELY UNRESOLVED, check first)
- **Old repo** (effectively deprecated): `github.com/abdullayevhusan1015/mediapipe-hand-demos` — contains only `webcam_test.py`, `hand_detection.py`, `.gitignore`, `README.md`. Does not have any of the later work.
- **New/current main repo**: `github.com/abdullayevhusan1015/SADO` — created with a proper description ("AI-powered real time sign language translator for deaf people, specifically for uzbek and russian people"), but at the end of this conversation **only contained the initial README commit** — the actual code push was in progress and hit two unresolved problems in sequence:
  1. Local branch was `frontend`, not `master`/`main` — had to `git checkout master` after committing/discarding frontend work, then delete the `frontend` branch.
  2. When attempting `git add constants.py demo.py live_test.py train_classifier.py my_config.yaml hand_landmarker.task .gitignore` followed by commit+push, **git reported these files as "ignored by one of your .gitignore files"** and the commit only included the `.gitignore` change itself (**"1 file changed, 0 insertions"**) — meaning **none of the actual code was pushed**. The cause was not diagnosed in this conversation — Xusan was about to run `cat .gitignore` to inspect the actual gitignore contents (likely a broad rule like `*.py` got added accidentally at some point, e.g. from the earlier `echo "*.onnx" >> .gitignore` / `echo "opencv/" >> .gitignore` commands, or possibly a leftover rule from the deleted frontend branch's gitignore). **This must be checked and fixed first in the next session** — `cat .gitignore`, find and remove whatever overly-broad rule is blocking `.py`/`.yaml`/`.task` files, then re-add/commit/push.
  3. Additionally, the push itself was also rejected once for the usual "diverged history" reason (`master` and the new repo's `main` have unrelated histories) — the fix pattern used successfully earlier in the project for this exact issue is:
     ```
     git pull origin main --allow-unrelated-histories
     git push origin master:main
     ```
     (sometimes `--force` was needed in earlier, analogous situations with the old repo).
- **Net result: as of the end of this conversation, the SADO GitHub repo does NOT yet contain the actual working code** (`data_collection.py`, `train_classifier.py`, `live_test.py`, `hand_detection.py`, `constants.py`, `demo.py`, `my_config.yaml`, `hand_landmarker.task`). This is the single most urgent unresolved task for the next session, since the competition requires a reviewable GitHub repo.

---

## Immediate next steps, in priority order, for the next session

1. **Fix the GitHub push.** Run `cat .gitignore`, identify why real code files are being ignored, fix the gitignore, then successfully commit and push all real project files (Python scripts, config, `.task` file) to `github.com/abdullayevhusan1015/SADO`, main/master branch reconciled. Confirm by checking the repo in browser that files actually appear.
2. **Confirm current state of `data/signs.csv`.** Check whether the full 25-word real-RSL two-hand recording session's sample counts were ever confirmed (this wasn't clearly captured in this conversation) — may need Xusan to re-check or top up any under-recorded words.
3. **Resolve the non-manual-markers (face/mouth) question** for the 25-word list — either via rslcorpus.nstu.ru research, or empirically by testing whether hands-only tracking can distinguish visually-similar pairs.
4. **Build the Slovo-Landmarks extraction/merge script** — download the ~1.2GB pre-extracted MediaPipe landmarks file + `annotations.csv`, filter to the 25 target words (or however many are covered), reformat into the existing 129-column schema, merge with the team's own recorded CSVs (Muhammadaziz's `signs_muhammadaziz.csv` once he sends it), retrain `train_classifier.py` on the combined dataset, and re-test with `live_test.py`.
5. **Frontend** — Jaloliddin building fresh, using the multi-page brief above, on his own Claude account. Should periodically check in on progress and merge his work into the SADO repo (likely via a properly-managed feature branch this time, given the last attempt was deleted).
6. **Pitch deck, application text (Uzbek/Russian/English), outreach to Society of the Deaf of Uzbekistan / Sharoit Plus** — assigned to Muhammadaziz, status/progress unknown, should be checked on.
7. Longer-term/not urgent: the local-LLM sentence-grammar-reordering layer (taking a sequence of recognized signs and outputting a grammatically fluent sentence) was discussed as a legitimate, achievable architecture addition but not started.

---

## Things Claude should NOT do / should remember about its own behavior in this project

- **Never build/generate substantial new code, files, or UI without asking Xusan first** — this was an explicit correction after the HTML prototype and the React frontend attempt.
- **Check for existing datasets/pre-trained models/tools before recommending manual/from-scratch work** — Xusan was frustrated that Claude took a while to point him toward Slovo instead of having him record everything by hand; this should be reflexive going forward for any new sub-problem (e.g., before suggesting he build the sentence-grammar layer from scratch, check if something usable already exists).
- **Don't casually change working configuration values without being sure of the mechanism** — the `frame_interval` mistake (assumed it was a free tuning parameter when it was actually training-matched) is a specific cautionary example; verify assumptions about pretrained-model hyperparameters before suggesting changes.
- **Always confirm exact downloaded filenames before referencing them in config/code** — a mismatch between an assumed filename (`MViTv2-small-32-2.onnx`) and the actual saved filename (`mvit32-2.onnx`) caused avoidable confusion; ask Xusan to confirm the literal filename after any download.
- Xusan does not have Claude Code available anymore (Pro trial ended) — assume he's working directly in VS Code, needs exact copy-pasteable code blocks and exact terminal commands, and needs screenshots interpreted carefully since he's still building git/terminal fluency.
