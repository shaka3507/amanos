"use client";

import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface SimpleTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleTestModal({ isOpen, onClose }: SimpleTestModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogTitle>Test Modal (Root Path)</AlertDialogTitle>
        <div className="p-4">
          <p className="mb-4">This is a test modal from the root components directory.</p>
          <Button onClick={onClose}>Close Modal</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
} 