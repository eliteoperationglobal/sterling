"use client";

import { useEffect, useState } from "react";

export default function CancelRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/cancel-requests");
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    console.log("APPROVE CLICKED:", id);   // ⭐ add this

    try {
      const res = await fetch("/api/admin/cancel-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });

      const data = await res.json();
      console.log("API RESPONSE:", data);   // ⭐ add this

      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cancel Requests</h1>
        <p className="text-gray-500">Review and approve policy cancel requests</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        {/* Table */}
        <table className="w-full">
          <thead className="bg-slate-100 text-left text-sm text-gray-600">
            <tr>
              <th className="p-4">Submission</th>
              <th className="p-4">Requested At</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="p-10 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && requests.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-gray-500">
                  No cancel requests
                </td>
              </tr>
            )}

            {requests.map((r) => (
              <tr key={r._id} className="border-t hover:bg-slate-50">
                <td className="p-4 font-medium">
                  {r.submissionId?.clientContact?.name || "N/A"}
                </td>

                <td className="p-4 text-gray-500">
                  {new Date(r.createdAt).toLocaleString()}
                </td>

                <td className="p-4">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                    {r.status}
                  </span>
                </td>

                <td className="p-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      approve(r._id);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
                  >
                    Approve Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}