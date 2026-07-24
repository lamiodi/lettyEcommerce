"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ANNOUNCEMENTS } from "@/lib/constants";

/** Slim rotating announcement ribbon above the header. */
export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length),
      4500,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-9 items-center justify-center overflow-hidden bg-ink text-ivory">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-[11px] font-medium uppercase tracking-luxe"
        >
          {ANNOUNCEMENTS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
