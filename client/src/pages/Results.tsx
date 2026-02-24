import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Lightbulb, Home, RotateCcw, Loader2 } from "lucide-react";
import { useLocation, useParams } from "wouter";

export default function Results() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const restartMutation = trpc.interview.restartInterview.useMutation();

  const { data, isLoading, error } = trpc.interview.getResults.useQuery(
    { sessionId: parseInt(sessionId!) },
    { enabled: !!sessionId }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดผลลัพธ์ของคุณ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  if (error || !data || !data.feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>เกิดข้อผิดพลาดในการโหลดผลลัพธ์</CardTitle>
            <CardDescription>
              {error?.message || "ไม่สามารถโหลดผลลัพธ์สัมภาษณ์"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/history")}>
              ดูประวัติสัมภาษณ์
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session, feedback, questions, responses } = data;
  const scoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const scorePercentage = (score: number) => (score / 10) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">ผลลัพธ์สัมภาษณ์</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLocation("/history")}>
                <Home className="h-4 w-4 mr-2" />
                ประวัติ
              </Button>
              <Button onClick={() => setLocation("/setup")}>
                <RotateCcw className="h-4 w-4 mr-2" />
                สัมภาษณ์ใหม่
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Overall Score */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="text-center">
              <CardTitle>ผลการปฏิบัติโดยรวม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className={`text-7xl font-bold ${scoreColor(feedback.overallScore)}`}>
                  {feedback.overallScore.toFixed(1)}
                </div>
                <p className="text-gray-600 mt-2">จาก 10</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">ทักษะทั่วไป (30%)</span>
                    <span className={scoreColor(feedback.generalScore)}>
                      {feedback.generalScore.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={scorePercentage(feedback.generalScore)} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">
                    การสื่อสาร • มืออาชีพ • โครงสร้าง
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">ทักษะเฉพาะบทบาท (70%)</span>
                    <span className={scoreColor(feedback.roleSpecificScore)}>
                      {feedback.roleSpecificScore.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={scorePercentage(feedback.roleSpecificScore)} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">
                    {session.jobRole === "programmer" && "เทคนิค • โค้ด • ปัญหา"}
                    {session.jobRole === "sales" && "โน้มน้าว • ลูกค้า • ปิดการขาย"}
                    {session.jobRole === "data_analyst" && "วิเคราะห์ • ธุรกิจ • ข้อมูล"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <TrendingUp className="h-5 w-5" />
                จุดแข็งของคุณ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(feedback.strengths as string[]).map((strength, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <TrendingDown className="h-5 w-5" />
                พื้นที่ที่ต้องปรับปรุง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(feedback.weaknesses as string[]).map((weakness, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-orange-600 font-bold">!</span>
                    <span className="text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Lightbulb className="h-5 w-5" />
                คำแนะนำที่ใช้ได้จริง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {(feedback.suggestions as string[]).map((suggestion, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-purple-600 font-bold text-lg">{index + 1}.</span>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Question Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>การวิเคราะห์ทีละคำถาม</CardTitle>
              <CardDescription>
                ข้อมูลย้อนกลับโดยละเอียดสำหรับแต่ละคำตอบของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, index) => {
                const response = responses.find(r => r.questionId === question.id);
                return (
                  <div key={question.id}>
                    {index > 0 && <Separator className="my-6" />}
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">
                            คำถาม {question.questionNumber}
                          </h4>
                          <p className="text-gray-700 mt-1">{question.questionText}</p>
                        </div>
                        {response && (
                          <div className="ml-4 text-right">
                            <div className={`text-2xl font-bold ${scoreColor(response.overallScore || 0)}`}>
                              {response.overallScore?.toFixed(1) || "N/A"}
                            </div>
                            <p className="text-sm text-gray-500">คะแนน</p>
                          </div>
                        )}
                      </div>

                      {response && response.analysis && typeof response.analysis === 'object' ? (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          {response.transcription && (
                            <p className="text-sm text-gray-700">
                              <strong>คำตอบของคุณ:</strong> {response.transcription.substring(0, 200)}
                              {response.transcription.length > 200 ? "..." : ""}
                            </p>
                          )}
                          {(response.analysis as any)?.detailedFeedback && (
                            <p className="text-sm text-gray-700">
                              <strong>ข้อมูลย้อนกลับ:</strong> {String((response.analysis as any).detailedFeedback)}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-6">
            <Button variant="outline" size="lg" onClick={() => setLocation("/history")}>
              ดูสัมภาษณ์ทั้งหมด
            </Button>
            <Button 
              size="lg" 
              onClick={() => {
                restartMutation.mutate(
                  { sessionId: parseInt(sessionId!) },
                  {
                    onSuccess: () => {
                      setLocation(`/interview/${sessionId}`);
                    },
                    onError: (error) => {
                      console.error("Failed to restart:", error);
                      alert("เกิดข้อผิดพลาด");
                    }
                  }
                );
              }}
              disabled={restartMutation.isPending}
            >
              {restartMutation.isPending ? "กำลังเตรียม..." : "ซ้อมอีกครั้ง"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
