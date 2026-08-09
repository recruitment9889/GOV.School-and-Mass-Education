import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 relative overflow-hidden">
      {/* Abstract Background for Admin */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Portal</h1>
          <p className="text-zinc-400 text-sm">Sign in to manage recruitment</p>
        </div>
        
        <AdminLoginForm />
      </div>
    </div>
  );
}
