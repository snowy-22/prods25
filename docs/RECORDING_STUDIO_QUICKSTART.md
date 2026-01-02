# Recording Studio - Quick Start Guide

## 🎯 5-Minute Quick Start

### 1. Open Recording Studio
```
Canvas → Find "Kayıt Stüdyosu" (Recording Studio) widget
```

### 2. Create Your First Timeline
```
Click "Demo" button → Demo timeline appears with 2 scenes
```

### 3. Play It Back
```
Click Play button → Watch the demo timeline play (6 seconds)
```

### 4. Understand the Tabs
```
- Timeline: Visual timeline editor
- Scenes: Current scene details
- Settings: Recording options
- Tutorial: Learn step by step
- Test: Validate your timeline
- Documentation: Browse guides
- Templates: Load pre-built templates
```

---

## 🎓 Learning Path (30 Minutes)

### Step 1: Tutorial Mode (10 minutes)
1. Go to **"📚 Eğitim"** (Tutorial) tab
2. Read "Recording Studio'ya Hoşgeldin" (Introduction)
3. Click "✓ Anladım" (I understand) to move to next step
4. Complete all 8 steps
5. You'll learn: Scenes, Actions, Easing, Timing, Transitions, Recording, Playback Controls

### Step 2: Load a Template (5 minutes)
1. Go to **"📋 Şablonlar"** (Templates) tab
2. Choose a template:
   - **"Hızlı Tanıtım"** (Quick Intro) - 5 seconds, easiest
   - **"Eğitim: Adım Adım"** (Tutorial) - 25 seconds, 4 steps
   - **"Özellik Sunumu"** (Feature Demo) - 30 seconds, interactive
   - **"Minimal Sunum"** (Minimalist) - 15 seconds, clean
3. Click "Şablonu Yükle ve Kullan" (Load Template)
4. Timeline automatically loads in "Timeline" tab

### Step 3: Customize Your Timeline (15 minutes)
1. Go back to **"Timeline"** tab
2. Click on a scene to select it
3. Use the action list to add/remove/edit actions
4. Adjust timing by dragging or entering values
5. Test with **"▶️ Simülatör"** (Simulator) tab
6. Click Play to preview your changes

---

## 🔧 Common Tasks

### Create a Scroll Animation
```
1. Go to Timeline tab
2. Click "Scene 1" to select
3. Click "+ Scroll" button
4. Set duration: 2000ms (2 seconds)
5. Set target: y = 500 (scroll 500px down)
6. Choose easing: ease-in-out-cubic (smooth)
7. Click Play to preview
```

### Add a Zoom Effect
```
1. Select a scene
2. Click "Zoom" to add zoom action
3. Set fromZoom: 0.5 (start at 50%)
4. Set toZoom: 1 (end at 100%)
5. Duration: 2000ms
6. Easing: ease-out
```

### Record Your Timeline as Video
```
1. Toggle "Otomatik Kayıt" ON (Auto Record)
2. Click Play button
3. Recording starts automatically
4. When done, click Stop
5. Click "İndir" (Download) to save as video
```

### Run Timeline Validator
```
1. Go to "🧪 Test" tab
2. Click "✓ Doğrulama" (Validator) section
3. See all errors/warnings
4. Fix issues shown in red
5. Green checkmark = ready to record
```

---

## 📊 Timeline Structure Example

```json
{
  "name": "My First Timeline",
  "duration": 6000,
  "fps": 60,
  "scenes": [
    {
      "name": "Açılış",
      "duration": 3000,
      "actions": [
        {
          "type": "zoom",
          "startTime": 0,
          "duration": 2000,
          "fromZoom": 0.5,
          "toZoom": 1,
          "easing": "ease-out"
        }
      ]
    },
    {
      "name": "İçerik",
      "duration": 3000,
      "actions": [
        {
          "type": "scroll",
          "startTime": 0,
          "duration": 3000,
          "targetPosition": { "x": 0, "y": 500 },
          "easing": "ease-in-out"
        }
      ]
    }
  ]
}
```

---

## ⚡ Pro Tips

### Tip 1: Parallel Actions = Dynamic Videos
```
Don't just do actions one after another.
Run multiple actions at the same time:

Scene duration: 3000ms
- Action 1: scroll (0-3000ms)
- Action 2: zoom (500-2500ms)  ← Overlaps! More interesting
```

### Tip 2: Ease-Out for UI Animations
```
Most UI animations look best with ease-out:
- Starts fast
- Slows down at the end
- Feels natural, not robotic
```

### Tip 3: Add Wait Actions for Pauses
```
Use "wait" action to give viewer time to read:

Scene:
- Show content (animation)
- Wait 3 seconds (viewer reads)
- Move to next scene
```

### Tip 4: Use Transitions Between Scenes
```
Go to scene-transitions-manager:
- Add fade, slide, or zoom transitions
- 300-500ms duration works best
- Connects scenes smoothly
```

### Tip 5: Test Before Recording
```
Before recording:
1. Play timeline at 0.25x speed (slow)
2. Watch for timing issues
3. Use Test tab to validate
4. Check for action overlaps
```

---

## 🎬 Recipe: 10-Second Product Demo

```
Timeline Duration: 10 seconds

Scene 1: Title (2 sec)
├─ Animation: fade-in (0-2000ms)
└─ Done

Scene 2: Feature 1 (3 sec)
├─ Zoom: 2x → 1x (0-1500ms)
└─ Scroll: down 200px (1500-3000ms)

Scene 3: Feature 2 (3 sec)
├─ Scroll: down 200px (0-2000ms)
└─ Animation: scale-up (2000-3000ms)

Scene 4: Call-to-Action (2 sec)
└─ Animation: fade-in (0-2000ms)

Transitions:
- Scene 1→2: fade (300ms)
- Scene 2→3: slide-left (300ms)
- Scene 3→4: fade (300ms)

Total: ~10.9 seconds ✓
```

---

## 🐛 Troubleshooting

### Q: Action doesn't play?
**A**: Check Test tab → Validator. Likely issues:
- Action duration too short (< 300ms)
- Action exceeds scene duration
- startTime + duration > scene duration

### Q: Scroll animation is jumpy?
**A**: 
- Increase duration (minimum 500ms recommended)
- Change easing to ease-in-out-cubic
- Reduce scroll distance (try y: 100 instead of 500)

### Q: Video recording not working?
**A**:
- Check browser permissions (allow screen capture)
- Try Chrome instead of Safari
- Close other recording apps
- Reload page and try again

### Q: Timeline plays too fast?
**A**: 
- Click the Speed control
- Reduce from 1x to 0.5x or 0.25x
- Re-record at slower speed

### Q: Why is my timeline slow to load?
**A**: If > 100 actions:
- Reduce to smaller chunks
- Or use multiple short timelines
- Performance degrades > 100 actions

---

## 📈 Example Timelines to Create

### 1. Website Tour (15 seconds)
```
Scene 1: Welcome (2s)
Scene 2: Homepage section 1 (3s) - scroll down
Scene 3: Homepage section 2 (3s) - scroll down
Scene 4: Feature page (4s) - navigate + scroll
Scene 5: Pricing (2s) - navigate
Scene 6: Thank you (1s) - fade out
```

### 2. Software Tutorial (20 seconds)
```
Scene 1: Intro (2s)
Scene 2: Step 1 - Open menu (4s) - animation + wait
Scene 3: Step 2 - Click button (4s) - animation + scroll
Scene 4: Step 3 - Fill form (4s) - animation + wait
Scene 5: Result (3s) - animation + wait
Scene 6: Conclusion (3s) - fade out
```

### 3. Product Walkthrough (30 seconds)
```
Scene 1: Title (3s)
Scene 2: Feature A (6s) - zoom + scroll + animation
Scene 3: Feature B (6s) - zoom + scroll + animation
Scene 4: Feature C (6s) - zoom + scroll + animation
Scene 5: Integration (6s) - animation + wait
Scene 6: CTA (3s) - fade in
```

---

## 🎓 Next Steps

1. **Complete Tutorial Mode** (📚 Eğitim tab)
2. **Try a Template** (📋 Şablonlar tab)
3. **Read Documentation** (📖 Rehber tab) for advanced features
4. **Create Your First Timeline**
5. **Record and Download**
6. **Share on Social Media**

---

## 🆘 Getting Help

- **Built-in Help**: 📖 Rehber tab has searchable documentation
- **Examples**: 📋 Şablonlar tab has 4 pre-built templates
- **Video**: Watch the Timeline Editor preview
- **Community**: Share your timelines!

---

## 🚀 You're Ready!

Start with a simple 5-second timeline and gradually add more complexity. The Tutorial Mode and Test Tools will help you avoid mistakes.

**Happy automating! 🎉**

---

*Version 1.0 | Recording Studio Quick Start Guide*
