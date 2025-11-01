'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  icon?: React.ReactNode;
  danger?: boolean;
  transparent?: boolean; // optional transparent / white bg
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  loading = false,
  icon,
  danger = false,
  transparent = false,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={`rounded-xl border p-6 max-w-md mx-auto shadow-xl relative ${
                transparent ? 'bg-white border-gray-300' : 'bg-[#121212] border-gray-700'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => onOpenChange(false)}
                className={`absolute top-4 right-4 transition-colors ${
                  transparent ? 'text-gray-700 hover:text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <X size={20} />
              </button>

              {/* Optional Icon */}
              {icon && <div className="mb-4 flex justify-center">{icon}</div>}

              <DialogHeader>
                <DialogTitle className={`${transparent ? 'text-black' : 'text-white'} text-xl font-bold`}>
                  {title}
                </DialogTitle>
                <DialogDescription className={`${transparent ? 'text-gray-700' : 'text-gray-300'} mt-1`}>
                  {description}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button
                  onClick={() => onOpenChange(false)}
                  className={`${
                    transparent ? 'bg-gray-200 hover:bg-gray-300 text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={onConfirm}
                  className={`${
                    danger
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gradient-to-r from-[#00cec9] to-[#a8eb12] text-black hover:from-[#00b894] hover:to-[#a8eb12]'
                  }`}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : confirmText}
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
