interface StatusBadgeProps {
  status: string;
  type?: "submission" | "quote" | "signature" | "payment";
}

export default function StatusBadge({ status, type = "submission" }: StatusBadgeProps) {
  const getBadgeStyles = () => {
    if (type === "signature") {
      const signatureColors: Record<string, string> = {
        GENERATED: "bg-gray-100 text-gray-800",
        SENT: "bg-blue-100 text-blue-800",
        SIGNED: "bg-green-100 text-green-800",
        FAILED: "bg-red-100 text-red-800",
      };
      return signatureColors[status] || "bg-gray-100 text-gray-800";
    }

    if (type === "payment") {
      const paymentColors: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800",
        PAID: "bg-green-100 text-green-800",
        FAILED: "bg-red-100 text-red-800",
      };
      return paymentColors[status] || "bg-gray-100 text-gray-800";
    }

    const colors: Record<string, string> = {
      SUBMITTED: "bg-gray-100 text-gray-800",
      ROUTED: "bg-blue-100 text-blue-800",
      QUOTED: "bg-purple-100 text-purple-800",
      APPROVED: "bg-green-100 text-green-800",
      POSTED: "bg-yellow-100 text-yellow-800",
      ENTERED: "bg-orange-100 text-orange-800",
      BIND_REQUESTED: "bg-indigo-100 text-indigo-800",
      BOUND: "bg-emerald-100 text-emerald-800",
      PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-800",
    };

    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeStyles()}`}
    >
      {status}
    </span>
  );
}



