import type { MouseEvent, FC } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ProductCardProps {
  title: string;
  description: string;
}

export const ProductCard: FC<ProductCardProps> = ({ title, description }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className="product-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d"
      }}
      whileHover={{ 
        scale: 1.08,
        boxShadow: "0 0 35px rgba(6, 182, 212, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.2)",
        borderColor: "rgba(6, 182, 212, 0.5)",
        zIndex: 10
      }}
      transition={{ scale: { type: "spring", stiffness: 400, damping: 15 } }}
    >
      <div className="product-card-content" style={{ transform: "translateZ(40px)" }}>
        <div className="product-image-placeholder">
          <span style={{color: 'var(--accent-neon)', fontSize: '0.8rem', textShadow: '0 0 5px rgba(6,182,212,0.5)'}}>Product Image</span>
        </div>
        <h3 className="product-title">{title}</h3>
        <p className="product-desc">{description}</p>
      </div>
    </motion.div>
  );
};
