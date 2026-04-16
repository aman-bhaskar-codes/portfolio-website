"use client";
import WizardLayout from '@/components/projects/wizard/WizardLayout';
import Link from "next/link";
import { X } from "lucide-react";

export default function NewProjectPage() {
    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm overflow-y-auto">
            <div className="absolute top-6 right-6 z-50">
                <Link href="/projects">
                    <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <X size={24} />
                    </button>
                </Link>
            </div>

            <div className="w-full min-h-screen">
                <WizardLayout />
            </div>
        </div>
    );
}
