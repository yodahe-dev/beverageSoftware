"use client";

import { motion } from "framer-motion";

interface SectionIntroProps {
  title: string;
  description?: string;
}

export default function SectionIntro({ title, description }: SectionIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-10"
    >
      <h1 className="text-3xl font-bold text-[#E6EAF0] mb-2 font-[geist]">
        {title}
      </h1>
      {description && <p className="text-[#A9B4C2]">{description}</p>}
    </motion.div>
  );
}
