import MultiStepForm from "@/components/application/MultiStepForm";

export default function NewApplicationPage() {
  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">New Application</h1>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Save Draft & Exit
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <MultiStepForm />
      </main>
    </div>
  );
}
