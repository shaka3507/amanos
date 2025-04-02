"use client";

import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleModal({ isOpen, onClose }: SimpleModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogTitle>Simple Test Modal</AlertDialogTitle>
        <div>
          <p>This is a very simple test modal to diagnose rendering issues.</p>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
} 