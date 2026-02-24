import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

interface AnalysisState {
  resumeUrl: string;
  jobDescription: string;
  jobRole: "programmer" | "sales" | "data_analyst";
  analysisType: "full" | "gaps" | "skills" | "experience" | "tips";
}

export default function ResumeAnalyzer() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<AnalysisState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get resume data from session storage
  const resumeData = sessionStorage.getItem("resumeData");
  const jobData = sessionStorage.getItem("jobData");

  if (!resumeData || !jobData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto mt-20">
          <Card className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูล Resume</h1>
            <p className="text-gray-600 mb-6">กรุณาอัปโหลด resume และใส่คำอธิบายงานก่อน</p>
            <Button onClick={() => setLocation("/setup")} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปหน้าตั้งค่า
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const parsed = JSON.parse(resumeData);
  const job = JSON.parse(jobData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/setup")}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไป
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">วิเคราะห์ Resume</h1>
          <p className="text-gray-600">ตรวจสอบจุดแข็ง จุดอ่อน และพื้นที่ที่ต้องปรับปรุง</p>
        </div>

        {/* Analysis Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <AnalysisButton
            title="วิเคราะห์ทั้งหมด"
            description="ครบถ้วน"
            icon="📊"
            type="full"
            state={state}
            setState={setState}
            isLoading={isLoading}
            resumeUrl={parsed.resumeUrl}
            jobDescription={job.jobDescription}
            jobRole={job.jobRole}
            setIsLoading={setIsLoading}
          />
          <AnalysisButton
            title="ช่องว่าง"
            description="Gaps"
            icon="🔍"
            type="gaps"
            state={state}
            setState={setState}
            isLoading={isLoading}
            resumeUrl={parsed.resumeUrl}
            jobDescription={job.jobDescription}
            jobRole={job.jobRole}
            setIsLoading={setIsLoading}
          />
          <AnalysisButton
            title="ทักษะ"
            description="Skills"
            icon="⭐"
            type="skills"
            state={state}
            setState={setState}
            isLoading={isLoading}
            resumeUrl={parsed.resumeUrl}
            jobDescription={job.jobDescription}
            jobRole={job.jobRole}
            setIsLoading={setIsLoading}
          />
          <AnalysisButton
            title="ประสบการณ์"
            description="Experience"
            icon="💼"
            type="experience"
            state={state}
            setState={setState}
            isLoading={isLoading}
            resumeUrl={parsed.resumeUrl}
            jobDescription={job.jobDescription}
            jobRole={job.jobRole}
            setIsLoading={setIsLoading}
          />
          <AnalysisButton
            title="คำแนะนำ"
            description="Tips"
            icon="💡"
            type="tips"
            state={state}
            setState={setState}
            isLoading={isLoading}
            resumeUrl={parsed.resumeUrl}
            jobDescription={job.jobDescription}
            jobRole={job.jobRole}
            setIsLoading={setIsLoading}
          />
        </div>

        {/* Results */}
        {state && (
          <div className="space-y-6">
            {state.analysisType === "full" && <FullAnalysisResults resumeUrl={state.resumeUrl} jobDescription={state.jobDescription} jobRole={state.jobRole} />}
            {state.analysisType === "gaps" && <GapsAnalysisResults resumeUrl={state.resumeUrl} jobDescription={state.jobDescription} jobRole={state.jobRole} />}
            {state.analysisType === "skills" && <SkillsAnalysisResults resumeUrl={state.resumeUrl} jobRole={state.jobRole} />}
            {state.analysisType === "experience" && <ExperienceAnalysisResults resumeUrl={state.resumeUrl} jobDescription={state.jobDescription} jobRole={state.jobRole} />}
            {state.analysisType === "tips" && <TipsAnalysisResults resumeUrl={state.resumeUrl} jobDescription={state.jobDescription} jobRole={state.jobRole} />}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-600">กำลังวิเคราะห์...</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface AnalysisButtonProps {
  title: string;
  description: string;
  icon: string;
  type: "full" | "gaps" | "skills" | "experience" | "tips";
  state: AnalysisState | null;
  setState: (state: AnalysisState) => void;
  isLoading: boolean;
  resumeUrl: string;
  jobDescription: string;
  jobRole: "programmer" | "sales" | "data_analyst";
  setIsLoading: (loading: boolean) => void;
}

function AnalysisButton({
  title,
  description,
  icon,
  type,
  state,
  setState,
  isLoading,
  resumeUrl,
  jobDescription,
  jobRole,
  setIsLoading,
}: AnalysisButtonProps) {
  const isActive = state?.analysisType === type;

  const handleClick = () => {
    setState({
      resumeUrl,
      jobDescription,
      jobRole,
      analysisType: type,
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`p-4 rounded-lg border-2 transition-all ${
        isActive
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 bg-white hover:border-blue-400"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold text-gray-900 text-sm">{title}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </button>
  );
}

function FullAnalysisResults({
  resumeUrl,
  jobDescription,
  jobRole,
}: {
  resumeUrl: string;
  jobDescription: string;
  jobRole: "programmer" | "sales" | "data_analyst";
}) {
  const mutation = trpc.resumeAnalysis.analyzeResume.useMutation();
  const { data, error } = mutation;
  const isLoading = mutation.isPending;

  useEffect(() => {
    mutation.mutate({
      resumeUrl,
      jobDescription,
      jobRole
    });
  }, [resumeUrl, jobDescription, jobRole]);

  if (isLoading) return <div>กำลังวิเคราะห์...</div>;
  if (error) return <div className="text-red-600">เกิดข้อผิดพลาด: {error.message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">สรุปการวิเคราะห์</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="ทักษะทั้งหมด" value={data.analysis.totalSkills} icon="⭐" />
          <StatBox label="ทักษะเชี่ยวชาญ" value={data.analysis.expertSkills} icon="🏆" />
          <StatBox label="ช่องว่างสำคัญ" value={data.analysis.highPriorityGaps} icon="⚠️" />
          <StatBox label="ความเกี่ยวข้อง" value={`${data.analysis.averageExperienceRelevance}%`} icon="📈" />
        </div>
      </Card>

      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skills">ทักษะ</TabsTrigger>
          <TabsTrigger value="gaps">ช่องว่าง</TabsTrigger>
          <TabsTrigger value="experience">ประสบการณ์</TabsTrigger>
          <TabsTrigger value="tips">คำแนะนำ</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          {(data.skillsWithLevel || []).map((skill: any, idx: number) => (
            <SkillCard key={idx} skill={skill} />
          ))}
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          {(data.gaps || []).map((gap: any, idx: number) => (
            <GapCard key={idx} gap={gap} />
          ))}
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          {(data.experienceRelevance || []).map((exp: any, idx: number) => (
            <ExperienceCard key={idx} experience={exp} />
          ))}
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          {(data.tips || []).map((tip: any, idx: number) => (
            <TipCard key={idx} tip={tip} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GapsAnalysisResults({
  resumeUrl,
  jobDescription,
  jobRole,
}: {
  resumeUrl: string;
  jobDescription: string;
  jobRole: "programmer" | "sales" | "data_analyst";
}) {
  const mutation = trpc.resumeAnalysis.analyzeGaps.useMutation();
  const { data, error } = mutation;
  const isLoading = mutation.isPending;

  useEffect(() => {
    mutation.mutate({
      resumeUrl,
      jobDescription,
      jobRole
    });
  }, [resumeUrl, jobDescription, jobRole]);

  if (isLoading) return <div>กำลังวิเคราะห์...</div>;
  if (error) return <div className="text-red-600">เกิดข้อผิดพลาด: {error.message}</div>;
  if (!data) return null;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">ช่องว่างที่ต้องปรับปรุง</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatBox label="สำคัญสูง" value={data.summary.highPriority} icon="🔴" />
        <StatBox label="สำคัญกลาง" value={data.summary.mediumPriority} icon="🟡" />
        <StatBox label="สำคัญต่ำ" value={data.summary.lowPriority} icon="🟢" />
      </div>
      <div className="space-y-4">
        {(data.gaps || []).map((gap: any, idx: number) => (
          <GapCard key={idx} gap={gap} />
        ))}
      </div>
    </Card>
  );
}

function SkillsAnalysisResults({
  resumeUrl,
  jobRole,
}: {
  resumeUrl: string;
  jobRole: "programmer" | "sales" | "data_analyst";
}) {
  const mutation = trpc.resumeAnalysis.analyzeSkills.useMutation();
  const { data, error } = mutation;
  const isLoading = mutation.isPending;

  useEffect(() => {
    mutation.mutate({
      resumeUrl,
      jobRole
    });
  }, [resumeUrl, jobRole]);

  if (isLoading) return <div>กำลังวิเคราะห์...</div>;
  if (error) return <div className="text-red-600">เกิดข้อผิดพลาด: {error.message}</div>;
  if (!data) return null;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">วิเคราะห์ทักษะ</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBox label="ทั้งหมด" value={data.summary.total} icon="📊" />
        <StatBox label="เชี่ยวชาญ" value={data.summary.expert} icon="🏆" />
        <StatBox label="ปานกลาง" value={data.summary.intermediate} icon="⭐" />
        <StatBox label="เริ่มต้น" value={data.summary.beginner} icon="📚" />
      </div>
      <div className="space-y-4">
        {(data.skills || []).map((skill: any, idx: number) => (
          <SkillCard key={idx} skill={skill} />
        ))}
      </div>
    </Card>
  );
}

function ExperienceAnalysisResults({
  resumeUrl,
  jobDescription,
  jobRole,
}: {
  resumeUrl: string;
  jobDescription: string;
  jobRole: "programmer" | "sales" | "data_analyst";
}) {
  const mutation = trpc.resumeAnalysis.analyzeExperience.useMutation();
  const { data, error } = mutation;
  const isLoading = mutation.isPending;

  useEffect(() => {
    mutation.mutate({
      resumeUrl,
      jobDescription,
      jobRole
    });
  }, [resumeUrl, jobDescription, jobRole]);

  if (isLoading) return <div>กำลังวิเคราะห์...</div>;
  if (error) return <div className="text-red-600">เกิดข้อผิดพลาด: {error.message}</div>;
  if (!data) return null;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">วิเคราะห์ประสบการณ์</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBox label="ทั้งหมด" value={data.summary.total} icon="💼" />
        <StatBox label="ความเกี่ยวข้อง" value={`${data.summary.averageRelevance}%`} icon="📈" />
        <StatBox label="สูง" value={data.summary.highRelevance} icon="🟢" />
        <StatBox label="ต่ำ" value={data.summary.lowRelevance} icon="🔴" />
      </div>
      <div className="space-y-4">
        {(data.experience || []).map((exp: any, idx: number) => (
          <ExperienceCard key={idx} experience={exp} />
        ))}
      </div>
    </Card>
  );
}

function TipsAnalysisResults({
  resumeUrl,
  jobDescription,
  jobRole,
}: {
  resumeUrl: string;
  jobDescription: string;
  jobRole: "programmer" | "sales" | "data_analyst";
}) {
  const mutation = trpc.resumeAnalysis.generateTips.useMutation();
  const { data, error } = mutation;
  const isLoading = mutation.isPending;

  useEffect(() => {
    mutation.mutate({
      resumeUrl,
      jobDescription,
      jobRole
    });
  }, [resumeUrl, jobDescription, jobRole]);

  if (isLoading) return <div>กำลังวิเคราะห์...</div>;
  if (error) return <div className="text-red-600">เกิดข้อผิดพลาด: {error.message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">คำแนะนำเฉพาะตัว</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatBox label="จุดแข็ง" value={(data.summary?.strengths || []).length} icon="💪" />
          <StatBox label="ต้องปรับปรุง" value={(data.summary?.improvements || []).length} icon="🔧" />
          <StatBox label="โอกาส" value={(data.summary?.opportunities || []).length} icon="🎯" />
        </div>
      </Card>

      {(data.summary?.strengths || []).length > 0 && (
        <Card className="p-6 border-green-200 bg-green-50">
          <h3 className="text-xl font-bold text-green-900 mb-4">💪 จุดแข็ง</h3>
          <div className="space-y-3">
            {(data.summary?.strengths || []).map((tip: any, idx: number) => (
              <TipCard key={idx} tip={tip} />
            ))}
          </div>
        </Card>
      )}

      {(data.summary?.improvements || []).length > 0 && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <h3 className="text-xl font-bold text-yellow-900 mb-4">🔧 ต้องปรับปรุง</h3>
          <div className="space-y-3">
            {(data.summary?.improvements || []).map((tip: any, idx: number) => (
              <TipCard key={idx} tip={tip} />
            ))}
          </div>
        </Card>
      )}

      {(data.summary?.opportunities || []).length > 0 && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <h3 className="text-xl font-bold text-blue-900 mb-4">🎯 โอกาส</h3>
          <div className="space-y-3">
            {(data.summary?.opportunities || []).map((tip: any, idx: number) => (
              <TipCard key={idx} tip={tip} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper Components
function StatBox({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function SkillCard({ skill }: { skill: any }) {
  const levelColor = {
    expert: "bg-green-100 text-green-800",
    intermediate: "bg-blue-100 text-blue-800",
    beginner: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-gray-900">{skill.name}</h4>
          <p className="text-sm text-gray-600">{skill.relevance}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${levelColor[skill.level as keyof typeof levelColor]}`}>
          {skill.level === "expert" ? "เชี่ยวชาญ" : skill.level === "intermediate" ? "ปานกลาง" : "เริ่มต้น"}
        </span>
      </div>
    </div>
  );
}

function GapCard({ gap }: { gap: any }) {
  const priorityColor = {
    high: "bg-red-100 text-red-800 border-red-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-green-100 text-green-800 border-green-300",
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${priorityColor[gap.priority as keyof typeof priorityColor]}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold">{gap.gap}</h4>
        <span className="text-xs font-bold">
          {gap.priority === "high" ? "สำคัญสูง" : gap.priority === "medium" ? "สำคัญกลาง" : "สำคัญต่ำ"}
        </span>
      </div>
      <p className="text-sm mb-2">{gap.reason}</p>
      <p className="text-sm font-medium">💡 {gap.suggestion}</p>
    </div>
  );
}

function ExperienceCard({ experience }: { experience: any }) {
  const relevancePercent = experience.relevanceScore;
  const relevanceColor = relevancePercent >= 70 ? "text-green-600" : relevancePercent >= 40 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{experience.position}</h4>
        <span className={`font-bold ${relevanceColor}`}>{relevancePercent}%</span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{experience.analysis}</p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${relevanceColor.replace("text", "bg")}`} style={{ width: `${relevancePercent}%` }}></div>
      </div>
    </div>
  );
}

function TipCard({ tip }: { tip: any }) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-2">{tip.title}</h4>
      <Streamdown>{tip.description}</Streamdown>
    </div>
  );
}
