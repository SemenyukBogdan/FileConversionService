type JobStatus = "queued" | "processing" | "done" | "failed" | "expired";

const STATUS_CONFIG: Record<JobStatus, { label: string; className: string }> = {
  queued: {
    label: "Queued",
    className: "bg-slate-100 text-slate-700",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-700",
  },
  done: {
    label: "Done",
    className: "bg-emerald-100 text-emerald-700",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700",
  },
  expired: {
    label: "Expired",
    className: "bg-zinc-100 text-zinc-600",
  },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
}
