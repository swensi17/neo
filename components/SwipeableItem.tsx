import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  isLight?: boolean;
  lang?: string;
  disabled?: boolean;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({ 
  children, 
  onDelete, 
  isLight = false, 
  lang = 'en',
  disabled = false 
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const DELETE_THRESHOLD = -80;
  const MAX_SWIPE = -100;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // Only handle horizontal swipes
    if (isHorizontalSwipe.current) {
      e.preventDefault();
      // Only allow left swipe (negative values)
      const newTranslate = Math.max(MAX_SWIPE, Math.min(0, diffX));
      setTranslateX(newTranslate);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsDragging(false);
    isHorizontalSwipe.current = null;

    if (translateX < DELETE_THRESHOLD) {
      // Trigger delete
      setTranslateX(MAX_SWIPE);
      setTimeout(() => {
        onDelete();
        setTranslateX(0);
      }, 200);
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setTranslateX(0);
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden touch-pan-y"
    >
      {/* Delete background */}
      <div 
        className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-red-500 transition-opacity ${
          translateX < -20 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: Math.abs(MAX_SWIPE) + 20 }}
      >
        <button 
          onClick={handleDeleteClick}
          className="flex items-center gap-2 text-white"
        >
          <Trash2 size={20} />
          <span className="text-sm font-medium">
            {lang === 'ru' ? 'Удалить' : 'Delete'}
          </span>
        </button>
      </div>

      {/* Content */}
      <div
        className={`relative ${isLight ? 'bg-white' : 'bg-black'} ${isDragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};
