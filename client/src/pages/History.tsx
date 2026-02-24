import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Briefcase, TrendingUp, Loader2, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: sessions, isLoading } = trpc.interview.getHistory.useQuery(undefined, {
    enabled: !!user
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>จำเป็นต้องเข้าสู่ระบบ</CardTitle>
            <CardDescription>กรุณาเข้าสู่ระบบเพื่อดูประวัติสัมภาษณ์ของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              เข้าสู่ระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabels = {
    programmer: "โปรแกรมเมอร์",
    sales: "ฝ่ายขาย",
    data_analyst: "นักวิเคราะห์ข้อมูล"
  };

  const statusLabels = {
    setup: "ตั้งค่า",
    in_progress: "กำลังดำเนิน",
    completed: "เสร็จสิ้น",
    abandoned: "ยกเลิก"
  };

  const statusColors = {
    setup: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    abandoned: "bg-red-100 text-red-800"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              กลับไปหน้าแรก
            </Button>
            <Button onClick={() => setLocation("/setup")}>
              เริ่มสัมภาษณ์ใหม่
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">ประวัติสัมภาษณ์</h1>
            <p className="text-lg text-gray-600">
              ตรวจสอบสัมภาษณ์จำลองที่ผ่านมาและติดตามความก้าวหน้าของคุณ
            </p>
          </div>

          {!sessions || sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 mb-4">คุณยังไม่ได้ทำสัมภาษณ์ใดๆ เสร็จสิ้น</p>
                <Button onClick={() => setLocation("/setup")}>
                  เริ่มสัมภาษณ์ครั้งแรกของคุณ
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className={statusColors[session.status]}>
                            {statusLabels[session.status]}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Briefcase className="h-3 w-3" />
                            {roleLabels[session.jobRole]}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(session.createdAt).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>

                        {session.status === "completed" && session.overallScore && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="text-lg font-semibold text-gray-900">
                              คะแนน: {session.overallScore.toFixed(1)}/10
                            </span>
                            <span className="text-sm text-gray-500">
                              (ทั่วไป: {session.generalScore?.toFixed(1)}, 
                              เฉพาะบทบาท: {session.roleSpecificScore?.toFixed(1)})
                            </span>
                          </div>
                        )}

                        <div className="text-sm text-gray-600">
                          <p className="line-clamp-2">
                            <strong>คำอธิบายงาน:</strong> {session.jobDescription.substring(0, 150)}...
                          </p>
                        </div>
                      </div>

                      <div className="ml-4">
                        {session.status === "completed" ? (
                          <Button onClick={() => setLocation(`/results/${session.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            ดูผลลัพธ์
                          </Button>
                        ) : session.status === "in_progress" ? (
                          <Button onClick={() => setLocation(`/interview/${session.id}`)}>
                            ดำเนินการต่อ
                          </Button>
                        ) : (
                          <Button variant="outline" disabled>
                            {statusLabels[session.status]}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
