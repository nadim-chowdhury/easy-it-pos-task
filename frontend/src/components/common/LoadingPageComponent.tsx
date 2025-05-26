"use client";

import { motion } from "framer-motion";

export function LoadingPageComponent({
  message = "Loading...",
  subtitle = "Please wait while we prepare everything for you",
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const dotsVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
        repeat: Infinity,
      },
    },
  };

  const dotVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  // Safe window access with fallbacks
  const getWindowDimensions = () => {
    if (typeof window !== "undefined") {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return {
      width: 1200, // fallback width
      height: 800, // fallback height
    };
  };

  const { width: windowWidth, height: windowHeight } = getWindowDimensions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full text-center"
      >
        {/* Loading Spinner */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            {/* Outer pulse ring */}
            <motion.div
              variants={pulseVariants}
              animate="animate"
              className="absolute inset-0 bg-blue-200 rounded-full blur-md"
            />

            {/* Main spinner container */}
            <div className="relative bg-white rounded-full p-6 shadow-lg">
              <motion.div
                variants={spinnerVariants}
                animate="animate"
                className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.div variants={itemVariants} className="space-y-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {message}
          </h1>
          <p className="text-gray-600 leading-relaxed">{subtitle}</p>
        </motion.div>

        {/* Animated Dots */}
        <motion.div
          variants={dotsVariants}
          animate="animate"
          className="flex justify-center space-x-2 mb-8"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              variants={dotVariants}
              className="w-3 h-3 bg-blue-500 rounded-full"
            />
          ))}
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          variants={itemVariants}
          className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
          />
        </motion.div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * windowWidth,
                y: Math.random() * windowHeight,
                opacity: 0,
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              className="absolute w-2 h-2 bg-blue-300 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
