"use client";

type StepState = "done" | "pending" | "rejected";

type StatusUsulanProps = {
  status: string;
};

function resolveStatusSteps(status: string) {
  const normalized = (status ?? "").toUpperCase();

  const isRejectedKabag = normalized === "REJECTED_KABAG";
  const isRejectedDekan = normalized === "REJECTED_DEKAN";
  const isRejectedWd2 = normalized === "REJECTED_WD2";

  const kabagDone =
    normalized === "PENDING_DEKAN" ||
    normalized === "PENDING_WD2" ||
    normalized === "PENDING_WAKIL_DEKAN_2" ||
    normalized === "APPROVED" ||
    normalized === "DISETUJUI" ||
    normalized === "COMPLETED" ||
    isRejectedDekan ||
    isRejectedWd2;

  const dekanDone =
    normalized === "PENDING_WD2" ||
    normalized === "PENDING_WAKIL_DEKAN_2" ||
    normalized === "APPROVED" ||
    normalized === "DISETUJUI" ||
    normalized === "COMPLETED" ||
    isRejectedWd2;

  const wd2Done = normalized === "APPROVED" || normalized === "DISETUJUI" || normalized === "COMPLETED";

  const steps: Array<{
    key: "KABAG" | "DEKAN" | "WD2";
    labelBase: string;
    state: StepState;
  }> = [
    {
      key: "KABAG",
      labelBase: "Bagian Umum",
      state: isRejectedKabag ? "rejected" : kabagDone ? "done" : "pending",
    },
    {
      key: "DEKAN",
      labelBase: "Dekan",
      state: isRejectedDekan ? "rejected" : dekanDone ? "done" : "pending",
    },
    {
      key: "WD2",
      labelBase: "Wakil Dekan 2",
      state: isRejectedWd2 ? "rejected" : wd2Done ? "done" : "pending",
    },
  ];

  return steps.map((step) => {
    if (step.state === "done") {
      return { ...step, label: `Disetujui ${step.labelBase}` };
    }
    if (step.state === "rejected") {
      return { ...step, label: `Ditolak ${step.labelBase}` };
    }
    return { ...step, label: step.labelBase };
  });
}

export default function StatusUsulan({ status }: StatusUsulanProps) {
  const steps = resolveStatusSteps(status);

  const badgeClass = (state: StepState) => {
    if (state === "done") return "border-emerald-600 bg-emerald-600 text-white";
    if (state === "rejected") return "border-rose-600 bg-rose-600 text-white";
    return "border-slate-200 bg-slate-100 text-slate-500";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {steps.map((step) => (
        <span
          key={step.key}
          className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold ${badgeClass(
            step.state
          )}`}
        >
          {step.label}
        </span>
      ))}
    </div>
  );
}
