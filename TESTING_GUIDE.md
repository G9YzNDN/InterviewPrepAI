# 🧪 TESTING GUIDE - Backend Testing & Optimization

คู่มือการทดสอบและแก้ไข backend โดยไม่ยุ่งกับ frontend

---

## 📋 ไฟล์สำคัญที่ต้องแก้ไข

### 1. **server/leanAiService.ts** - AI Prompts & Logic
- ที่อยู่: `/home/ubuntu/interview-prep-ai/server/leanAiService.ts`
- ใช้สำหรับ:
  - ปรับ system prompts
  - เปลี่ยน model
  - ปรับ token limits
  - ปรับ scoring logic

### 2. **server/routers.ts** - API Endpoints
- ที่อยู่: `/home/ubuntu/interview-prep-ai/server/routers.ts`
- ใช้สำหรับ:
  - เปลี่ยน transcription language
  - ปรับ error handling
  - เพิ่ม logging

### 3. **server/_core/voiceTranscription.ts** - Voice Processing
- ที่อยู่: `/home/ubuntu/interview-prep-ai/server/_core/voiceTranscription.ts`
- ใช้สำหรับ:
  - ปรับ Whisper prompt
  - เปลี่ยน language detection
  - ปรับ audio preprocessing

### 4. **server/_core/llm.ts** - LLM Configuration
- ที่อยู่: `/home/ubuntu/interview-prep-ai/server/_core/llm.ts`
- ใช้สำหรับ:
  - เปลี่ยน model (Gemini 2.5 Flash → Pro → Ultra)
  - ปรับ max_tokens
  - ปรับ thinking budget

---

## 🔧 วิธีแก้ไขไฟล์ Backend

### **ขั้นตอน 1: เปิด Terminal**
```bash
cd /home/ubuntu/interview-prep-ai
```

### **ขั้นตอน 2: แก้ไขไฟล์ด้วย nano/vim**
```bash
# ใช้ nano (ง่ายกว่า)
nano server/leanAiService.ts

# หรือใช้ vim
vim server/leanAiService.ts
```

### **ขั้นตอน 3: บันทึกและออก**
```
Ctrl + X (nano) → Y → Enter
:wq (vim)
```

### **ขั้นตอน 4: รัน test**
```bash
pnpm test
```

---

## 🎯 Test Cases ที่ควรทำ

### **Test 1: Resume Parsing**
```bash
# ทดสอบการแยกข้อมูล resume
pnpm test -- leanAiService.test.ts -t "parseResumeLean"
```

**ตรวจสอบ:**
- ✅ Extract skills ถูกต้อง
- ✅ Extract experience ถูกต้อง
- ✅ Extract education ถูกต้อง

### **Test 2: Question Generation**
```bash
# ทดสอบการสร้างคำถาม
pnpm test -- leanAiService.test.ts -t "generateInterviewQuestionLean"
```

**ตรวจสอบ:**
- ✅ คำถามเกี่ยวข้องกับ resume
- ✅ คำถามเกี่ยวข้องกับ job role
- ✅ คำถามมีความยาวเหมาะสม

### **Test 3: Response Analysis**
```bash
# ทดสอบการวิเคราะห์คำตอบ
pnpm test -- leanAiService.test.ts -t "analyzeResponseLean"
```

**ตรวจสอบ:**
- ✅ Score 1-10 ถูกต้อง
- ✅ Feedback มีความหมาย
- ✅ JSON format ถูกต้อง

---

## 🚀 ปรับแก้ System Prompts

### **ตัวอย่าง 1: ปรับ Resume Parsing Prompt**

**ไฟล์:** `server/leanAiService.ts` (บรรทัด 28-32)

**ปัจจุบัน:**
```typescript
const systemPrompt = `คุณคือผู้แยกวิเคราะห์เรซูเม่ แยกข้อมูลสำคัญจากเรซูเม่ในภาษาไทย/อังกฤษ
ส่งคืนเฉพาะ JSON ที่ถูกต้องเท่านั้น ไม่มีข้อความอื่น`;
```

**ปรับปรุง:**
```typescript
const systemPrompt = `คุณคือผู้แยกวิเคราะห์เรซูเม่มืออาชีพ 
แยกข้อมูลสำคัญจากเรซูเม่ในภาษาไทย/อังกฤษ
- ทักษะ: เรียงลำดับตามความสำคัญ
- ประสบการณ์: ล่าสุดก่อน
- การศึกษา: ระดับสูงสุดก่อน
ส่งคืนเฉพาะ JSON ที่ถูกต้องเท่านั้น ไม่มีข้อความอื่น`;
```

### **ตัวอย่าง 2: ปรับ Question Generation Prompt**

**ไฟล์:** `server/leanAiService.ts` (บรรทัด ~200)

**ปัจจุบัน:**
```typescript
const systemPrompt = `คุณคือสัมภาษณ์ AI มืออาชีพ...`;
```

**ปรับปรุง:**
```typescript
const systemPrompt = `คุณคือสัมภาษณ์ AI มืออาชีพสำหรับตำแหน่ง ${jobRole}
- สร้างคำถามที่ท้าทาย แต่เป็นธรรมชาติ
- ใช้ STAR method (Situation, Task, Action, Result)
- เน้นทักษะและประสบการณ์จาก resume
- คำถามต้องเป็นภาษาไทยหรืออังกฤษตามที่ระบุ`;
```

---

## 🔄 ลองหลายๆ Model

### **ตัวอย่าง: เปลี่ยน Model ใน llm.ts**

**ไฟล์:** `server/_core/llm.ts` (บรรทัด 283)

**ปัจจุบัน:**
```typescript
model: "gemini-2.5-flash"
```

**ลองเปลี่ยนเป็น:**
```typescript
// ตัวเลือก 1: Gemini Pro (ดีกว่า แต่แพง 2 เท่า)
model: "gemini-1.5-pro"

// ตัวเลือก 2: Gemini Ultra (ดีที่สุด แต่แพง 5 เท่า)
model: "gemini-2.0-flash-exp"

// ตัวเลือก 3: กลับไปใช้ Flash
model: "gemini-2.5-flash"
```

**วิธีทดสอบ:**
```bash
# แก้ไข llm.ts
nano server/_core/llm.ts

# เปลี่ยน model ที่บรรทัด 283

# รัน test
pnpm test

# ดู output
```

---

## 🎙️ ปรับแก้ Voice Transcription

### **ปัญหา: แยกเสียงไม่เก่ง**

**สาเหตุ:**
1. Whisper prompt ไม่ชัดเจน
2. Language detection ไม่ถูกต้อง
3. Audio preprocessing ไม่ดี

### **วิธีแก้ 1: ปรับ Whisper Prompt**

**ไฟล์:** `server/_core/voiceTranscription.ts` (บรรทัด 138-142)

**ปัจจุบัน:**
```typescript
const prompt = options.prompt || (
  options.language 
    ? `Transcribe the user's voice to text, the user's working language is ${getLanguageName(options.language)}`
    : "Transcribe the user's voice to text"
);
```

**ปรับปรุง:**
```typescript
const prompt = options.prompt || (
  options.language 
    ? `Transcribe this job interview answer in ${getLanguageName(options.language)}. 
Focus on technical terms and industry vocabulary. 
Preserve the speaker's exact words and tone.`
    : "Transcribe this job interview answer. Preserve exact words and tone."
);
```

### **วิธีแก้ 2: เพิ่ม Language Hint ใน routers.ts**

**ไฟล์:** `server/routers.ts` (บรรทัด 123-126)

**ปัจจุบัน:**
```typescript
const transcriptionResult = await transcribeAudio({
  audioUrl,
  language: undefined // Auto-detect Thai/English
});
```

**ปรับปรุง:**
```typescript
// ใช้ job role เพื่อ hint language
const languageHint = session.jobRole ? 'th' : 'en'; // สมมติ Thai jobs

const transcriptionResult = await transcribeAudio({
  audioUrl,
  language: languageHint,
  prompt: `Transcribe this job interview answer for a ${session.jobRole} position in Thailand`
});
```

### **วิธีแก้ 3: เพิ่ม Audio Quality Check**

**ไฟล์:** `server/_core/voiceTranscription.ts` (เพิ่มหลัง line 124)

```typescript
// เพิ่มการตรวจสอบคุณภาพเสียง
const audioQuality = analyzeAudioQuality(audioBuffer);
if (audioQuality.confidence < 0.7) {
  console.warn(`[Audio Quality] Low confidence: ${audioQuality.confidence}`);
  // ปรับ prompt เพื่อช่วย Whisper
  formData.append("prompt", "This is a job interview answer. Please transcribe carefully.");
}

function analyzeAudioQuality(buffer: Buffer): { confidence: number } {
  // Simple check: ตรวจสอบ silence
  const samples = new Int16Array(buffer.buffer);
  const rms = Math.sqrt(samples.reduce((sum, s) => sum + s * s, 0) / samples.length);
  const confidence = Math.min(rms / 10000, 1); // normalize
  return { confidence };
}
```

---

## 📊 Logging & Debugging

### **เพิ่ม Logging ใน leanAiService.ts**

```typescript
// เพิ่มหลัง line 20
export function debugLog(taskName: string, data: any) {
  console.log(`[DEBUG] ${taskName}:`, JSON.stringify(data, null, 2));
}

// ใช้ใน functions
export async function parseResumeLean(resumeUrl: string): Promise<ParsedResume> {
  const systemPrompt = `...`;
  debugLog("parseResumeLean - systemPrompt", systemPrompt);
  
  const response = await invokeLLM({...});
  debugLog("parseResumeLean - response", response);
  
  return result;
}
```

### **ดู Logs ขณะ Dev Server ทำงาน**

```bash
# Terminal 1: เปิด dev server
pnpm dev

# Terminal 2: ดู logs
tail -f .manus-logs/devserver.log
```

---

## ✅ Checklist สำหรับ Testing

- [ ] Resume parsing ถูกต้อง
- [ ] Question generation เกี่ยวข้องกับ resume
- [ ] Voice transcription ถูกต้อง (Thai/English)
- [ ] Response analysis ให้ score ที่สมเหตุสมผล
- [ ] Final feedback มีความหมาย
- [ ] JSON format ถูกต้องทั้งหมด
- [ ] Error handling ทำงานถูกต้อง
- [ ] Cost ยังอยู่ในงบประมาณ

---

## 🎓 ตัวอย่างการแก้ไข Step by Step

### **ตัวอย่าง: ปรับ Scoring Logic**

**Step 1: เปิดไฟล์**
```bash
nano server/leanAiService.ts
```

**Step 2: หา analyzeResponseLean function (บรรทัด ~300)**

**Step 3: ปรับ scoring criteria**
```typescript
// ปัจจุบัน
const generalScore = (communication + professionalism + structure) / 3;

// ปรับปรุง
const generalScore = (
  communication * 0.4 +      // 40% - สำคัญที่สุด
  professionalism * 0.35 +   // 35%
  structure * 0.25           // 25%
);
```

**Step 4: บันทึก (Ctrl + X → Y → Enter)**

**Step 5: รัน test**
```bash
pnpm test
```

**Step 6: ตรวจสอบผลลัพธ์**
```bash
# ดู test output
```

---

## 🚨 Common Issues & Solutions

### **Issue 1: JSON Parse Error**
**สาเหตุ:** LLM ส่งกลับ text แทน JSON
**แก้ไข:** ปรับ system prompt ให้ชัดเจนว่า "ส่งคืนเฉพาะ JSON เท่านั้น"

### **Issue 2: Token Limit Exceeded**
**สาเหตุ:** Prompt เยอะเกินไป
**แก้ไข:** ลด prompt length หรือเพิ่ม max_tokens ใน llm.ts

### **Issue 3: Thai Language Not Recognized**
**สาเหตุ:** Language detection ผิด
**แก้ไข:** ระบุ language='th' ชัดเจนใน transcribeAudio

### **Issue 4: Score ไม่สมเหตุสมผล**
**สาเหตุ:** Scoring criteria ไม่ชัดเจน
**แก้ไข:** ปรับ system prompt ให้ระบุ criteria ชัดเจน

---

## 📝 Template สำหรับ Testing

```typescript
// server/leanAiService.test.ts - เพิ่มเติม

import { describe, it, expect, vi } from "vitest";
import { 
  parseResumeLean, 
  generateInterviewQuestionLean,
  analyzeResponseLean 
} from "./leanAiService";

describe("Lean AI Service - Extended Tests", () => {
  
  it("should parse Thai resume correctly", async () => {
    const result = await parseResumeLean("https://example.com/resume-th.pdf");
    expect(result.name).toBeDefined();
    expect(result.skills.length).toBeGreaterThan(0);
  });

  it("should generate role-specific questions", async () => {
    const result = await generateInterviewQuestionLean(
      { skills: ["React", "Node.js"], experience: [] },
      "Programmer",
      "https://example.com/jd.txt"
    );
    expect(result.question).toContain("React") || expect(result.question).toContain("Node");
  });

  it("should analyze Thai responses", async () => {
    const result = await analyzeResponseLean(
      "คุณมีประสบการณ์ React กี่ปี",
      "ผมมีประสบการณ์ React 3 ปี ทำโปรเจกต์ e-commerce",
      "Programmer",
      { skills: ["React"] }
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(10);
  });
});
```

---

## 🎯 Next Steps

1. **ลองแก้ไข 1 ไฟล์** - เลือก `leanAiService.ts` ปรับ 1 prompt
2. **รัน test** - `pnpm test`
3. **ดู output** - ตรวจสอบผลลัพธ์
4. **ทำซ้ำ** - ปรับแต่งจนพอใจ

**ความสำคัญ:** ไม่ต้องแก้ frontend เลย ทั้งหมดทำได้ที่ backend! 🎉
