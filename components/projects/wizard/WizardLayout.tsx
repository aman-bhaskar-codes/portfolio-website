"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StepSelector from "./StepSelector";
import StepDescribeIdea from "./StepDescribeIdea";
import StepReview from "./StepReview";
import StepMediaUpload from "./StepMediaUpload";
import StepPublish from "./StepPublish";
import StepGitHubImport from "./StepGitHubImport"; // We'll create this

export default function WizardLayout() {
    const [step, setStep] = useState(0);
    const [projectData, setProjectData] = useState<any>({
        name: "",
        slug: "",
        content: "",
        summary: "",
        tags: [],
        githubUrl: "",
        status: "draft"
    });

    // Steps mapping
    // 0: Selector
    // 1: Idea (AI) OR GitHub Import OR Manual (Skip to Review)
    // 2: Review (Edit)
    // 3: Media
    // 4: Publish

    // If user chooses "Idea", step 1 is Idea.
    // If user chooses "GitHub", step 1 is GitHub.
    // If user chooses "Manual", we go straight to Review (step 2) with empty data.

    const [mode, setMode] = useState<"ai" | "github" | "manual">("ai");

    const renderStep = () => {
        switch (step) {
            case 0:
                return <StepSelector setStep={setStep} setMode={setMode} />;
            case 1:
                if (mode === "ai") return <StepDescribeIdea setStep={setStep} setProjectData={setProjectData} />;
                if (mode === "github") return <StepGitHubImport setStep={setStep} setProjectData={setProjectData} />;
                return null; // Should not happen for manual (jumps to 2)
            case 2:
                return <StepReview setStep={setStep} projectData={projectData} setProjectData={setProjectData} />;
            case 3:
                return <StepMediaUpload setStep={setStep} projectData={projectData} setProjectData={setProjectData} />;
            case 4:
                return <StepPublish projectData={projectData} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, type: "spring" }}
                    className="w-full max-w-5xl"
                >
                    {renderStep()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
