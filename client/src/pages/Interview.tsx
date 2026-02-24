import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Mic, Square, Loader2, Play, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function Interview() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const [currentQuestion, setCurrentQuestion] = useState<{
    questionId: number;
    questionText: string;
    questionNumber: number;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startMutation = trpc.interview.startInterview.useMutation({
    onSuccess: (data) => {
      console.log("[Interview] startInterview success:", data);
      if (!data || !data.questionId || !data.questionText) {
        console.error("[Interview] ERROR: Invalid response", data);
        toast.error("ข้อมูลคำถามไม่ถูกต้อง กรุณาลองใหม่");
        setLocation("/setup");
        return;
      }
      setCurrentQuestion(data);
    },
    onError: (error) => {
      console.error("[Interview] startInterview error:", error);
      toast.error(`ไม่สามารถเริ่มสัมภาษณ์: ${error.message}`);
      setLocation("/setup");
    }
  });

  const submitMutation = trpc.interview.submitResponse.useMutation({
    onSuccess: (data) => {
      if (data.completed) {
        toast.success("สัมภาษณ์เสร็จสิ้น! กำลังสร้างข้อมูลย้อนกลับของคุณ...");
        setLocation(`/results/${sessionId}`);
      } else if (data.nextQuestion) {
        toast.success("ส่งคำตอบแล้ว! คำถามถัดไป...");
        setCurrentQuestion(data.nextQuestion);
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      }
    },
    onError: (error) => {
      toast.error(`ไม่สามารถส่งคำตอบ: ${error.message}`);
    }
  });

  useEffect(() => {
    if (sessionId && !currentQuestion && !startMutation.isPending) {
      startMutation.mutate({ sessionId: parseInt(sessionId) });
    }
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("เริ่มบันทึกแล้ว");
    } catch (error) {
      toast.error("ไม่สามารถเข้าถึงไมโครโฟน กรุณาให้สิทธิ์การเข้าถึง");
      console.error("Microphone error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast.success("หยุดบันทึกแล้ว");
    }
  };

  const playRecording = () => {
    if (audioUrl) {
      // Stop any existing playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Create new audio element if needed
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
      } else {
        audioRef.current.src = audioUrl;
      }
      
      // Play from beginning
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error("Playback error:", err);
        toast.error("ไม่สามารถเล่นการบันทึก");
      });
    }
  };

  const submitResponse = async () => {
    if (!audioBlob || !currentQuestion) {
      toast.error("กรุณาบันทึกคำตอบก่อน");
      return;
    }

    // Check file size (16MB limit)
    if (audioBlob.size > 16 * 1024 * 1024) {
      toast.error("การบันทึกใหญ่เกินไป กรุณาเก็บคำตอบของคุณไว้ภายใน 5 นาที");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result?.toString().split(",")[1];
      if (!base64) {
        toast.error("ไม่สามารถประมวลผลเสียง");
        return;
      }

      submitMutation.mutate({
        questionId: currentQuestion.questionId,
        sessionId: parseInt(sessionId!),
        audioData: base64,
        audioFormat: "audio/webm"
      });
    };
    reader.readAsDataURL(audioBlob);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (authLoading || startMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังเตรียมสัมภาษณ์ของคุณ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>กำลังโหลดสัมภาษณ์...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const progress = (currentQuestion.questionNumber / 5) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">สัมภาษณ์จำลอง</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                คำถาม {currentQuestion.questionNumber} จาก 5
              </span>
              <Progress value={progress} className="w-32" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Question Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">คำถาม {currentQuestion.questionNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed">
                {currentQuestion.questionText}
              </p>
            </CardContent>
          </Card>

          {/* Recording Card */}
          <Card>
            <CardHeader>
              <CardTitle>คำตอบของคุณ</CardTitle>
              <CardDescription>
                บันทึกคำตอบของคุณโดยใช้ไมโครโฟน พูดชัดเจนและใช้เวลาของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recording Controls */}
              <div className="flex flex-col items-center gap-4">
                {isRecording ? (
                  <div className="text-center">
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={stopRecording}
                      className="rounded-full h-20 w-20"
                    >
                      <Square className="h-8 w-8" />
                    </Button>
                    <p className="mt-4 text-lg font-semibold text-red-600">
                      กำลังบันทึก: {formatTime(recordingTime)}
                    </p>
                    <p className="text-sm text-gray-500">คลิกเพื่อหยุด</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      size="lg"
                      onClick={startRecording}
                      disabled={submitMutation.isPending}
                      className="rounded-full h-20 w-20 bg-blue-600 hover:bg-blue-700"
                    >
                      <Mic className="h-8 w-8" />
                    </Button>
                    <p className="mt-4 text-lg font-semibold">
                      {audioBlob ? "บันทึกคำตอบใหม่" : "เริ่มบันทึก"}
                    </p>
                    <p className="text-sm text-gray-500">คลิกเพื่อบันทึก</p>
                  </div>
                )}
              </div>

              {/* Playback Controls */}
              {audioBlob && !isRecording && (
                <div className="flex items-center justify-center gap-4 p-4 bg-green-50 rounded-lg">
                  <Button variant="outline" onClick={playRecording}>
                    <Play className="h-4 w-4 mr-2" />
                    เล่นการบันทึก
                  </Button>
                  <span className="text-sm text-gray-600">
                    ระยะเวลา: {formatTime(recordingTime)}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                size="lg"
                onClick={submitResponse}
                disabled={!audioBlob || submitMutation.isPending}
                className="w-full"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังวิเคราะห์คำตอบ...
                  </>
                ) : (
                  <>
                    ส่งคำตอบ
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                <strong>เคล็ดลับ:</strong> ใช้วิธี STAR (สถานการณ์ งาน การกระทำ ผลลัพธ์) เพื่อจัดโครงสร้างคำตอบของคุณ 
                พูดชัดเจนและมั่นใจ ใช้เวลาสักครู่เพื่อคิดก่อนที่จะเริ่มบันทึก
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
