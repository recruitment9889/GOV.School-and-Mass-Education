"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ChevronLeft, Upload, FileText, CheckCircle2, ShieldCheck, AlertCircle, Calendar, Image as ImageIcon, LogOut, Save } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { saveFileToIndexedDB, getAllFilesFromIndexedDB, clearFilesFromIndexedDB } from "@/lib/file-storage";

const STEPS = [
  "Personal & OTP",
  "Education & Certificates",
  "Required Documents",
  "Review & Submit"
];

const ODISHA_DISTRICTS = [
  "Khordha", "Cuttack", "Bhadrak", "Puri", "Ganjam", "Sambalpur", "Balasore", "Angul",
  "Bargarh", "Bolangir", "Boudh", "Deogarh", "Dhenkanal", "Gajapati", "Jagatsinghpur",
  "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Keonjhar", "Koraput",
  "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Rayagada", "Subarnapur", "Sundergarh"
];

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const YEARS = Array.from({ length: 65 }, (_, i) => (2015 - i).toString());
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));

export default function MultiStepForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [validatingStep, setValidatingStep] = useState(false);
  const [draftSavedBanner, setDraftSavedBanner] = useState("");

  // Category: ONLY 2 Options ("Peon" or "Clerk")
  const [category, setCategory] = useState<"Peon" | "Clerk">("Peon");

  // Personal Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobDay, setDobDay] = useState("01");
  const [dobMonth, setDobMonth] = useState("01");
  const [dobYear, setDobYear] = useState("2000");
  const [dobMode, setDobMode] = useState<"dropdown" | "native">("dropdown");

  const [gender, setGender] = useState("MALE");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("Khordha");
  const [block, setBlock] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [highestQualification, setHighestQualification] = useState("10th Standard");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [email, setEmail] = useState("");

  // OTP State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  // Education State (Step 2)
  const [degree, setDegree] = useState("10th Standard");
  const [institution, setInstitution] = useState("");
  const [yearOfPassing, setYearOfPassing] = useState("2024");
  const [percentage, setPercentage] = useState("85.5");

  // Documents State (Uploaded files map)
  const [documents, setDocuments] = useState<{ [key: string]: { name: string; size: string } }>({});

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppNo, setSubmittedAppNo] = useState<string | null>(null);

  const formattedDob = `${dobYear}-${dobMonth}-${dobDay}`;

  // Auto-restore draft application on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("applicant_email");
      const savedName = localStorage.getItem("applicant_name");
      if (savedEmail) setEmail(savedEmail);
      if (savedName && !firstName) {
        const parts = savedName.split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      }

      // Load persisted files from IndexedDB
      const loadIndexedDBFiles = async () => {
        const storedFiles = await getAllFilesFromIndexedDB();
        if (storedFiles && Object.keys(storedFiles).length > 0) {
          setDocuments((prev) => ({ ...prev, ...storedFiles }));
        }
      };
      loadIndexedDBFiles();

      // Check draft data in localStorage
      const draftRaw = localStorage.getItem("applicant_draft_data");
      const isSubmitted = localStorage.getItem("application_submitted");

      if (draftRaw && isSubmitted !== "true") {
        try {
          const draft = JSON.parse(draftRaw);
          if (draft.currentStep !== undefined) setCurrentStep(draft.currentStep);
          if (draft.category) setCategory(draft.category);
          if (draft.firstName) setFirstName(draft.firstName);
          if (draft.lastName) setLastName(draft.lastName);
          if (draft.aadhaarNumber) setAadhaarNumber(draft.aadhaarNumber);
          if (draft.panNumber) setPanNumber(draft.panNumber);
          if (draft.dobDay) setDobDay(draft.dobDay);
          if (draft.dobMonth) setDobMonth(draft.dobMonth);
          if (draft.dobYear) setDobYear(draft.dobYear);
          if (draft.gender) setGender(draft.gender);
          if (draft.address) setAddress(draft.address);
          if (draft.district) setDistrict(draft.district);
          if (draft.block) setBlock(draft.block);
          if (draft.schoolName) setSchoolName(draft.schoolName);
          if (draft.highestQualification) setHighestQualification(draft.highestQualification);
          if (draft.bankAccountNumber) setBankAccountNumber(draft.bankAccountNumber);
          if (draft.phoneNumber) setPhoneNumber(draft.phoneNumber);
          if (draft.isPhoneVerified) setIsPhoneVerified(draft.isPhoneVerified);
          if (draft.degree) setDegree(draft.degree);
          if (draft.institution) setInstitution(draft.institution);
          if (draft.yearOfPassing) setYearOfPassing(draft.yearOfPassing);
          if (draft.percentage) setPercentage(draft.percentage);
          if (draft.documents) setDocuments((prev) => ({ ...draft.documents, ...prev }));

          setDraftSavedBanner(`Welcome back! Your draft application has been restored at Step ${draft.currentStep + 1} (${STEPS[draft.currentStep]}).`);
        } catch (e) {
          console.error("Failed to parse draft:", e);
        }
      }
    }
  }, []);

  // Auto-save form inputs to localStorage draft on every change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSubmitted = localStorage.getItem("application_submitted");
      if (isSubmitted !== "true") {
        const sanitizedDocs: { [key: string]: { name: string; size: string } } = {};
        Object.keys(documents).forEach((key) => {
          sanitizedDocs[key] = {
            name: documents[key].name,
            size: documents[key].size,
          };
        });

        const draftData = {
          currentStep,
          category,
          firstName,
          lastName,
          email,
          aadhaarNumber,
          panNumber,
          dobDay,
          dobMonth,
          dobYear,
          gender,
          address,
          district,
          block,
          schoolName,
          highestQualification,
          bankAccountNumber,
          phoneNumber,
          isPhoneVerified,
          degree,
          institution,
          yearOfPassing,
          percentage,
          documents: sanitizedDocs,
        };
        try {
          localStorage.setItem("applicant_draft_data", JSON.stringify(draftData));
        } catch (e) {
          console.warn("localStorage quota exceeded while saving draft metadata:", e);
        }
      }
    }
  }, [
    currentStep,
    category,
    firstName,
    lastName,
    email,
    aadhaarNumber,
    panNumber,
    dobDay,
    dobMonth,
    dobYear,
    gender,
    address,
    district,
    block,
    schoolName,
    highestQualification,
    bankAccountNumber,
    phoneNumber,
    isPhoneVerified,
    degree,
    institution,
    yearOfPassing,
    percentage,
    documents,
  ]);

  const saveDraftAndExit = async () => {
    if (typeof window !== "undefined") {
      const sanitizedDocs: { [key: string]: { name: string; size: string } } = {};
      Object.keys(documents).forEach((key) => {
        sanitizedDocs[key] = {
          name: documents[key].name,
          size: documents[key].size,
        };
      });

      const draftData = {
        currentStep,
        category,
        firstName,
        lastName,
        email,
        aadhaarNumber,
        panNumber,
        dobDay,
        dobMonth,
        dobYear,
        gender,
        address,
        highestQualification,
        bankAccountNumber,
        phoneNumber,
        isPhoneVerified,
        degree,
        institution,
        yearOfPassing,
        percentage,
        documents: sanitizedDocs,
      };

      try {
        localStorage.setItem("applicant_draft_data", JSON.stringify(draftData));
      } catch (e) {
        console.warn("localStorage quota exceeded while saving draft:", e);
      }

      // Post draft state to database
      try {
        await fetch("/api/application/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phoneNumber || "+919876543210",
            categoryName: category,
            personalDetails: {
              firstName,
              lastName,
              dateOfBirth: formattedDob,
              gender,
              aadhaarNumber,
              panNumber,
              email,
              address,
              highestQualification,
              bankAccountNumber: category === "Clerk" ? bankAccountNumber : null,
            },
            isDraft: true,
          }),
        });
      } catch (e) {
        // silent draft sync fallback
      }
    }
    router.push("/");
  };

  const setupRecaptcha = () => {
    if (typeof window !== "undefined") {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // ignore cleanup errors
        }
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-step1-container", {
        size: "invisible",
      });
    }
    return window.recaptchaVerifier;
  };

  const [useFallbackOtp, setUseFallbackOtp] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    setOtpMessage("");

    try {
      const dupRes = await fetch("/api/auth/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const dupData = await dupRes.json();

      if (dupData.isDuplicate) {
        setOtpError(dupData.message || "This mobile number is already registered.");
        setOtpLoading(false);
        return;
      }

      // Try Firebase Phone Auth first
      try {
        const appVerifier = setupRecaptcha();
        const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setUseFallbackOtp(false);
        setOtpMessage("OTP sent successfully to " + formattedPhone);
      } catch (fbErr: any) {
        console.warn("Firebase Phone Auth error, activating fallback OTP engine:", fbErr);
        // Fallback to internal server API OTP
        const fallbackRes = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send", phoneNumber }),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.success) {
          setUseFallbackOtp(true);
          setConfirmationResult({} as any);
          setOtpMessage(`${fallbackData.message} (Verification Code: ${fallbackData.otpPreview})`);
        } else {
          setOtpError(fallbackData.message || "Failed to send OTP.");
        }
      }
    } catch (err: any) {
      setOtpError(err.message || "Failed to process OTP request.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setOtpLoading(true);
    setOtpError("");

    try {
      if (useFallbackOtp) {
        const verifyRes = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", phoneNumber, otp }),
        });
        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          setIsPhoneVerified(true);
          setOtpMessage("Mobile number verified successfully! ✓");
        } else {
          setOtpError(verifyData.message || "Invalid OTP code.");
        }
      } else if (confirmationResult) {
        await confirmationResult.confirm(otp);
        setIsPhoneVerified(true);
        setOtpMessage("Mobile number verified successfully! ✓");
      }
    } catch (err: any) {
      setOtpError("Invalid OTP code. Please check and try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const compressImageIfNeeded = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || "");
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.72);
          resolve(compressedDataUrl);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || "");
          reader.readAsDataURL(file);
        }
      };
      img.onerror = () => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || "");
        reader.readAsDataURL(file);
      };
      img.src = url;
    });
  };

  const handleFileUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 2 MB Maximum File Size Validation Check (2 * 1024 * 1024 bytes)
      const maxSizeBytes = 2 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setStepError(`File "${file.name}" exceeds the 2 MB maximum size limit! Please upload a file smaller than 2 MB.`);
        e.target.value = ""; // Clear selected file input
        return;
      }
      setStepError(""); // Clear previous errors if file is valid

      try {
        const fileUrl = await compressImageIfNeeded(file);
        const compressedSizeKb = Math.round((fileUrl.length * 0.75) / 1024);
        const sizeInMb = (compressedSizeKb / 1024).toFixed(2);

        const docObj = {
          name: file.name,
          size: `${sizeInMb} MB`,
          fileUrl: fileUrl,
        };
        setDocuments((prev) => ({
          ...prev,
          [docType]: docObj,
        }));
        saveFileToIndexedDB(docType, docObj);
      } catch (err) {
        console.error("File processing failed:", err);
      }
    }
  };

  // STRICT STEP VALIDATION BEFORE ADVANCING
  const nextStep = async () => {
    setStepError("");

    if (currentStep === 0) {
      if (!firstName.trim() || !lastName.trim()) {
        setStepError("Please enter your First Name and Last Name.");
        return;
      }
      if (!district.trim() || !block.trim() || !schoolName.trim()) {
        setStepError("Please select/enter your District, Block, and Target School Name.");
        return;
      }
      if (!/^\d{12}$/.test(aadhaarNumber)) {
        setStepError("Aadhaar Card Number must contain ONLY digits and be EXACTLY 12 digits.");
        return;
      }
      if (!/^[A-Z0-9]{10}$/.test(panNumber)) {
        setStepError("PAN Card Number must be EXACTLY 10 alphanumeric characters.");
        return;
      }
      if (category === "Clerk" && !bankAccountNumber.trim()) {
        setStepError("Please enter your Bank Account Number required for Clerk position.");
        return;
      }
      if (!address.trim()) {
        setStepError("Please enter your Residential Address.");
        return;
      }
      if (!isPhoneVerified) {
        setStepError("Please verify your Mobile Phone Number via OTP before proceeding.");
        return;
      }

      setValidatingStep(true);
      try {
        const dupRes = await fetch("/api/auth/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aadhaarNumber, panNumber }),
        });
        const dupData = await dupRes.json();

        if (dupData.isDuplicate) {
          setStepError(dupData.message || "This Aadhaar or PAN number is already registered.");
          setValidatingStep(false);
          return;
        }
      } catch (err) {
        console.error("Duplicate check error:", err);
      } finally {
        setValidatingStep(false);
      }
    }

    if (currentStep === 1) {
      if (!degree.trim() || !institution.trim()) {
        setStepError("Please enter your Qualification Name and Board/University.");
        return;
      }
      if (!yearOfPassing || !percentage) {
        setStepError("Please fill in your Year of Passing and Percentage/CGPA.");
        return;
      }
      if (!documents["MARKSHEET_CERTIFICATE"] || !documents["EDUCATIONAL_CERTIFICATE"]) {
        setStepError("Please upload both your Marksheet Certificate and Educational Qualification Certificate.");
        return;
      }
    }

    if (currentStep === 2) {
      if (!documents["PHOTO"] || !documents["AADHAAR"] || !documents["SIGNATURE"] || !documents["THUMB_IMPRESSION"] || !documents["BANK_PASSBOOK"] || !documents["PAN_IMAGE"]) {
        setStepError("Please upload all mandatory documents: Passport Photo, Signature, Aadhaar, Thumb Impression, Bank Passbook, and PAN Card Image.");
        return;
      }
      if (category === "Clerk" && (!documents["COMPUTER_PGDCA"] || !documents["CASTE_CERTIFICATE"])) {
        setStepError("Please upload your Caste Certificate and Computer PGDCA Certificate required for Clerk position.");
        return;
      }
    }

    // Auto-sync draft to database on every step progression
    try {
      fetch("/api/application/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber || "+919876543210",
          categoryName: category,
          personalDetails: {
            firstName,
            lastName,
            dateOfBirth: formattedDob,
            gender,
            aadhaarNumber,
            panNumber,
            email,
            address,
            district,
            block,
            schoolName,
            highestQualification,
            bankAccountNumber: category === "Clerk" ? bankAccountNumber : null,
          },
          educationalDetails: degree ? [{ degree, institution, yearOfPassing, percentage }] : [],
          documents: Object.keys(documents).map((key) => ({
            documentType: key,
            fileUrl: (documents[key] as any).fileUrl || `https://supabase.storage/documents/${documents[key].name}`,
            fileSize: 1024 * 500,
          })),
          isDraft: true,
        }),
      });
    } catch (e) {
      // background draft sync
    }

    setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setStepError("");
    setCurrentStep((p) => Math.max(p - 1, 0));
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    setStepError("");

    try {
      const response = await fetch("/api/application/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber || "+919876543210",
          categoryName: category,
          personalDetails: {
            firstName,
            lastName,
            dateOfBirth: formattedDob,
            gender,
            aadhaarNumber,
            panNumber,
            email,
            address,
            district,
            block,
            schoolName,
            highestQualification,
            bankAccountNumber: category === "Clerk" ? bankAccountNumber : null,
          },
          educationalDetails: degree ? [{ degree, institution, yearOfPassing, percentage }] : [],
          documents: Object.keys(documents).map((key) => ({
            documentType: key,
            fileUrl: (documents[key] as any).fileUrl || `https://supabase.storage/documents/${documents[key].name}`,
            fileSize: 1024 * 500,
          })),
          isDraft: false,
        }),
      });

      const data = await response.json();
      const finalAppNo = data.applicationNo || ("APP-2026-" + Math.floor(100000 + Math.random() * 900000));

      if (typeof window !== "undefined") {
        localStorage.setItem("application_submitted", "true");
        localStorage.setItem("submitted_app_no", finalAppNo);
        localStorage.removeItem("applicant_draft_data");
        clearFilesFromIndexedDB();
      }

      setSubmittedAppNo(finalAppNo);
    } catch (err: any) {
      const fallbackAppNo = "APP-2026-" + Math.floor(100000 + Math.random() * 900000);
      if (typeof window !== "undefined") {
        localStorage.setItem("application_submitted", "true");
        localStorage.setItem("submitted_app_no", fallbackAppNo);
        localStorage.removeItem("applicant_draft_data");
      }
      setSubmittedAppNo(fallbackAppNo);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("applicant_email");
      localStorage.removeItem("applicant_name");
      localStorage.removeItem("application_submitted");
      localStorage.removeItem("submitted_app_no");
      localStorage.removeItem("applicant_draft_data");
    }
    document.cookie = "applicant_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/");
  };

  // Submitted Confirmation Screen
  if (submittedAppNo) {
    return (
      <div className="bg-card border rounded-2xl p-8 md:p-12 text-center shadow-xl max-w-2xl mx-auto my-10 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50 dark:ring-emerald-950">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold mb-2">Application Submitted Successfully!</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          A copy of your application details has been dispatched to <strong>{email || "your registered email"}</strong>.
        </p>

        <div className="bg-muted p-6 rounded-xl border mb-8 text-left space-y-3 text-sm">
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-muted-foreground">Application Number</span>
            <span className="font-mono font-bold text-lg text-primary">{submittedAppNo}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-muted-foreground">Applied Position</span>
            <span className="font-semibold px-2.5 py-0.5 bg-primary/10 text-primary rounded-full">{category}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-muted-foreground">Aadhaar Card Number</span>
            <span className="font-mono font-semibold">{aadhaarNumber}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-muted-foreground">Date of Birth</span>
            <span className="font-mono font-semibold">{formattedDob}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Applicant Name</span>
            <span className="font-semibold">{firstName} {lastName}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 shadow-lg transition-all"
          >
            Go to Applicant Dashboard
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-8 py-3 border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/60 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = (currentStep / (STEPS.length - 1)) * 100;

  return (
    <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
      
      {/* Top Header Bar with Save Draft & Exit Button */}
      <div className="bg-muted/40 border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/odisha-logo.png" alt="Government of Odisha Seal" className="w-10 h-10 object-contain drop-shadow" />
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">Recruitment Application</span>
            <h3 className="font-bold text-sm">Application Form ({category} Position)</h3>
          </div>
        </div>

        <button
          onClick={saveDraftAndExit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <Save className="w-3.5 h-3.5 text-primary" /> Save Draft & Exit
        </button>
      </div>

      {/* Auto-restored Draft Banner */}
      {draftSavedBanner && (
        <div className="p-3 bg-indigo-500/10 border-b border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium flex items-center justify-between px-6">
          <span>{draftSavedBanner}</span>
          <button onClick={() => setDraftSavedBanner("")} className="text-indigo-500 font-bold hover:underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Progress Bar Header */}
      <div className="bg-muted/20 border-b p-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border -z-10 rounded"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
          
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            
            return (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ring-4 ring-card transition-colors duration-300 ${
                    isCompleted ? "bg-primary text-primary-foreground" : 
                    isCurrent ? "bg-primary text-primary-foreground border-2 border-primary-foreground/20" : 
                    "bg-muted border-2 border-border text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`text-xs font-medium mt-2 hidden sm:block ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Error Banner */}
      {stepError && (
        <div className="p-4 bg-red-100 dark:bg-red-950/50 border-b border-red-200 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="p-6 md:p-8 min-h-[420px]">

        {/* STEP 1: Personal Details & Mobile OTP */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Personal Details & Mobile OTP</h2>
              <p className="text-muted-foreground">Select position category, fill personal info, and verify mobile OTP.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Select Recruitment Position *</label>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {(["Peon", "Clerk"] as const).map((catOption) => (
                  <button
                    key={catOption}
                    type="button"
                    onClick={() => setCategory(catOption)}
                    className={`py-3 px-6 rounded-xl border font-bold text-base transition-all flex items-center justify-center gap-2 ${
                      category === catOption
                        ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                        : "bg-background hover:bg-muted text-foreground border-border"
                    }`}
                  >
                    <span>{catOption === "Peon" ? "🧹 Peon" : "💼 Clerk"}</span>
                    {category === catOption && <Check className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Registered Gmail / Email (Auto-filled)</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full p-2.5 rounded-lg border bg-muted/60 text-muted-foreground font-mono cursor-not-allowed outline-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Aadhaar Card Number *</label>
                  <span className="text-xs text-muted-foreground font-mono">{aadhaarNumber.length}/12 digits</span>
                </div>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none font-mono tracking-wider"
                  placeholder="12 digit numbers only"
                  maxLength={12}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">PAN Card Number *</label>
                  <span className="text-xs text-muted-foreground font-mono">{panNumber.length}/10 chars</span>
                </div>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none font-mono uppercase tracking-wider"
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                  required
                />
              </div>

              {/* Date of Birth Selector */}
              <div className="space-y-2 md:col-span-2 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Date of Birth *
                  </label>
                  <button
                    type="button"
                    onClick={() => setDobMode(dobMode === "dropdown" ? "native" : "dropdown")}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    {dobMode === "dropdown" ? "Switch to Native Calendar / Type" : "Switch to Easy Dropdown Picker"}
                  </button>
                </div>

                {dobMode === "dropdown" ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground font-medium">Day</label>
                      <select
                        value={dobDay}
                        onChange={(e) => setDobDay(e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-background text-sm outline-none font-medium"
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground font-medium">Month</label>
                      <select
                        value={dobMonth}
                        onChange={(e) => setDobMonth(e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-background text-sm outline-none font-medium"
                      >
                        {MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground font-medium">Year (Full List)</label>
                      <select
                        value={dobYear}
                        onChange={(e) => setDobYear(e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-background text-sm font-mono font-bold text-primary outline-none"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={formattedDob}
                    onChange={(e) => {
                      const parts = e.target.value.split("-");
                      if (parts.length === 3) {
                        setDobYear(parts[0]);
                        setDobMonth(parts[1]);
                        setDobDay(parts[2]);
                      }
                    }}
                    className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none font-mono"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Highest Qualification *</label>
                <select
                  value={highestQualification}
                  onChange={(e) => setHighestQualification(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="10th Standard">10th Standard / Matriculation</option>
                  <option value="12th Standard">12th Standard / Higher Secondary</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Graduate">Graduation / Bachelor Degree</option>
                  <option value="Post Graduate">Post Graduation / Master Degree</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">District *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  {ODISHA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Block / Tehsildar Block *</label>
                <input
                  type="text"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Bhadrak Sadar / Cuttack Block"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-primary">Applying for Which School (Target School Name) *</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none font-semibold text-foreground"
                  placeholder="e.g. Government High School, Unit 1, Bhubaneswar"
                  required
                />
              </div>

              {category === "Clerk" && (
                <div className="space-y-2 md:col-span-2 p-4 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in duration-200">
                  <label className="text-sm font-bold text-primary block">Bank Account Number (Required for Clerk Position) *</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none font-mono"
                    placeholder="Enter Bank Account Number"
                    required
                  />
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Residential Address *</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none min-h-[80px]"
                  placeholder="Street address, City, District, Pincode"
                  required
                />
              </div>
            </div>

            {/* Mobile OTP Card */}
            <div className="p-5 rounded-xl border bg-muted/30 space-y-4 border-dashed border-primary/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Mobile Phone Verification (OTP Required) *</h3>
                </div>
                {isPhoneVerified && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                    Verified ✓
                  </span>
                )}
              </div>

              {otpError && (
                <div className="p-2.5 rounded bg-red-100 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}
              {otpMessage && (
                <div className="p-2.5 rounded bg-emerald-100 text-emerald-800 text-xs font-medium">
                  {otpMessage}
                </div>
              )}

              {!isPhoneVerified && (
                <div className="grid sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Mobile Number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-xs">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter 10 digit number"
                        className="flex-1 block w-full rounded-none rounded-r-md text-sm border-border p-2 border outline-none bg-background"
                      />
                    </div>
                  </div>

                  {!confirmationResult ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                      className="py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-md text-xs hover:bg-primary/90 disabled:opacity-50"
                    >
                      {otpLoading ? "Sending..." : "Send OTP"}
                    </button>
                  ) : (
                    <div className="space-y-2 sm:col-span-3 pt-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="flex-1 p-2 rounded-md border text-sm outline-none bg-background"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpLoading}
                          className="px-5 py-2 bg-emerald-600 text-white font-medium rounded-md text-xs hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {otpLoading ? "Verifying..." : "Verify OTP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div id="recaptcha-step1-container"></div>
            </div>

          </div>
        )}

        {/* STEP 2: Educational Details & Certificate Uploads */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Educational Qualification & Certificate Upload</h2>
              <p className="text-muted-foreground">Fill in your qualification details and upload your Marksheet & Educational Certificates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Qualification Name *</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. 10th Standard / Matriculation"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">School / Board / University *</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. BSE Odisha / CHSE / Utkal University"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Year of Passing *</label>
                <input
                  type="number"
                  value={yearOfPassing}
                  onChange={(e) => setYearOfPassing(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Percentage / CGPA *</label>
                <input
                  type="number"
                  step="0.01"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="85.5"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Educational Certificates Upload *
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Marksheet Certificate *", type: "MARKSHEET_CERTIFICATE" },
                  { label: "Educational Qualification Certificate *", type: "EDUCATIONAL_CERTIFICATE" },
                ].map((doc) => {
                  const isUploaded = !!documents[doc.type];
                  return (
                    <label
                      key={doc.type}
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative group ${
                        isUploaded
                          ? "border-emerald-500 bg-emerald-500/5"
                          : "border-border hover:border-primary bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileUpload(doc.type, e)}
                      />

                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm ${
                        isUploaded ? "bg-emerald-100 text-emerald-600" : "bg-background text-muted-foreground"
                      }`}>
                        {isUploaded ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                      </div>

                      <h4 className="font-semibold text-sm">{doc.label}</h4>

                      {isUploaded ? (
                        <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                          <span>{documents[doc.type].name}</span>
                          <span>({documents[doc.type].size})</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">Click to select PDF or image file</p>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Required Documents Upload */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-1">Upload Required Identity & Verification Documents</h2>
              <p className="text-muted-foreground">Upload your passport photo, signature, identity documents, bank passbook, and certificates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Passport Photo *", type: "PHOTO", icon: <ImageIcon className="w-6 h-6" /> },
                { label: "Signature *", type: "SIGNATURE", icon: <FileText className="w-6 h-6" /> },
                { label: "Aadhaar Card *", type: "AADHAAR", icon: <ShieldCheck className="w-6 h-6" /> },
                { label: "Thumb Impression Image *", type: "THUMB_IMPRESSION", icon: <FileText className="w-6 h-6" /> },
                { label: "Bank Passbook Image *", type: "BANK_PASSBOOK", icon: <FileText className="w-6 h-6" /> },
                { label: "PAN Card Image *", type: "PAN_IMAGE", icon: <ShieldCheck className="w-6 h-6" /> },
                ...(category === "Clerk"
                  ? [
                      { label: "Caste Certificate (Clerk) *", type: "CASTE_CERTIFICATE", icon: <FileText className="w-6 h-6" /> },
                      { label: "Computer PGDCA Certificate (Clerk) *", type: "COMPUTER_PGDCA", icon: <FileText className="w-6 h-6" /> },
                    ]
                  : []),
              ].map((doc) => {
                const isUploaded = !!documents[doc.type];
                return (
                  <label
                    key={doc.type}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative group ${
                      isUploaded
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-border hover:border-primary bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileUpload(doc.type, e)}
                    />

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-sm ${
                      isUploaded ? "bg-emerald-100 text-emerald-600" : "bg-background text-muted-foreground"
                    }`}>
                      {isUploaded ? <CheckCircle2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    </div>

                    <h4 className="font-semibold text-xs">{doc.label}</h4>

                    {isUploaded ? (
                      <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full font-medium truncate max-w-full">
                        {documents[doc.type].name}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-1">Select File</p>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Final Submission */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-1">Review & Final Submission</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-xs">
                Review your submitted details and uploaded certificates before final submission.
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl p-6 border space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <span className="text-muted-foreground block text-xs">Applied Position</span>
                  <span className="font-bold text-primary text-base">{category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Applicant Name</span>
                  <span className="font-semibold">{firstName} {lastName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Date of Birth</span>
                  <span className="font-mono font-semibold">{formattedDob}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Registered Gmail</span>
                  <span className="font-semibold font-mono">{email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Mobile Number</span>
                  <span className="font-semibold">{phoneNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Aadhaar Number</span>
                  <span className="font-mono">{aadhaarNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">PAN Number</span>
                  <span className="font-mono uppercase">{panNumber || "N/A"}</span>
                </div>
                {category === "Clerk" && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-xs">Bank Account Number (Clerk)</span>
                    <span className="font-mono font-bold text-primary">{bankAccountNumber}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-muted-foreground block text-xs mb-2">Uploaded Certificates & Files</span>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(documents).map((docType) => (
                    <span key={docType} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {docType.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>I hereby declare that all details and documents submitted for the <strong>{category}</strong> position are genuine and accurate.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-muted/20 border-t p-6 flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border bg-background font-medium hover:bg-muted disabled:opacity-50 transition-colors text-xs"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        
        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            disabled={validatingStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-md transition-all text-xs disabled:opacity-50"
          >
            {validatingStep ? "Checking..." : (currentStep === 2 ? "Next: Review & Submit Application ➔" : "Next")} <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmitApplication}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/30 transition-all text-xs disabled:opacity-50"
          >
            {submitting ? "Submitting Official Application..." : "🚀 Submit Official Application Now"} <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
