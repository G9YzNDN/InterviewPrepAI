import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type JobRole = "programmer" | "sales" | "data_analyst";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
      // result = "data:application/pdf;base64,...."
      const base64 = result.split(",")[1];
      if (!base64) return reject(new Error("แปลงไฟล์เป็น base64 ไม่สำเร็จ"));
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

export default function Setup() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [jobRole, setJobRole] = useState<JobRole>("programmer");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const uploadMutation = trpc.interview.uploadResume.useMutation({
    onSuccess: (data) => {
      // เก็บไว้ให้หน้า ResumeAnalyzer ใช้
      sessionStorage.setItem("resumeData", JSON.stringify({ resumeUrl: (data as any).resumeUrl }));
      sessionStorage.setItem("jobData", JSON.stringify({ jobDescription, jobRole }));

      toast.success("อัปโหลดสำเร็จ กำลังเริ่มสัมภาษณ์");
      setLocation(`/interview/${data.sessionId}`);
    },
    onError: (err) => {
      toast.error(err.message || "อัปโหลดไม่สำเร็จ");
    },
  });

  const onSubmit = async () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!resumeFile) {
      toast.error("กรุณาอัปโหลดไฟล์เรซูเม่ (PDF)");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("กรุณาใส่ Job Description");
      return;
    }

    try {
      const base64 = await fileToBase64(resumeFile);
      uploadMutation.mutate({
        fileName: resumeFile.name,
        fileData: base64,
        jobDescription,
        jobRole,
      });
    } catch (e: any) {
      toast.error(e?.message || "เตรียมไฟล์ไม่สำเร็จ");
    }
  };

  const roleLabel: Record<JobRole, string> = {
    programmer: "โปรแกรมเมอร์",
    sales: "ฝ่ายขาย",
    data_analyst: "นักวิเคราะห์ข้อมูล",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto mt-10">
        <Card className="p-2">
          <CardHeader>
            <CardTitle>ตั้งค่าก่อนเริ่มสัมภาษณ์</CardTitle>
            <CardDescription>
              อัปโหลดเรซูเม่ (PDF) ใส่ Job Description และเลือกสายงาน
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!user && (
              <div className="p-4 rounded-md border bg-white">
                <div className="font-semibold mb-1">ยังไม่ได้เข้าสู่ระบบ</div>
                <div className="text-sm text-gray-600 mb-3">
                  ต้อง login ก่อนถึงจะอัปโหลดและเริ่มสัมภาษณ์ได้
                </div>
                <Button onClick={() => (window.location.href = getLoginUrl())} disabled={loading}>
                  ไปหน้าเข้าสู่ระบบ
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <div className="font-semibold">เลือกสายงาน</div>
              <Select value={jobRole} onValueChange={(v) => setJobRole(v as JobRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสายงาน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programmer">{roleLabel.programmer}</SelectItem>
                  <SelectItem value="sales">{roleLabel.sales}</SelectItem>
                  <SelectItem value="data_analyst">{roleLabel.data_analyst}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="font-semibold">Job Description</div>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="วาง JD ตำแหน่งงานที่คุณจะสมัคร..."
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <div className="font-semibold">อัปโหลดเรซูเม่ (PDF)</div>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
              {resumeFile && (
                <div className="text-sm text-gray-600">ไฟล์ที่เลือก: {resumeFile.name}</div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onSubmit}
                disabled={uploadMutation.isPending || !user}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังอัปโหลด...
                  </>
                ) : (
                  "เริ่มสัมภาษณ์"
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/resume-analyzer")}
                disabled={!sessionStorage.getItem("resumeData")}
              >
                ไปหน้า Resume Analyzer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}