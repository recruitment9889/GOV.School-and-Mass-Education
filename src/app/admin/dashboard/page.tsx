"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, FileText, CheckCircle, XCircle, TrendingUp, BarChart3, Search, Edit3, X, Save, Mail, UserCheck, Download, Trash2, Key, ShieldCheck, Check, Printer, Eye, Image as ImageIcon, FileCheck, ExternalLink, LogOut } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApplications: 0,
    applicationsToday: 0,
    submittedCount: 0,
    underReviewCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  });

  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Edit Modal State
  const [editingApp, setEditingApp] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("SUBMITTED");
  const [remarks, setRemarks] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  // Lightbox Preview Modal State (Images or PDFs)
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string; isPdf: boolean } | null>(null);

  const handleAdminLogout = () => {
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
    }
    window.location.href = "/";
  };

  const handlePurgeAllData = async () => {
    if (!confirm("⚠️ CAUTION: Are you sure you want to PERMANENTLY DELETE ALL uploaded files, user accounts, and submitted applications from the database?")) return;
    try {
      const res = await fetch("/api/admin/applications?purge=all", {
        method: "DELETE",
      });
      if (res.ok) {
        alert("All uploaded files and applications have been successfully purged!");
        fetchData();
      }
    } catch (e) {
      console.error("Purge failed:", e);
    }
  };

  const downloadDocument = async (fileUrl: string, fileName: string) => {
    try {
      let blob: Blob;
      if (fileUrl.startsWith("data:")) {
        const parts = fileUrl.split(";base64,");
        const contentType = parts[0].replace("data:", "");
        const raw = window.atob(parts[1] || "");
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        blob = new Blob([uInt8Array], { type: contentType });
      } else {
        const res = await fetch(fileUrl);
        blob = await res.blob();
      }
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(fileUrl, "_blank");
    }
  };

  const fetchData = async () => {
    try {
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setCategoryBreakdown(statsData.categoryBreakdown || []);
      }

      const appsRes = await fetch("/api/admin/applications");
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData.applications || []);
        setRegisteredUsers(appsData.registeredUsers || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // One-Click Status Update (Approve / Reject)
  const handleQuickStatusUpdate = async (applicationId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          status,
          remarks: `Application ${status.toLowerCase()} by Admin`,
          adminId: "super-admin-id",
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Quick status update failed:", err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingApp) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: editingApp.id,
          status: newStatus,
          remarks,
          newPassword: newPassword.trim() || undefined,
          adminId: "super-admin-id",
        }),
      });

      if (res.ok) {
        setEditingApp(null);
        setNewPassword("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update application:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      const res = await fetch(`/api/admin/applications?id=${applicationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEditingApp(null);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this registered user account?")) return;

    try {
      const res = await fetch(`/api/admin/applications?userId=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const getDocumentLabel = (type: string) => {
    switch (type) {
      case "PHOTO":
        return "📷 Passport Size Photo";
      case "SIGNATURE":
        return "✍️ Specimen Signature";
      case "AADHAAR":
        return "🪪 Aadhaar Card (Front/Back)";
      case "PAN":
        return "💳 PAN Card";
      case "DEGREE_CERT":
        return "🎓 Educational Degree / Marksheet";
      case "CASTE_CERT":
        return "📜 Caste / Resident Certificate";
      case "OTHER":
        return "📄 Supporting Attachment Document";
      default:
        return `📄 ${type.replace(/_/g, " ")}`;
    }
  };

  const isPdfFile = (url: string) => {
    if (!url) return false;
    return url.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes("pdf");
  };

  // Generate & Download Comprehensive Full Official Application Dossier PDF Report WITHOUT DUMMY DATA
  const downloadApplicationPDF = (app: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const pd = app.personalDetails || null;
    const edu = (app.educationDetails && app.educationDetails[0]) || {};
    const docs = app.documents || [];

    const hasSubmittedDetails = !!pd && !!pd.firstName;

    const fullName = hasSubmittedDetails
      ? `${pd.firstName} ${pd.lastName}`
      : (app.user?.email ? app.user.email.split("@")[0].toUpperCase() + " (Registered User)" : "APPLICANT");

    const categoryName = app.category?.name || "Pending Selection";

    const docItems = [
      { name: "Passport Photo", types: ["PHOTO"] },
      { name: "Signature Image", types: ["SIGNATURE"] },
      { name: "Aadhaar Card Document", types: ["AADHAAR"] },
      { name: "Marksheet Certificate", types: ["MARKSHEET_CERTIFICATE", "DEGREE_CERT"] },
      { name: "Educational Certificate", types: ["EDUCATIONAL_CERTIFICATE", "DEGREE_CERT"] },
      { name: "Thumb Impression", types: ["THUMB_IMPRESSION"] },
      { name: "Bank Passbook Copy", types: ["BANK_PASSBOOK"] },
      { name: "PAN Card Document", types: ["PAN_IMAGE", "PAN"] },
      { name: "Caste Certificate", types: ["CASTE_CERTIFICATE", "CASTE_CERT"] },
      { name: "Computer PGDCA Certificate", types: ["COMPUTER_PGDCA", "DEGREE_CERT"] },
    ];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Application Report - ${app.applicationNo}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.4; font-size: 12px; background: #fff; }
            .header-table { width: 100%; border-bottom: 3px double #1e3a8a; padding-bottom: 10px; margin-bottom: 15px; }
            .govt-title { font-size: 22px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; }
            .dept-title { font-size: 13px; font-weight: 700; color: #475569; }
            .report-title { font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; text-align: center; margin: 12px 0; background: #f1f5f9; padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; }
            .section { border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; padding: 14px; background: #fafafa; page-break-inside: avoid; }
            .section-header { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; letter-spacing: 0.5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
            .label { color: #64748b; font-weight: 600; font-size: 10px; text-transform: uppercase; display: block; }
            .value { color: #0f172a; font-weight: 700; font-size: 12px; }
            .badge { display: inline-block; padding: 3px 8px; background: #1e3a8a; color: #fff; font-weight: bold; border-radius: 4px; font-size: 10px; }
            .status-badge { display: inline-block; padding: 3px 8px; background: #dcfce7; color: #15803d; font-weight: bold; border-radius: 4px; border: 1px solid #86efac; font-size: 10px; }
            
            table.doc-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
            table.doc-table th, table.doc-table td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            table.doc-table th { background: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 10px; }
            .pdf-tag { display: inline-block; padding: 2px 6px; background: #fee2e2; color: #991b1b; font-weight: bold; border-radius: 3px; font-size: 9px; }
            .img-tag { display: inline-block; padding: 2px 6px; background: #e0e7ff; color: #3730a3; font-weight: bold; border-radius: 3px; font-size: 9px; }
            
            .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; }
            .photo-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #ffffff; text-align: center; }
            .photo-title { font-size: 10px; font-weight: 700; color: #1e3a8a; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
            .photo-img { width: 100%; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1; }
            .pdf-box { width: 100%; height: 100px; background: #fef2f2; border: 1px dashed #f87171; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #991b1b; font-weight: bold; font-size: 11px; text-decoration: none; }
            
            .declaration { margin-top: 15px; padding: 10px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; font-size: 10px; color: #92400e; }
            .footer { margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
            .sig-box { text-align: right; margin-top: 30px; font-weight: bold; font-size: 11px; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="govt-title">Government of Odisha</div>
                <div class="dept-title">School & Mass Education Department</div>
                <div style="font-size: 10px; color: #64748b;">Official Online Recruitment Drive 2026</div>
              </td>
              <td style="text-align: right;">
                <span class="badge">POSITION: ${categoryName.toUpperCase()}</span>
              </td>
            </tr>
          </table>

          <div class="report-title">Applicant Dossier & Verification Report</div>

          <!-- Section 1: Application Reference -->
          <div class="section">
            <div class="section-header">1. Application Reference & Status</div>
            <div class="grid">
              <div><span class="label">Application Number</span><span class="value" style="color: #1e3a8a; font-family: monospace; font-size: 13px;">${app.applicationNo}</span></div>
              <div><span class="label">Applied Position</span><span class="value">${categoryName}</span></div>
              <div><span class="label">Application Status</span><span class="status-badge">${app.status}</span></div>
              <div><span class="label">Identity Verification</span><span class="value" style="color: #15803d;">${hasSubmittedDetails ? "VERIFIED APPLICANT ✓" : "REGISTRATION ONLY"}</span></div>
              <div><span class="label">Registration Date</span><span class="value">${new Date(app.createdAt).toLocaleDateString()}</span></div>
              <div><span class="label">Applied Department</span><span class="value">School & Mass Education Dept.</span></div>
            </div>
          </div>

          <!-- Section 2: Personal Details -->
          <div class="section">
            <div class="section-header">2. Personal & Identification Details</div>
            <div class="grid">
              <div><span class="label">Full Applicant Name</span><span class="value">${fullName}</span></div>
              <div><span class="label">Registered Email / Gmail</span><span class="value" style="font-family: monospace;">${pd?.email || app.user?.email || "N/A"}</span></div>
              <div><span class="label">Mobile Number</span><span class="value">${app.user?.phoneNumber || pd?.phoneNumber || "N/A"}</span></div>
              <div><span class="label">Date of Birth</span><span class="value" style="font-family: monospace;">${pd?.dateOfBirth ? new Date(pd.dateOfBirth).toISOString().split('T')[0] : "Pending Form Submission"}</span></div>
              <div><span class="label">Aadhaar Card Number</span><span class="value" style="font-family: monospace;">${pd?.aadhaarNumber || "Pending Form Submission"}</span></div>
              <div><span class="label">PAN Card Number</span><span class="value" style="font-family: monospace; text-transform: uppercase;">${pd?.panNumber || "Pending Form Submission"}</span></div>
              <div><span class="label">Gender</span><span class="value">${pd?.gender || "Pending"}</span></div>
              <div><span class="label">District</span><span class="value">${pd?.district || "Pending"}</span></div>
              <div><span class="label">Block / Tehsil</span><span class="value">${pd?.block || "Pending"}</span></div>
              <div><span class="label">Applying for Which School</span><span class="value" style="color: #1e3a8a; font-weight: 800;">${pd?.schoolName || "Pending"}</span></div>
              <div><span class="label">Residential Address</span><span class="value">${pd?.address || "Pending Form Submission"}</span></div>
            </div>
          </div>

          <!-- Section 3: Educational Qualification -->
          <div class="section">
            <div class="section-header">3. Educational Qualification & Board Details</div>
            <div class="grid">
              <div><span class="label">Highest Qualification Name</span><span class="value">${edu.degree || pd?.highestQualification || "Pending Form Submission"}</span></div>
              <div><span class="label">School / Board / University</span><span class="value">${edu.institution || "Pending Form Submission"}</span></div>
              <div><span class="label">Year of Passing</span><span class="value">${edu.yearOfPassing || "Pending"}</span></div>
              <div><span class="label">Percentage / CGPA Achieved</span><span class="value">${edu.percentage ? `${edu.percentage}%` : "Pending"}</span></div>
            </div>
          </div>

          <!-- Section 4: SUBMITTED UPLOADED PDF & IMAGE FILES LIST -->
          <div class="section">
            <div class="section-header">4. Submitted Uploaded Documents & PDF File Downloads</div>
            
            <table class="doc-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Document Name</th>
                  <th>File Format</th>
                  <th>Upload Status</th>
                  <th>Direct Download Link</th>
                </tr>
              </thead>
              <tbody>
                ${docItems.map((item, idx) => {
                  const uploadedDoc = docs.find((d: any) => item.types.includes(d.documentType) || d.documentType === item.name) || docs[idx];
                  const isPdf = uploadedDoc ? isPdfFile(uploadedDoc.fileUrl) : false;
                  return `
                    <tr>
                      <td>${idx + 1}</td>
                      <td><strong>${item.name}</strong></td>
                      <td>${uploadedDoc ? (isPdf ? '<span class="pdf-tag">📄 PDF Document</span>' : '<span class="img-tag">🖼️ Image File</span>') : '<span style="color:#94a3b8;">-</span>'}</td>
                      <td>${uploadedDoc ? '<span style="color:#15803d; font-weight:bold;">Uploaded ✓</span>' : '<span style="color:#94a3b8;">Not Uploaded</span>'}</td>
                      <td style="font-family: monospace; font-size: 10px;">
                        ${uploadedDoc ? `<a href="${uploadedDoc.fileUrl}" target="_blank" style="color:#1e3a8a; font-weight:bold;">Download ${item.name}</a>` : 'N/A'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="declaration">
            <strong>Applicant Declaration:</strong> I hereby certify that all information and uploaded PDF/image documents furnished for the position of <strong>${categoryName}</strong> under the School & Mass Education Department, Government of Odisha are authentic.
          </div>

          <div class="sig-box">
            Authorized Verification Officer<br/>
            <span style="font-size: 10px; font-weight: normal; color: #64748b;">Government of Odisha Recruitment Cell</span>
          </div>

          <div class="footer">
            <span>Generated on ${new Date().toLocaleString()}</span>
            <span>Official Portal Verification System • Govt of Odisha</span>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.applicationNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user?.phoneNumber?.includes(searchQuery) ||
      app.personalDetails?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.personalDetails?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || app.status === statusFilter;
    const matchesCategory = !categoryFilter || app.category?.name === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <img
              src="/odisha-logo.png"
              alt="Government of Odisha Seal"
              className="w-12 h-12 object-contain drop-shadow"
            />
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                Government of Odisha • School & Mass Education Department
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">Admin Live Dashboard & Applicant Portal</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData} 
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-xs font-medium"
            >
              Refresh Real-time Data
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live Supabase DB Sync
            </div>

            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Real Live Stats Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Registered Accounts", value: stats.totalUsers, icon: <Users className="text-blue-400" /> },
            { label: "Total Applications", value: stats.totalApplications, icon: <FileText className="text-indigo-400" /> },
            { label: "Submitted Today", value: stats.applicationsToday, icon: <TrendingUp className="text-emerald-400" /> },
            { label: "Under Review", value: stats.underReviewCount, icon: <UserCheck className="text-amber-400" /> },
            { label: "Approved Applications", value: stats.approvedCount, icon: <CheckCircle className="text-emerald-500" /> },
            { label: "Rejected Applications", value: stats.rejectedCount, icon: <XCircle className="text-rose-500" /> },
          ].map((stat, idx) => (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-zinc-800/50 rounded-lg">{stat.icon}</div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{loading ? "..." : stat.value}</h3>
              <p className="text-zinc-400 text-xs font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ONLY 2 Category Cards: Peon & Clerk */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Recruitment Position Applications Breakdown
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: "Peon", label: "🧹 Peon Applicants", color: "from-blue-600 to-indigo-600" },
              { name: "Clerk", label: "💼 Clerk Applicants", color: "from-purple-600 to-indigo-600" },
            ].map((pos) => {
              const catData = categoryBreakdown.find((c) => c.name === pos.name) || { count: 0, percent: 0 };
              return (
                <div key={pos.name} className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base">{pos.label}</span>
                    <span className="text-2xl font-extrabold text-indigo-400">{catData.count}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${pos.color} h-2 rounded-full transition-all duration-500`} 
                      style={{ width: `${Math.max(catData.percent, catData.count > 0 ? 10 : 0)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">Total submitted for {pos.name} position</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Applicant Master Portal Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Applicant Applications & Documents Master List</h2>
              <p className="text-xs text-zinc-400">View document photos & PDFs, download full reports, approve/reject applications, reset passwords, or remove accounts.</p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={handlePurgeAllData}
                className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="Delete all uploaded files and database records"
              >
                <Trash2 className="w-3.5 h-3.5" /> Purge All Saved Files
              </button>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Email, App #, Phone, Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 outline-none focus:border-indigo-500 w-64"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 outline-none"
              >
                <option value="">All Positions</option>
                <option value="Peon">Peon</option>
                <option value="Clerk">Clerk</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">App #</th>
                  <th className="p-3.5">Position</th>
                  <th className="p-3.5">Applicant & Target School</th>
                  <th className="p-3.5">Registered Gmail</th>
                  <th className="p-3.5">Mobile OTP</th>
                  <th className="p-3.5">Reg. Date & Time</th>
                  <th className="p-3.5">Status & Verification</th>
                  <th className="p-3.5">Submitted PDF & Image Files</th>
                  <th className="p-3.5 text-center">One-Click Decision</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-zinc-500">
                      No applications found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const hasSubmittedDetails = !!app.personalDetails && !!app.personalDetails.firstName;
                    return (
                      <tr key={app.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-400">{app.applicationNo}</td>
                        <td className="p-3.5">
                          {hasSubmittedDetails ? (
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              app.category?.name === "Clerk"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}>
                              {app.category?.name || "Peon"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 font-medium">
                              Not Selected Yet
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 space-y-0.5">
                          {hasSubmittedDetails ? (
                            <>
                              <div className="font-semibold text-zinc-100">{app.personalDetails.firstName} {app.personalDetails.lastName}</div>
                              <div className="text-[10px] text-zinc-400 font-mono">Dist: {app.personalDetails.district || 'Khordha'} | Block: {app.personalDetails.block || 'N/A'}</div>
                              <div className="text-[10px] text-indigo-300 font-semibold truncate max-w-[180px]">School: {app.personalDetails.schoolName || 'N/A'}</div>
                            </>
                          ) : (
                            <span className="text-zinc-500 text-[11px] italic font-normal">Pending Form Submission</span>
                          )}
                        </td>
                        <td className="p-3.5 text-zinc-300 font-mono">
                          {app.personalDetails?.email || app.user?.email || "N/A"}
                        </td>
                        <td className="p-3.5 text-zinc-400 font-mono">{app.user?.phoneNumber || "N/A"}</td>

                        {/* Registration Date & Exact Time Column */}
                        <td className="p-3.5 font-mono text-[11px]">
                          {app.createdAt ? (
                            <div>
                              <div className="font-semibold text-zinc-200">
                                {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                                ⏰ {new Date(app.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-600">N/A</span>
                          )}
                        </td>
                        <td className="p-3.5 space-y-1">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              app.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : app.status === "REJECTED"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : app.status === "SUBMITTED"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {hasSubmittedDetails ? app.status : "REGISTRATION ONLY"}
                          </span>
                        </td>

                        {/* Download Full PDF Report Only */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => downloadApplicationPDF(app)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                          >
                            <Printer className="w-4 h-4" /> Download Full PDF Report
                          </button>
                        </td>

                        {/* Working One-Click Approve & Reject Buttons */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleQuickStatusUpdate(app.id, "APPROVED")}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded font-bold text-xs transition-all shadow-sm ${
                                app.status === "APPROVED"
                                  ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                                  : "bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40"
                              }`}
                              title="Approve Application"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleQuickStatusUpdate(app.id, "REJECTED")}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded font-bold text-xs transition-all shadow-sm ${
                                app.status === "REJECTED"
                                  ? "bg-rose-600 text-white ring-2 ring-rose-400"
                                  : "bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40"
                              }`}
                              title="Reject Application"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>

                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingApp(app);
                              setNewStatus(app.status);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-md font-medium text-xs transition-colors"
                          >
                            <Edit3 className="w-3 h-3" /> Manage & Files
                          </button>

                          <button
                            onClick={() => handleDeleteApplication(app.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 rounded-md font-medium text-xs transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Registered Accounts Section */}
          <div className="pt-6 border-t border-zinc-800 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> All Registered User Accounts ({registeredUsers.length})
            </h3>
            
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 uppercase border-b border-zinc-800">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Registered Gmail</th>
                    <th className="p-3">Mobile Number</th>
                    <th className="p-3">Registered Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {registeredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 font-mono text-zinc-500">{u.id.substring(0, 8)}...</td>
                      <td className="p-3 font-semibold text-indigo-300 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" /> {u.email}
                      </td>
                      <td className="p-3 text-zinc-400 font-mono">{u.phoneNumber}</td>
                      <td className="p-3 text-zinc-400">{new Date(u.registeredAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        {u.hasSubmitted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Application Submitted ✓
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Registered Account
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 rounded-md font-medium text-xs transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remove User
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Admin Manage Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 sticky top-0 bg-zinc-900 z-10">
              <div>
                <h3 className="font-bold text-lg">Applicant Dossier & Document Uploads</h3>
                <p className="text-xs text-zinc-400 font-mono">{editingApp.applicationNo}</p>
              </div>
              <button
                onClick={() => setEditingApp(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1.5">
                <p><span className="text-zinc-500">Applicant:</span> <strong>{editingApp.personalDetails?.firstName ? `${editingApp.personalDetails.firstName} ${editingApp.personalDetails.lastName || ''}` : 'Pending Form Submission'}</strong></p>
                <p><span className="text-zinc-500">Registered Email:</span> <strong className="font-mono text-zinc-200">{editingApp.user?.email || editingApp.personalDetails?.email}</strong></p>
                <p><span className="text-zinc-500">Registered Mobile:</span> <strong className="font-mono text-zinc-200">{editingApp.user?.phoneNumber || editingApp.personalDetails?.phoneNumber}</strong></p>
                <p><span className="text-zinc-500">Registration Date & Time:</span> <strong className="font-mono text-amber-400">📅 {new Date(editingApp.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ⏰ {new Date(editingApp.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</strong></p>
                <p><span className="text-zinc-500">Account Password Status:</span> <strong className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{editingApp.user?.passwordHash ? "•••••••• (Encrypted Hash Stored)" : "Gmail Auth Session"}</strong></p>
                <p><span className="text-zinc-500">District & Block:</span> <strong className="text-zinc-200">{editingApp.personalDetails?.district || 'Khordha'} (Block: {editingApp.personalDetails?.block || 'N/A'})</strong></p>
                <p><span className="text-zinc-500">Target School Name:</span> <strong className="text-indigo-400">{editingApp.personalDetails?.schoolName || 'N/A'}</strong></p>
                <p><span className="text-zinc-500">Category:</span> <strong className="text-indigo-400">{editingApp.category?.name || 'Pending Selection'}</strong></p>
              </div>

              {/* Download Printable Application PDF */}
              <div>
                <button
                  onClick={() => downloadApplicationPDF(editingApp)}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors shadow-md text-xs"
                >
                  <Printer className="w-4 h-4" /> Download Official Full PDF Report
                </button>
              </div>

              {/* Uploaded Files & PDFs List */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="font-bold text-zinc-200 flex items-center gap-2 text-sm">
                  <FileCheck className="w-4 h-4 text-indigo-400" /> Submitted Certificates (PDFs & Image Files)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {editingApp.documents && editingApp.documents.length > 0 ? (
                    Array.from(
                      editingApp.documents
                        .reduce((map: Map<string, any>, doc: any) => {
                          map.set(doc.documentType, doc);
                          return map;
                        }, new Map<string, any>())
                        .values()
                    ).map((doc: any) => {
                      const pdf = isPdfFile(doc.fileUrl);
                      const label = getDocumentLabel(doc.documentType);
                      return (
                        <div
                          key={doc.id}
                          className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between hover:border-indigo-500 transition-all"
                        >
                          <div className="space-y-0.5 truncate pr-2">
                            <span className="font-bold text-zinc-200 block text-[11px] truncate flex items-center gap-1.5">
                              {label}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono block truncate">
                              {pdf ? "PDF Document" : "Image File"} • {doc.documentType}
                            </span>
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => setPreviewFile({ url: doc.fileUrl, title: `${label} - ${editingApp.applicationNo}`, isPdf: pdf })}
                              className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </button>
                            <button
                              onClick={() => downloadDocument(doc.fileUrl, `${editingApp.applicationNo}_${doc.documentType}`)}
                              className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-zinc-500 text-xs col-span-2">
                      No document files uploaded yet for this applicant.
                    </div>
                  )}
                </div>
              </div>

              {/* Change Application Status */}
              <div className="space-y-1 pt-2 border-t border-zinc-800">
                <label className="font-semibold text-zinc-300">Change Application Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 outline-none focus:border-indigo-500"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {/* Admin Reset Password */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" /> Change Applicant Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password for applicant (Leave blank to keep unchanged)"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Admin Remarks / Notes</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks for approval or rejection..."
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 outline-none focus:border-indigo-500 min-h-[60px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                onClick={() => handleDeleteApplication(editingApp.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold hover:bg-rose-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Application
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 border border-zinc-800 rounded-lg text-xs font-medium hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-500 shadow-md disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Lightbox / Viewer Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-zinc-100">{previewFile.title}</h4>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              {previewFile.isPdf ? (
                <div className="text-center space-y-4 py-10">
                  <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h5 className="font-bold text-lg text-zinc-100">PDF Document File</h5>
                    <p className="text-xs text-zinc-400 font-mono mt-1 max-w-md mx-auto">{previewFile.url}</p>
                  </div>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg"
                  >
                    <Download className="w-4 h-4" /> Download / Open PDF File
                  </a>
                </div>
              ) : (
                <img src={previewFile.url} alt={previewFile.title} className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl" />
              )}
            </div>
            <div className="flex justify-end gap-3">
              <a
                href={previewFile.url}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-indigo-400" /> Download File
              </a>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-500"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
