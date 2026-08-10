"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Clock, CheckCircle2, Download, AlertTriangle, ShieldCheck, XCircle, LogOut, Printer, FileCheck, PlusCircle, RefreshCw, User, Edit3, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [appStatus, setAppStatus] = useState<string>("NONE");
  const [submittedAppNo, setSubmittedAppNo] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [appliedPosition, setAppliedPosition] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [isRecordDeleted, setIsRecordDeleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchApplicantLiveStatus = async () => {
    if (typeof window === "undefined") return;

    const email = localStorage.getItem("applicant_email");
    const appNo = localStorage.getItem("submitted_app_no");
    const wasSubmitted = localStorage.getItem("application_submitted") === "true";

    if (email) setUserEmail(email);
    if (appNo) setSubmittedAppNo(appNo);

    try {
      const res = await fetch("/api/admin/applications");
      if (res.ok) {
        const data = await res.json();
        const apps = data.applications || [];
        const registeredUsers = data.registeredUsers || [];

        const cleanEmail = email ? email.trim().toLowerCase() : "";
        const cleanAppNo = appNo ? appNo.trim() : "";

        // Prioritize exact Application Number match (e.g. APP-2026-153558), then email match
        const matchedApp = apps.find(
          (a: any) =>
            (cleanAppNo && a.applicationNo === cleanAppNo && !a.applicationNo.startsWith("REG-")) ||
            (cleanEmail && (
              (a.user?.email && a.user.email.trim().toLowerCase() === cleanEmail) ||
              (a.personalDetails?.email && a.personalDetails.email.trim().toLowerCase() === cleanEmail)
            ))
        );

        const matchedUser = registeredUsers.find(
          (u: any) => cleanEmail && u.email && u.email.trim().toLowerCase() === cleanEmail
        );

        // IF ADMIN DELETED THE APPLICATION OR USER RECORD AFTER SUBMISSION
        if (!matchedApp && !matchedUser && wasSubmitted) {
          setIsRecordDeleted(true);
          setAppStatus("NONE");
          localStorage.removeItem("application_submitted");
          localStorage.removeItem("submitted_app_no");
          localStorage.removeItem("applicant_draft_data");
          return;
        }

        if (matchedApp && matchedApp.status && matchedApp.status !== "DRAFT") {
          setIsRecordDeleted(false);
          setAppStatus(matchedApp.status);

          // Sync exact Application ID across user & admin portal
          setSubmittedAppNo(matchedApp.applicationNo);
          localStorage.setItem("submitted_app_no", matchedApp.applicationNo);
          localStorage.setItem("application_submitted", "true");

          if (matchedApp.category?.name) setAppliedPosition(matchedApp.category.name);
          if (matchedApp.personalDetails?.firstName) {
            setApplicantName(`${matchedApp.personalDetails.firstName} ${matchedApp.personalDetails.lastName || ""}`);
          }
        } else if (matchedApp && matchedApp.personalDetails && matchedApp.personalDetails.firstName) {
          setIsRecordDeleted(false);
          setSubmittedAppNo(matchedApp.applicationNo);
          if (matchedApp.category?.name) setAppliedPosition(matchedApp.category.name);
          if (matchedApp.personalDetails?.firstName) {
            setApplicantName(`${matchedApp.personalDetails.firstName} ${matchedApp.personalDetails.lastName || ""}`);
          }
          // If draft with form details, indicate draft
          setAppStatus("DRAFT");
        } else {
          // User registered but has not submitted a filled form yet
          setAppStatus("NONE");
        }
      }
    } catch (err) {
      console.error("Failed to fetch live applicant status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicantLiveStatus();

    const interval = setInterval(() => {
      fetchApplicantLiveStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleStartNewApplication = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("application_submitted");
      localStorage.removeItem("submitted_app_no");
      localStorage.removeItem("applicant_draft_data");
    }
    router.push("/application/edit");
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
    window.location.href = "/";
  };

  const downloadApprovalReceipt = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recruitment Status Certificate - ${submittedAppNo || "APPLICATION"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px double #15803d; padding-bottom: 20px; margin-bottom: 30px; }
            .govt { font-size: 24px; font-weight: bold; color: #15803d; text-transform: uppercase; }
            .dept { font-size: 16px; font-weight: bold; color: #374151; }
            .status-box { border: 2px solid ${appStatus === "APPROVED" ? "#15803d" : appStatus === "REJECTED" ? "#b91c1c" : "#1d4ed8"}; background: ${appStatus === "APPROVED" ? "#f0fdf4" : appStatus === "REJECTED" ? "#fef2f2" : "#eff6ff"}; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
            .status-title { font-size: 20px; font-weight: bold; color: ${appStatus === "APPROVED" ? "#15803d" : appStatus === "REJECTED" ? "#b91c1c" : "#1d4ed8"}; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; margin-bottom: 30px; }
            .label { color: #6b7280; font-weight: bold; }
            .val { font-weight: bold; color: #111; }
            .footer { text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="govt">Government of Odisha</div>
            <div class="dept">School & Mass Education Department</div>
            <p>Official Recruitment Selection Board 2026</p>
          </div>

          <div class="status-box">
            <div class="status-title">APPLICATION DECISION: ${appStatus === "NONE" ? "REGISTERED - PENDING FORM" : appStatus}</div>
            <p style="margin-top: 8px; font-size: 14px;">This official certificate verifies recruitment registration for <strong>${userEmail}</strong>.</p>
          </div>

          <div class="grid">
            <div><span class="label">Application Reference:</span> <span class="val">${submittedAppNo || "APP-2026-PENDING"}</span></div>
            <div><span class="label">Applied Position:</span> <span class="val">${appliedPosition || "Peon / Clerk (Pending)"}</span></div>
            <div><span class="label">Registered Email:</span> <span class="val">${userEmail}</span></div>
            <div><span class="label">Decision Status:</span> <span class="val">${appStatus === "NONE" ? "Registration Active" : appStatus}</span></div>
            <div><span class="label">Department:</span> <span class="val">School & Mass Education Dept.</span></div>
            <div><span class="label">Issued Date:</span> <span class="val">${new Date().toLocaleDateString()}</span></div>
          </div>

          <div class="footer">
            Official Online Recruitment Verification Receipt • Government of Odisha
          </div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getProgressPercent = () => {
    if (appStatus === "APPROVED" || appStatus === "REJECTED") return 100;
    if (appStatus === "UNDER_REVIEW") return 75;
    if (appStatus === "SUBMITTED") return 50;
    return 25; // Registered Step 1 Complete
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="bg-background border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-primary flex items-center gap-2">
            Government Applicant Portal
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-semibold text-muted-foreground hidden sm:inline">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* IF ADMIN DELETED RECORD */}
        {isRecordDeleted ? (
          <div className="bg-card border-2 border-amber-400 rounded-2xl p-8 text-center shadow-xl max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-amber-800 dark:text-amber-300">Previous Application Record Removed</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your previous application or account record was removed by the portal administrator. You can now fill out and submit a fresh application form.
              </p>
            </div>

            <button
              onClick={handleStartNewApplication}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg transition-all text-sm inline-flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" /> Fill Out New Application Form Now
            </button>
          </div>
        ) : (
          /* FULL ELEGANT APPLICANT DASHBOARD */
          <>
            {/* Dynamic Status Decision Notice Banner */}
            {appStatus === "APPROVED" && (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 rounded-2xl flex items-start gap-4 text-emerald-900 dark:text-emerald-200 shadow-lg animate-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xl text-emerald-700 dark:text-emerald-300">Application APPROVED 🎉</h3>
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase tracking-wider">Accepted ✓</span>
                  </div>
                  <p className="text-base font-medium">
                    Congratulations! Your application <strong className="font-mono">{submittedAppNo}</strong> for <strong>{appliedPosition}</strong> position has been officially <strong>APPROVED</strong> by the School & Mass Education Department, Government of Odisha.
                  </p>
                  <button
                    onClick={downloadApprovalReceipt}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
                  >
                    <Printer className="w-4 h-4" /> Download Official Selection Certificate Receipt
                  </button>
                </div>
              </div>
            )}

            {appStatus === "REJECTED" && (
              <div className="p-6 bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500 rounded-2xl flex items-start gap-4 text-rose-900 dark:text-rose-200 shadow-lg animate-in zoom-in-95 duration-300">
                <XCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xl text-rose-700 dark:text-rose-300">Application REJECTED</h3>
                    <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-bold uppercase tracking-wider">Rejected ✕</span>
                  </div>
                  <p className="text-base font-medium">
                    Your application <strong className="font-mono">{submittedAppNo}</strong> for <strong>{appliedPosition}</strong> position has been <strong>REJECTED</strong> by the recruitment verification board.
                  </p>
                  {adminRemarks && (
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/60 rounded-xl text-xs font-mono">
                      <strong>Board Remarks:</strong> {adminRemarks}
                    </div>
                  )}
                </div>
              </div>
            )}

            {appStatus === "UNDER_REVIEW" && (
              <div className="p-6 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 rounded-2xl flex items-start gap-4 text-amber-900 dark:text-amber-200 shadow-md animate-in fade-in duration-300">
                <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <h3 className="font-bold text-lg text-amber-800 dark:text-amber-300">Document Verification Under Active Review</h3>
                  <p>
                    Your application <strong className="font-mono">{submittedAppNo}</strong> for <strong>{appliedPosition}</strong> is currently being thoroughly reviewed and verified by officials. Please check back shortly.
                  </p>
                </div>
              </div>
            )}

            {appStatus === "SUBMITTED" && (
              <div className="p-5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-start gap-4 text-blue-900 dark:text-blue-200 shadow-sm animate-in fade-in duration-300">
                <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <h3 className="font-bold text-base">Application Successfully Submitted</h3>
                  <p>
                    Your application <strong className="font-mono">{submittedAppNo}</strong> for <strong>{appliedPosition}</strong> position has been received. Re-submission or duplicate registrations are not allowed for this recruitment drive.
                  </p>
                </div>
              </div>
            )}

            {appStatus === "NONE" && (
              <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 rounded-2xl flex items-start gap-4 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in duration-300">
                <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base">Account Registration Complete ✓</h3>
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
                      Form Pending
                    </span>
                  </div>
                  <p>
                    Your account <strong className="font-mono">{userEmail}</strong> is active. You can now complete and submit your application form for Peon or Clerk recruitment positions.
                  </p>
                </div>
              </div>
            )}

            {/* Dashboard Welcome Header */}
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-1">
                Welcome to your Dashboard, {applicantName || (userEmail ? userEmail.split("@")[0].toUpperCase() : "Applicant")}!
              </h2>
              <p className="text-muted-foreground text-sm">Official Recruitment Portal • School & Mass Education Department, Government of Odisha.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Main Application Status & Progress Card */}
              <div className="md:col-span-2 bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3.5 py-1 text-xs font-extrabold rounded-full border tracking-wide ${
                        appStatus === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                          : appStatus === "REJECTED"
                          ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                          : appStatus === "UNDER_REVIEW"
                          ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                          : appStatus === "SUBMITTED"
                          ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      }`}>
                        {appStatus === "NONE" ? "REGISTRATION ACTIVE ✓" : appStatus === "APPROVED" ? "APPROVED ✓" : appStatus === "REJECTED" ? "REJECTED ✕" : appStatus}
                      </span>
                    </div>
                    <h3 className="text-2xl font-extrabold font-mono text-primary">
                      {submittedAppNo || "APP-2026-REGISTRATION"}
                    </h3>
                    <p className="text-muted-foreground text-sm font-medium">
                      Applied Position: <strong>{appliedPosition || "Peon / Clerk (Select in Form)"}</strong>
                    </p>
                  </div>
                  
                  {appStatus === "NONE" ? (
                    <Link 
                      href="/application/edit"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-all text-xs"
                    >
                      <Edit3 className="w-4 h-4" /> Complete Application Form <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      onClick={downloadApprovalReceipt}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all"
                    >
                      <Printer className="w-4 h-4" /> Download PDF Receipt
                    </button>
                  )}
                </div>

                {/* Dynamic Real-time Progress Steps */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-sm text-foreground">Application Verification Journey</h4>

                  <div className="relative pt-6 pb-2">
                    <div className="absolute top-1/2 left-0 w-full h-1.5 bg-muted -translate-y-1/2 rounded" />
                    <div 
                      className={`absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded transition-all duration-500 ${
                        appStatus === "REJECTED" ? "bg-rose-600" : "bg-primary"
                      }`} 
                      style={{ width: `${getProgressPercent()}%` }}
                    />
                    
                    <div className="relative flex justify-between z-10">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold ring-4 ring-card text-xs">1</div>
                        <span className="text-xs font-bold mt-2 text-primary">Registered ✓</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ring-4 ring-card text-xs ${
                          appStatus !== "NONE" ? "bg-primary text-primary-foreground" : "bg-muted border-2 border-border text-muted-foreground"
                        }`}>2</div>
                        <span className="text-xs font-medium mt-2">Form Submitted</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ring-4 ring-card text-xs ${
                          appStatus === "UNDER_REVIEW" || appStatus === "APPROVED" || appStatus === "REJECTED"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted border-2 border-border text-muted-foreground"
                        }`}>3</div>
                        <span className="text-xs font-medium mt-2">Under Review</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ring-4 ring-card text-xs ${
                          appStatus === "APPROVED"
                            ? "bg-emerald-600 text-white ring-emerald-300"
                            : appStatus === "REJECTED"
                            ? "bg-rose-600 text-white ring-rose-300"
                            : "bg-muted border-2 border-border text-muted-foreground"
                        }`}>
                          {appStatus === "APPROVED" ? "✓" : appStatus === "REJECTED" ? "✕" : "4"}
                        </div>
                        <span className={`text-xs font-bold mt-2 ${
                          appStatus === "APPROVED" ? "text-emerald-600" : appStatus === "REJECTED" ? "text-rose-600" : "text-muted-foreground"
                        }`}>
                          {appStatus === "APPROVED" ? "Approved" : appStatus === "REJECTED" ? "Rejected" : "Decision"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Account Overview & Helpdesk Info Card */}
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Registered Account Profile
                </h3>

                <div className="p-4 bg-muted/40 rounded-xl space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block font-medium">Registered Gmail / Email</span>
                    <strong className="font-mono text-sm text-foreground break-all">{userEmail || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Portal Status</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Account Active ✓</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Applied Position</span>
                    <strong className="text-primary">{appliedPosition || "Not Selected (Peon / Clerk)"}</strong>
                  </div>
                </div>

                <ul className="space-y-4 text-sm pt-2 border-t border-border">
                  <li className="flex gap-3">
                    <Clock className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="font-bold text-xs">Application Drive 2026</p>
                      <p className="text-[11px] text-muted-foreground">School & Mass Education Dept, Government of Odisha.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">Security & Verification</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {appStatus === "NONE" ? "OTP & Registered Account Verified ✓" : "Official Record Synced ✓"}
                      </p>
                    </div>
                  </li>
                </ul>

                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-xs space-y-1">
                  <p className="text-primary font-bold">Government Helpline</p>
                  <p className="text-muted-foreground">Recruitment Verification Cell, Bhubaneswar, Odisha.</p>
                </div>
              </div>
              
            </div>
          </>
        )}
      </main>
    </div>
  );
}
