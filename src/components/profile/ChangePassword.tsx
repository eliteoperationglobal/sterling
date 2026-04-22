import { useState } from "react";
import { Lock, Loader2, CheckCircle, ShieldAlert } from "lucide-react";

export default function ChangePassword() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to change password");

            setSuccess(true);
            setFormData({ oldPassword: "", newPassword: "" });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#ECEAE7] p-4 md:p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-[#F3F0ED] flex items-center justify-center">
                    <Lock className="w-6 h-6 text-[#9A8B7A]" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#2D2D2D]">Security Settings</h2>
                    <p className="text-sm text-gray-500">Update your account password</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Current Password</label>
                    <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formData.oldPassword}
                        onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                        className="w-full px-5 py-3 rounded-xl border border-[#ECEAE7] bg-[#F9F8F7] focus:ring-2 focus:ring-[#9A8B7A]/20 focus:border-[#9A8B7A] transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                    <input
                        type="password"
                        required
                        placeholder="Minimum 8 characters"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full px-5 py-3 rounded-xl border border-[#ECEAE7] bg-[#F9F8F7] focus:ring-2 focus:ring-[#9A8B7A]/20 focus:border-[#9A8B7A] transition-all"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#9A8B7A] text-white font-bold hover:bg-[#837667] transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? "Password Updated!" : "Update Password"}
                        {success && <CheckCircle className="w-4 h-4" />}
                    </button>

                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-red-500 text-sm font-medium animate-[shake_.2s_ease]">
                            <ShieldAlert className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
