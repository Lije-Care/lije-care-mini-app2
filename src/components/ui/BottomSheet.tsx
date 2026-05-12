import React, { useEffect } from 'react';
import { registerBackHandler } from '@/navigation/backStore';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showHandle?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  showHandle = true,
}) => {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Register a back handler so the phone back button closes the sheet
  // before navigating away from the current page.
  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler({
      id: 'bottom-sheet',
      priority: 50,
      canHandle: () => isOpen,
      onBack: () => {
        onClose();
        return true;
      },
    });
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 animate-slide-up">
        <div className="bg-white rounded-t-[3rem] max-h-[90vh] overflow-y-auto">
          {/* Handle */}
          {showHandle && (
            <div className="sticky top-0 pt-4 pb-2 bg-white rounded-t-[3rem]">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto" />
            </div>
          )}

          {/* Title */}
          {title && (
            <div className="px-8 pb-4 pt-4">
              <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            </div>
          )}

          {/* Content */}
          <div className="px-8 pb-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
