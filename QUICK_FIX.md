# ⚡ QUICK FIX - แก้ไขเร็วๆ 5 นาที

ไฟล์นี้สำหรับแก้ไขปัญหาทั่วไปโดยไม่ต้องอ่านเอกสารยาว

---

## 🎯 ปัญหา 1: เสียงแยกไม่เก่ง (Thai accent)

### วิธีแก้ (2 นาที)

**ไฟล์:** `server/_core/voiceTranscription.ts`

**หา:** บรรทัด 138-142
```typescript
const prompt = options.prompt || (
  options.language 
    ? `Transcribe the user's voice to text, the user's working language is ${getLanguageName(options.language)}`
    : "Transcribe the user's voice to text"
);
```

**แทนที่เป็น:**
```typescript
const prompt = options.prompt || (
  options.language === 'th'
    ? `ถอดเสียงจากการสัมภาษณ์งาน เก็บคำพูดของผู้ตอบแบบถูกต้อง รวมถึง pause และ hesitation`
    : `Transcribe this job interview answer. Keep exact words and pauses.`
);
```

**บันทึก:** Ctrl + X → Y → Enter

**ทดสอบ:**
```bash
pnpm test
```

---

## 🎯 ปัญหา 2: Score ไม่สมเหตุสมผล

### วิธีแก้ (3 นาที)

**ไฟล์:** `server/leanAiService.ts`

**หา:** บรรทัด ~350 ฟังก์ชัน `analyzeResponseLean`

**หา prompt ที่บอก scoring:**
```typescript
const systemPrompt = `คุณคือผู้ประเมินสัมภาษณ์...`;
```

**แทนที่เป็น:**
```typescript
const systemPrompt = `คุณคือผู้ประเมินสัมภาษณ์มืออาชีพ สำหรับตำแหน่ง ${jobRole}

**Scoring Criteria:**
- Communication (40%): พูดชัด มีโครงสร้าง ไม่เงียบนาน
- Professionalism (35%): สุภาพ มั่นใจ เหมาะสมกับบริบท
- Technical Knowledge (25%): ความรู้เกี่ยวข้องกับตำแหน่ง

ให้ score 1-10 โดย:
- 1-3: ต่ำมาก
- 4-6: ปานกลาง
- 7-8: ดี
- 9-10: ยอดเยี่ยม

ส่งคืน JSON เท่านั้น`;
```

**บันทึก:** Ctrl + X → Y → Enter

---

## 🎯 ปัญหา 3: ลองใช้ Model ที่ดีกว่า

### วิธีแก้ (1 นาที)

**ไฟล์:** `server/_core/llm.ts`

**หา:** บรรทัด 283
```typescript
model: "gemini-2.5-flash"
```

**แทนที่เป็น:**
```typescript
// ลองใช้ Gemini Pro (ดีกว่า แต่แพง 2 เท่า)
model: "gemini-1.5-pro"
```

**บันทึก:** Ctrl + X → Y → Enter

**ทดสอบ:**
```bash
pnpm test
```

**ถ้าดีกว่า ให้เปลี่ยนกลับเป็น Flash (ราคาถูก)**
```typescript
model: "gemini-2.5-flash"
```

---

## 🎯 ปัญหา 4: Question ไม่เกี่ยวข้องกับ Resume

### วิธีแก้ (2 นาที)

**ไฟล์:** `server/leanAiService.ts`

**หา:** ฟังก์ชัน `generateInterviewQuestionLean` (~บรรทัด 200)

**หา:** `const systemPrompt = ...`

**แทนที่เป็น:**
```typescript
const systemPrompt = `คุณคือสัมภาษณ์ AI มืออาชีพ สำหรับตำแหน่ง ${jobRole}

**สำคัญ:**
- สร้างคำถามจากทักษะและประสบการณ์ของผู้สัมภาษณ์
- ใช้ STAR method (Situation, Task, Action, Result)
- คำถามต้องท้าทาย แต่เป็นธรรมชาติ
- เน้นจุดแข็งและจุดที่ต้องพัฒนา

ส่งคืน JSON เท่านั้น`;
```

**บันทึก:** Ctrl + X → Y → Enter

---

## 🎯 ปัญหา 5: Feedback ไม่มีความหมาย

### วิธีแก้ (3 นาที)

**ไฟล์:** `server/leanAiService.ts`

**หา:** ฟังก์ชัน `generateFinalFeedbackLean` (~บรรทัด 450)

**แทนที่ systemPrompt:**
```typescript
const systemPrompt = `คุณคือ career coach มืออาชีพ ให้ feedback ที่ actionable

**Format Feedback:**
1. **Strengths** (จุดแข็ง): 2-3 ข้อที่ทำได้ดี
2. **Weaknesses** (จุดอ่อน): 2-3 ข้อที่ต้องปรับปรุง
3. **Suggestions** (คำแนะนำ): 3-5 ข้อที่ทำได้จริง

ทำให้ specific, measurable, actionable

ส่งคืน JSON เท่านั้น`;
```

**บันทึก:** Ctrl + X → Y → Enter

---

## 🚀 Quick Test Commands

```bash
# ทดสอบทั้งหมด
pnpm test

# ทดสอบ 1 ไฟล์
pnpm test -- leanAiService.test.ts

# ทดสอบ 1 function
pnpm test -- leanAiService.test.ts -t "parseResumeLean"

# ดู dev server logs
tail -f .manus-logs/devserver.log

# ดู browser console logs
tail -f .manus-logs/browserConsole.log
```

---

## 📊 Cost Check

```bash
# คำนวณ cost ของ 1 interview
python3 /tmp/cost_calc.py
```

**ปัจจุบัน:** $0.00108 ต่อ interview (~฿0.04)

---

## ✅ Checklist ก่อน Deploy

- [ ] `pnpm test` ผ่านทั้งหมด
- [ ] ไม่มี TypeScript errors
- [ ] Dev server ทำงานได้ (port 3001)
- [ ] Resume parsing ถูกต้อง
- [ ] Voice transcription ถูกต้อง
- [ ] Score สมเหตุสมผล
- [ ] Feedback มีความหมาย

---

## 🆘 ถ้าติด

```bash
# ดู error message ชัดเจน
pnpm test 2>&1 | head -50

# ดู dev server status
curl http://localhost:3001/

# รีสตาร์ท dev server
pkill -f "tsx watch"
pnpm dev
```

---

## 💡 Pro Tips

1. **ปรับ 1 ครั้ง 1 ไฟล์** - ไม่ต้องแก้หลายไฟล์พร้อมกัน
2. **รัน test ทุกครั้ง** - ตรวจสอบว่าแก้ไขถูกต้อง
3. **ใช้ nano ไม่ใช้ vim** - ง่ายกว่า
4. **บันทึก Ctrl + X → Y → Enter** - ไม่ลืม!
5. **ดู logs ขณะ test** - เข้าใจปัญหาได้ดีกว่า

---

**ทำได้ 5 นาที! ไปเลย! 🚀**
