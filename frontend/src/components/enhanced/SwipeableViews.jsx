import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface SwipeableViewsProps {
  children: React.ReactNode[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  enableSwipe?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  animationDuration?: number;
}

const SwipeableViews: React.FC<SwipeableViewsProps> = ({
  children,
  activeIndex,
  onIndexChange,
  enableSwipe = true,
  showDots = true,
  showArrows = false,
  autoPlay = false,
  autoPlayInterval = 5000,
  animationDuration = 0.3
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isDragging) {
      autoPlayRef.current = setInterval(() => {
        const nextIndex = (activeIndex + 1) % children.length;
        onIndexChange(nextIndex);
      }, autoPlayInterval);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, activeIndex, children.length, onIndexChange, autoPlayInterval, isDragging]);

  // Handle drag
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!enableSwipe) return;
    setDragX(info.offset.x);
  };

  // Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!enableSwipe) return;

    setIsDragging(false);
    setDragX(0);

    const threshold = 50; // Minimum distance to trigger swipe
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      if (info.offset.x > 0 || velocity > 0) {
        // Swipe right - go to previous
        if (activeIndex > 0) {
          onIndexChange(activeIndex - 1);
        }
      } else {
        // Swipe left - go to next
        if (activeIndex < children.length - 1) {
          onIndexChange(activeIndex + 1);
        }
      }
    }
  };

  const handleDragStart = () => {
    if (!enableSwipe) return;
    setIsDragging(true);

    // Pause auto-play while dragging
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const goToSlide = (index: number) => {
    onIndexChange(index);
  };

  const goToPrevious = () => {
    if (activeIndex > 0) {
      onIndexChange(activeIndex - 1);
    }
  };

  const goToNext = () => {
    if (activeIndex < children.length - 1) {
      onIndexChange(activeIndex + 1);
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        touchAction: enableSwipe ? 'pan-y' : 'auto'
      }}
    >
      {/* Main content area */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative'
            }}
            initial={{ x: '100%', opacity: 0 }}
            animate={{
              x: isDragging ? dragX : 0,
              opacity: 1
            }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{
              type: 'tween',
              duration: isDragging ? 0 : animationDuration,
              ease: 'easeOut'
            }}
            drag={enableSwipe ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            whileDrag={{ cursor: 'grabbing' }}
          >
            {children[activeIndex]}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Navigation arrows */}
      {showArrows && (
        <>
          <IconButton
            onClick={goToPrevious}
            disabled={activeIndex === 0}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)'
              },
              '&:disabled': {
                opacity: 0.3
              }
            }}
          >
            <ChevronLeft />
          </IconButton>

          <IconButton
            onClick={goToNext}
            disabled={activeIndex === children.length - 1}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)'
              },
              '&:disabled': {
                opacity: 0.3
              }
            }}
          >
            <ChevronRight />
          </IconButton>
        </>
      )}

      {/* Dot indicators */}
      {showDots && children.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
            zIndex: 2
          }}
        >
          {children.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: index === activeIndex ? '#FF6B9D' : 'rgba(255, 255, 255, 0.5)',
                padding: 0
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: index === activeIndex ? 1.2 : 1,
                opacity: index === activeIndex ? 1 : 0.7
              }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </Box>
      )}

      {/* Swipe hint for first time users */}
      {enableSwipe && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
            opacity: isDragging ? 0 : 0.6,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none'
          }}
        >
          <motion.div
            animate={{
              x: [-10, 10, -10],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                px: 2,
                py: 1,
                backdropFilter: 'blur(5px)',
                fontSize: '0.7rem'
              }}
            >
              👈 Swipe to navigate 👉
            </Typography>
          </motion.div>
        </Box>
      )}
    </Box>
  );
};

export default SwipeableViews;