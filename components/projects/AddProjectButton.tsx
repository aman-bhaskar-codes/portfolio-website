"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export function AddProjectButton() {
    return (
        <Link href="/projects/new">
            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-10 right-10 
                   w-16 h-16 
                   bg-violet-600 hover:bg-violet-500
                   rounded-full 
                   flex items-center justify-center
                   shadow-xl shadow-violet-500/30
                   cursor-pointer z-50 text-white"
            >
                <Plus size={28} />
            </motion.div>
        </Link>
    );
}
