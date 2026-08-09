import OtpForm from "@/components/auth/OtpForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="absolute inset-0 z-[-1] bg-gradient-to-tr from-primary/10 via-background to-background"></div>
      <div className="w-full max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col justify-center space-y-6">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Online Recruitment Portal
          </h1>
          <p className="text-lg text-muted-foreground">
            Apply for positions, manage your documents, and track your application status easily and securely.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl glass">
              <h3 className="font-semibold mb-1">Fast & Secure</h3>
              <p className="text-sm text-muted-foreground">OTP-based secure login process</p>
            </div>
            <div className="p-4 rounded-xl glass">
              <h3 className="font-semibold mb-1">Easy Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor your application status anytime</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full">
          <OtpForm />
        </div>
      </div>
    </div>
  );
}
