"use client";
import { ArrowRight, Image as ImageIcon, Upload } from "lucide-react";

export default function StepMediaUpload({ setStep, projectData, setProjectData }: any) {

    // Note: For simplicity, we assume file inputs are handled in the final publish or we'd upload efficiently here.
    // Given the structure, we'll store files in state (projectData) and upload on 'Publish'.
    // However, transferring File objects through state is fine for this wizard.

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setProjectData((prev: any) => ({ ...prev, coverFile: e.target.files![0] }));
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setProjectData((prev: any) => ({ ...prev, galleryFiles: Array.from(e.target.files!) }));
        }
    };

    return (
        <div className="bg-[#0a0a0f]/90 border border-white/10 p-12 rounded-3xl backdrop-blur-xl shadow-2xl max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Visual Assets</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="space-y-4">
                    <label className="text-sm uppercase tracking-wider text-neutral-500 font-bold block">Cover Image</label>
                    <div className="relative group border-2 border-dashed border-white/10 rounded-2xl hover:border-violet-500/50 transition-colors bg-white/[0.02] aspect-video flex flex-col items-center justify-center">
                        <input type="file" onChange={handleCoverChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        {projectData.coverFile ? (
                            <div className="text-violet-400 font-medium">{projectData.coverFile.name}</div>
                        ) : (
                            <>
                                <ImageIcon className="w-12 h-12 text-neutral-600 mb-2" />
                                <span className="text-neutral-500 text-sm">Drop Cover Image</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-sm uppercase tracking-wider text-neutral-500 font-bold block">Gallery</label>
                    <div className="relative group border-2 border-dashed border-white/10 rounded-2xl hover:border-violet-500/50 transition-colors bg-white/[0.02] aspect-video flex flex-col items-center justify-center">
                        <input type="file" multiple onChange={handleGalleryChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        {projectData.galleryFiles ? (
                            <div className="text-violet-400 font-medium">{projectData.galleryFiles.length} files selected</div>
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-neutral-600 mb-2" />
                                <span className="text-neutral-500 text-sm">Drop Screenshots</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button onClick={() => setStep(2)} className="px-6 py-3 text-neutral-400 hover:text-white">Back</button>
                <button onClick={() => setStep(4)} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-2">
                    Review & Publish <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
