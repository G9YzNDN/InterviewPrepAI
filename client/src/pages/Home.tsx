import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { BrainCircuit, Mic, FileText, TrendingUp, CheckCircle, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: FileText,
      title: "วิเคราะห์เรซูเม่",
      description: "อัปโหลดเรซูเม่ของคุณเป็นภาษาไทยหรืออังกฤษ AI ของเราเข้าใจเลย์เอาต์ที่ซับซ้อนและสกัดข้อมูลสำคัญ"
    },
    {
      icon: BrainCircuit,
      title: "คำถามที่ปรับเฉพาะบุคคล",
      description: "AI สร้างคำถามสัมภาษณ์ที่เหมาะสมตามพื้นฐานของคุณและตำแหน่งงานที่เป้าหมาย"
    },
    {
      icon: Mic,
      title: "บันทึกเสียง",
      description: "ตอบคำถามแบบธรรมชาติด้วยการบันทึกเสียง เราเข้าใจสำเนียงไทยและสไตล์การพูดที่หลากหลาย"
    },
    {
      icon: TrendingUp,
      title: "ข้อมูลย้อนกลับทันที",
      description: "รับคะแนนโดยละเอียด จุดแข็ง จุดอ่อน และคำแนะนำที่ใช้ได้จริงทันทีหลังสัมภาษณ์"
    }
  ];

  const roles = [
    {
      name: "โปรแกรมเมอร์",
      description: "การแก้ปัญหาทางเทคนิค ประสบการณ์การเขียนโค้ด และความสามารถในการเรียนรู้"
    },
    {
      name: "ฝ่ายขาย",
      description: "ทักษะการโน้มน้าว ความสัมพันธ์กับลูกค้า และการปิดการขาย"
    },
    {
      name: "นักวิเคราะห์ข้อมูล",
      description: "การคิดวิเคราะห์ การตีความข้อมูล และผลกระทบต่อธุรกิจ"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">ผู้ช่วยสัมภาษณ์ AI</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => setLocation("/history")}>
                  การสัมภาษณ์ของฉัน
                </Button>
                <Button onClick={() => setLocation("/setup")}>
                  เริ่มใช้งาน
                </Button>
              </>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()} disabled={loading}>
                เข้าสู่ระบบ
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            ซ้อมสัมภาษณ์กับ AI
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            รับคำถามสัมภาษณ์ที่ปรับเฉพาะบุคคล ข้อมูลย้อนกลับทันที และปรับปรุงทักษะของคุณ 
            เหมาะสำหรับนักศึกษาจบใหม่ที่เตรียมตัวสำหรับอาชีพในฝันของพวกเขา
          </p>
          {user ? (
            <Button size="lg" onClick={() => setLocation("/setup")} className="text-lg px-8 py-6">
              เริ่มการสัมภาษณ์
            </Button>
          ) : (
            <Button size="lg" onClick={() => window.location.href = getLoginUrl()} className="text-lg px-8 py-6">
              เริ่มต้นฟรี
            </Button>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">วิธีการทำงาน</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Supported Roles */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 rounded-3xl">
        <h3 className="text-3xl font-bold text-center mb-12">ปรับแต่งสำหรับเส้นทางอาชีพของคุณ</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {roles.map((role, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {role.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{role.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto bg-blue-600 text-white rounded-2xl p-12">
          <h3 className="text-3xl font-bold mb-4">พร้อมที่จะสอบสัมภาษณ์ได้ดีแล้วหรือ?</h3>
          <p className="text-lg mb-8 opacity-90">
            เข้าร่วมกับนักศึกษาจบใหม่นับพันคนที่ปรับปรุงทักษะการสัมภาษณ์ของพวกเขาด้วยการซ้อมที่ขับเคลื่อนด้วย AI
          </p>
          {user ? (
            <Button size="lg" variant="secondary" onClick={() => setLocation("/setup")} className="text-lg px-8 py-6">
              เริ่มซ้อมตอนนี้
            </Button>
          ) : (
            <Button size="lg" variant="secondary" onClick={() => window.location.href = getLoginUrl()} className="text-lg px-8 py-6">
              ลงทะเบียนฟรี
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-gray-600">
        <div className="container mx-auto px-4">
          <p>&copy; 2026 โค้ชสัมภาษณ์ AI ช่วยให้นักศึกษาจบใหม่ประสบความสำเร็จ By Only Wednesday</p>
        </div>
      </footer>
    </div>
  );
}
