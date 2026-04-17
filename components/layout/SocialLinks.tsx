"use client";

import { SOCIAL_LINKS } from "@/lib/config/socials";
import { Github, Linkedin, Twitter, Instagram, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { springs, staggerContainer, staggerChild } from "@/lib/motion";

export default function SocialLinks() {
    return (
        <motion.div
            className="flex gap-6 items-center"
            variants={staggerContainer(0.08)}
            initial="hidden"
            animate="visible"
        >
            <SocialIcon href={SOCIAL_LINKS.linkedin} label="LinkedIn" Icon={Linkedin} />
            <SocialIcon href={SOCIAL_LINKS.github} label="GitHub" Icon={Github} />
            <SocialIcon href={SOCIAL_LINKS.twitter} label="X" Icon={Twitter} />
            <SocialIcon href={SOCIAL_LINKS.instagram} label="Instagram" Icon={Instagram} />
            <SocialIcon href={SOCIAL_LINKS.email} label="Email" Icon={Mail} />
        </motion.div>
    );
}

interface SocialIconProps {
    href: string;
    label: string;
    Icon: any;
}

function SocialIcon({ href, label, Icon }: SocialIconProps) {
    const handleClick = async () => {
        try {
            fetch("/api/analytics/social", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platform: label }),
                keepalive: true,
            }).catch((err) => console.warn("Tracking failed:", err));
        } catch (e) {
            // Ignore to not block navigation
        }
    };

    return (
        <motion.div variants={staggerChild}>
            <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="group relative p-2 flex items-center justify-center"
                aria-label={label}
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                transition={springs.magnetic}
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/15 rounded-full blur-lg transition-all duration-500" />

                {/* Icon */}
                <Icon
                    size={20}
                    className="relative z-10 text-neutral-500 group-hover:text-accent transition-colors duration-300"
                    strokeWidth={1.5}
                />
            </motion.a>
        </motion.div>
    );
}
