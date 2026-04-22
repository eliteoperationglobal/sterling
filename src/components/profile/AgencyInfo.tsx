import { Mail, Phone, MapPin, Building2 } from "lucide-react";

interface AgencyInfoProps {
    agency: {
        name: string;
        email: string;
        phone: string;
        address: {
            street: string;
            city: string;
            state: string;
            zip: string;
        };
    };
}

export default function AgencyInfo({ agency }: AgencyInfoProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-8 border border-[#ECEAE7]">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-[#F3F0ED] flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#9A8B7A]" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#2D2D2D]">Agency Information</h2>
                    <p className="text-sm text-gray-500">Your agency contact and location details</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 w-8 h-8 rounded-lg bg-[#F9F8F7] flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-[#9A8B7A]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Agency Name</p>
                            <p className="text-[#2D2D2D] font-medium">{agency.name}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 w-8 h-8 rounded-lg bg-[#F9F8F7] flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-[#9A8B7A]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                            <p className="text-[#2D2D2D] font-medium">{agency.email}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 w-8 h-8 rounded-lg bg-[#F9F8F7] flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4 text-[#9A8B7A]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                            <p className="text-[#2D2D2D] font-medium">{agency.phone}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 w-8 h-8 rounded-lg bg-[#F9F8F7] flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-[#9A8B7A]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Business Address</p>
                            <p className="text-[#2D2D2D] font-medium">
                                {agency.address.street}<br />
                                {agency.address.city}, {agency.address.state} {agency.address.zip}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
