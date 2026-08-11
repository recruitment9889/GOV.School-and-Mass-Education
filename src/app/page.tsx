import Link from "next/link";
import EmailAuthForm from "@/components/auth/EmailAuthForm";
import { ShieldCheck, FileSpreadsheet, UserCheck, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Top Navbar */}
      <header className="w-full bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/odisha-logo.png"
              alt="Government of Odisha Seal"
              className="w-12 h-12 object-contain drop-shadow-md"
            />
            <div>
              <span className="font-extrabold text-base leading-none block text-foreground">Government of Odisha</span>
              <span className="text-xs text-muted-foreground font-semibold">School & Mass Education Department</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero & Login Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left Column: Portal Information & Notice */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img
              src="/odisha-logo.png"
              alt="Government of Odisha Official Seal"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-lg"
            />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Recruitment Drive 2026
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Government of Odisha<br/>
            <span className="text-primary font-bold">School & Mass Education Department</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Welcome to the recruitment portal. Register or log in with your mobile number via OTP to start your application, upload documents, and track your status.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur shadow-sm space-y-1">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm">Mobile OTP Login</h3>
              <p className="text-xs text-muted-foreground">Instant verification without password hassle.</p>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur shadow-sm space-y-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm">Multiple Categories</h3>
              <p className="text-xs text-muted-foreground">Peon, Employee, Student, Teacher & Contractual.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 text-xs leading-relaxed">
            <p className="font-semibold mb-1">📢 Important Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure your mobile number is active to receive the verification OTP.</li>
              <li>Keep scanned copies of your Aadhaar card and Educational Certificates ready (PDF/JPG format under 2MB).</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Email / Gmail Registration Form */}
        <div className="w-full max-w-md mx-auto">
          <EmailAuthForm />
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-background py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Recruitment Portal. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/admin/login" className="hover:underline text-primary font-medium flex items-center gap-1">
              Admin Login <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
