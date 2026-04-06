import { useState } from "react";
import { UserPlus, Mail, Shield, User as UserIcon, Loader2, X } from "lucide-react";

interface Agent {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface AgentListProps {
    agents: Agent[];
    isAdmin: boolean;
    onAgentAdded: () => void;
}

export default function AgentList({ agents, isAdmin, onAgentAdded }: AgentListProps) {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "agency_user",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to add agent");

            setSuccess(true);
            onAgentAdded();
            setTimeout(() => {
                setShowModal(false);
                setFormData({ name: "", email: "", password: "", role: "agency_user" });
                setSuccess(false);
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#ECEAE7] overflow-hidden">
            <div className="px-8 py-6 border-b border-[#ECEAE7] flex items-center justify-between bg-[#F9F8F7]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#ECEAE7] shadow-sm">
                        <UserIcon className="w-5 h-5 text-[#9A8B7A]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[#2D2D2D]">Agents Management</h2>
                        <p className="text-xs text-gray-500 font-medium">{agents.length} active agents in your team</p>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#9A8B7A] text-white text-sm font-semibold hover:bg-[#837667] transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Agent
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#F9F8F7] text-gray-400 uppercase text-[11px] font-bold tracking-widest border-b border-[#ECEAE7]">
                        <tr>
                            <th className="px-8 py-4">Agent Name</th>
                            <th className="px-8 py-4">Email Address</th>
                            <th className="px-8 py-4">Access Role</th>
                            <th className="px-8 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECEAE7]">
                        {agents.map((agent: any) => (
                            <tr key={agent._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-5 font-semibold text-[#2D2D2D]">{agent.name}</td>
                                <td className="px-8 py-5 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        {agent.isVirtual ? <span className="text-xs italic text-gray-400">Not registered</span> : agent.email}
                                    </div>
                                </td>
                                <td className="px-8 py-5 uppercase text-[11px] font-bold">
                                    <span className={`px-2.5 py-1 rounded-full ${agent.role === 'agency_admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {agent.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    {agent.isVirtual ? (
                                        <>
                                            <span className="inline-flex w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                                            <span className="text-gray-400 font-semibold text-xs">Guest</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                                            <span className="text-emerald-600 font-semibold text-xs">Active</span>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_.2s_ease]">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 border border-[#ECEAE7]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-[#2D2D2D]">Add New Agent</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-3 rounded-xl border border-[#ECEAE7] bg-[#F9F8F7] focus:ring-2 focus:ring-[#9A8B7A]/20 focus:border-[#9A8B7A] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-3 rounded-xl border border-[#ECEAE7] bg-[#F9F8F7] focus:ring-2 focus:ring-[#9A8B7A]/20 focus:border-[#9A8B7A] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Initial Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Minimum 8 characters"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-5 py-3 rounded-xl border border-[#ECEAE7] bg-[#F9F8F7] focus:ring-2 focus:ring-[#9A8B7A]/20 focus:border-[#9A8B7A] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Access Role</label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-5 py-3 rounded-xl border border-[#ECEAE7] bg-[#F9F8F7] focus:ring-2 focus:ring-[#9A8B7A]/20 focus:border-[#9A8B7A] transition-all outline-none"
                                >
                                    <option value="agency_user">Agency User (Standard)</option>
                                    <option value="agency_admin">Agency Admin (Full Access)</option>
                                </select>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#9A8B7A] text-white font-bold hover:bg-[#837667] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? "Agent Added!" : "Confirm & Add Agent"}
                                </button>
                                {error && <p className="text-red-500 text-xs mt-3 text-center font-medium">{error}</p>}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
