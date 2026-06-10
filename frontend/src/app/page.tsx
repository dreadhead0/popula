"use client";

import {
  AlertCircle,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  Database,
  FileSpreadsheet,
  HelpCircle,
  Home as HomeIcon,
  Layers3,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

type UploadSummary = {
  status: "success";
  dataset_id: string;
  total_rows_received: number;
  rows_inserted: number;
  rows_skipped: number;
  skip_reasons: Record<string, number>;
};

type UploadState = "idle" | "ready" | "uploading" | "success" | "error";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

const sidebarItems = [
  { label: "Home", icon: HomeIcon },
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Data Sources", icon: Database, active: true },
  { label: "AI Analyst", icon: Bot },
  { label: "Smart Engine", icon: Sparkles },
  { label: "Reports", icon: BarChart3 },
  { label: "Templates", icon: Layers3 },
  { label: "Industry Settings", icon: Building2 },
  { label: "Team", icon: Users },
  { label: "Settings", icon: Settings },
  { label: "Help & Contact", icon: HelpCircle },
];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${sizes[index]}`;
};

const isCsvFile = (file: File) => {
  return file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
};

const getRestoredDatasetMessage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedDatasetId = window.localStorage.getItem("popula.datasetId");

  if (!storedDatasetId) {
    return null;
  }

  return `Last uploaded dataset restored: ${storedDatasetId.slice(0, 8)}...`;
};

export default function Home() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(
    null
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(
    getRestoredDatasetMessage
  );

  const selectedFileMeta = useMemo(() => {
    if (!selectedFile) return null;

    return {
      name: selectedFile.name,
      size: formatBytes(selectedFile.size),
    };
  }, [selectedFile]);

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadState("idle");
    setUploadProgress(0);
    setUploadSummary(null);
    setFeedbackMessage(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const validateAndSetFile = (file: File) => {
    setUploadSummary(null);
    setUploadProgress(0);

    if (!isCsvFile(file)) {
      setSelectedFile(null);
      setUploadState("error");
      setFeedbackMessage("Only CSV files are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setUploadState("error");
      setFeedbackMessage("CSV file must not be larger than 100MB.");
      return;
    }

    setSelectedFile(file);
    setUploadState("ready");
    setFeedbackMessage("CSV file ready for upload.");
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    validateAndSetFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    validateAndSetFile(file);
  };

  const uploadDataset = async () => {
    if (!selectedFile) {
      setUploadState("error");
      setFeedbackMessage("Select a CSV file before uploading.");
      return;
    }

    setUploadState("uploading");
    setUploadProgress(0);
    setFeedbackMessage("Uploading and processing dataset...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", `${API_BASE_URL}/upload`);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;

        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      };

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText) as
            | UploadSummary
            | { status: "error"; message: string };

          if (
            xhr.status >= 200 &&
            xhr.status < 300 &&
            response.status === "success"
          ) {
            setUploadSummary(response);
            setUploadState("success");
            setUploadProgress(100);
            setFeedbackMessage("Dataset uploaded successfully.");

            window.localStorage.setItem(
              "popula.datasetId",
              response.dataset_id
            );

            resolve();
            return;
          }

          setUploadState("error");
          setFeedbackMessage(
            "message" in response
              ? response.message
              : "Upload failed. Please try again."
          );
        } catch {
          setUploadState("error");
          setFeedbackMessage("Upload failed. The server returned invalid data.");
        }

        resolve();
      };

      xhr.onerror = () => {
        setUploadState("error");
        setFeedbackMessage("Network error. Check that the backend is running.");
        resolve();
      };

      xhr.send(formData);
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          aria-label="Primary navigation"
        >
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <div>
                <p className="text-lg font-semibold text-[#0B5F9F]">Popula</p>
                <p className="text-xs text-slate-500">Analytics workspace</p>
              </div>

              <button
                type="button"
                className="rounded-md border border-slate-200 p-2 text-slate-600 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="flex flex-col gap-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${item.active
                          ? "border-[#0B5F9F] bg-[#E6F2FB] text-[#084B7F]"
                          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-slate-200 p-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-900">
                  Upload progress
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Build your first analysis by uploading a clean demographic CSV.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {isSidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar overlay"
          />
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
            <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
              <button
                type="button"
                className="rounded-md border border-slate-200 p-2 text-slate-700 lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>

              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <Search size={18} className="text-slate-400" />
                <span className="sr-only">Search workspace</span>
                <input
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Search datasets, reports, or analysis..."
                />
              </label>

              <button
                type="button"
                className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 md:flex"
              >
                Demo workspace
                <ChevronDown size={16} />
              </button>

              <button
                type="button"
                className="hidden rounded-lg border border-[#0B5F9F] bg-[#0B5F9F] px-3 py-2 text-sm font-medium text-white md:block"
              >
                Ask ZIO
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-slate-700"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
              <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0B5F9F]">
                    Data Sources
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                    Upload and manage your demographic datasets
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Add a CSV dataset, let Popula validate the rows, then use
                    the visual query builder and charts to create your first
                    analysis.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                    CSV only
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                    Max 100MB
                  </span>
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
                <section className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-950">
                      Upload Data
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Drag and drop or click to upload a demographic CSV file.
                    </p>
                  </div>

                  <div className="p-5">
                    <label
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleDrop}
                      className="flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-[#0B5F9F] hover:bg-[#E6F2FB]"
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="sr-only"
                        onChange={handleFileInput}
                      />

                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#0B5F9F]">
                        <UploadCloud size={28} />
                      </span>

                      <span className="mt-4 text-base font-semibold text-slate-950">
                        Drop your CSV file here
                      </span>
                      <span className="mt-1 text-sm text-slate-500">
                        or click to browse from your device
                      </span>

                      <span className="mt-5 rounded-lg border border-[#0B5F9F] bg-[#0B5F9F] px-4 py-2 text-sm font-medium text-white">
                        Select CSV File
                      </span>

                      <span className="mt-4 text-xs text-slate-500">
                        Required columns: id, full_name, gender, age, country,
                        income, purchased_category, created_at
                      </span>
                    </label>

                    {selectedFileMeta ? (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#0B5F9F]">
                              <FileSpreadsheet size={20} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-950">
                                {selectedFileMeta.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {selectedFileMeta.size}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={resetUpload}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                              disabled={uploadState === "uploading"}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={uploadDataset}
                              disabled={uploadState === "uploading"}
                              className="rounded-lg border border-[#0B5F9F] bg-[#0B5F9F] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                            >
                              {uploadState === "uploading"
                                ? "Uploading..."
                                : "Upload Dataset"}
                            </button>
                          </div>
                        </div>

                        {uploadState === "uploading" ||
                          uploadState === "success" ? (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Upload progress</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#0B5F9F] transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {feedbackMessage ? (
                      <div
                        className={`mt-4 flex items-start gap-2 rounded-xl border p-4 text-sm ${uploadState === "error"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : uploadState === "success"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                      >
                        {uploadState === "error" ? (
                          <AlertCircle size={18} />
                        ) : uploadState === "success" ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <FileSpreadsheet size={18} />
                        )}
                        <p>{feedbackMessage}</p>
                      </div>
                    ) : null}
                  </div>
                </section>

                <aside className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-950">
                      Connect Database
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Future direct integrations for live data sources.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 p-5">
                    {["PostgreSQL", "MySQL", "Google Sheets"].map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {item}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
                          Soon
                        </span>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      Request Integration
                    </button>
                  </div>
                </aside>
              </section>

              {uploadSummary ? (
                <section className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-950">
                      Ingestion Summary
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Dataset ID: {uploadSummary.dataset_id}
                    </p>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Rows received</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {uploadSummary.total_rows_received.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm text-emerald-700">Rows inserted</p>
                      <p className="mt-2 text-2xl font-semibold text-emerald-800">
                        {uploadSummary.rows_inserted.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm text-amber-700">Rows skipped</p>
                      <p className="mt-2 text-2xl font-semibold text-amber-800">
                        {uploadSummary.rows_skipped.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-950">
                      Skip reasons
                    </h3>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      {Object.entries(uploadSummary.skip_reasons).map(
                        ([reason, count]) => (
                          <div
                            key={reason}
                            className="rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              {reason.replaceAll("_", " ")}
                            </p>
                            <p className="mt-2 text-xl font-semibold text-slate-950">
                              {count}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}