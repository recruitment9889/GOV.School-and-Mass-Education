import MultiStepForm from "@/components/application/MultiStepForm";

export default function EditApplicationPage() {
  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <MultiStepForm />
      </main>
    </div>
  );
}
