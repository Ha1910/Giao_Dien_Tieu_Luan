
import { motion } from "framer-motion";

export function Card({ children, className = "" }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`group ${className}`}
        >
            <div className="shadow-lg hover:shadow-xl transition rounded-2xl overflow-hidden bg-[#0B122E] border border-white/10">
                {children}
            </div>
        </motion.div>
    );
}

export function CardContent({ children, className = "" }) {
    return <div className={`p-5 space-y-3 text-center ${className}`}>{children}</div>;
}