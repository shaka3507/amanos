"use client";

import { useState, useRef } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { FileUpload, Upload, Check, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MemberUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertId: string;
  groupId: string;
}

interface UploadResult {
  added: number;
  invited: number;
  failed: number;
  errors: string[];
}

export default function MemberUploadModal({ isOpen, onClose, alertId, groupId }: MemberUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile && selectedFile.type !== "text/csv") {
      setErrorMsg("Please select a valid CSV file");
      setFile(null);
      return;
    }
    setErrorMsg(null);
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type !== "text/csv") {
      setErrorMsg("Please drop a valid CSV file");
      return;
    }
    setErrorMsg(null);
    setFile(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const parseCSV = (content: string) => {
    const rows = content.split("\n").filter(row => row.trim());
    const headers = rows[0].split(",").map(h => h.trim().toLowerCase());
    
    // Check if required headers exist
    const requiredHeaders = ["name", "email", "phone"];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
    }
    
    // Parse rows
    const data = rows.slice(1).map(row => {
      const values = row.split(",").map(v => v.trim());
      const entry: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        entry[header] = values[index] || "";
      });
      
      return entry;
    });
    
    return data;
  };

  const uploadMembers = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setErrorMsg(null);
      
      const supabase = createClient();
      if (!supabase) {
        throw new Error("Could not initialize Supabase client");
      }
      
      // Read and parse CSV file
      const reader = new FileReader();
      
      const filePromise = new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
      
      const content = await filePromise;
      const members = parseCSV(content);
      
      // Call API to process members
      const response = await fetch("/api/alerts/upload-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alertId,
          groupId,
          members
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload members");
      }
      
      const result = await response.json();
      setResult(result);
      
    } catch (error: any) {
      console.error("Error uploading members:", error);
      setErrorMsg(error.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Upload Members to Crisis Alert</AlertDialogTitle>
          <AlertDialogDescription>
            Upload a CSV file containing name, email, and phone number of people to add to this crisis alert.
            If they're not already users, they'll be invited to join.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!result ? (
          <>
            {errorMsg && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              
              <FileUpload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              
              {file ? (
                <div className="text-sm">
                  <p className="font-medium mb-1">{file.name}</p>
                  <p className="text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <>
                  <p className="text-lg font-medium mb-1">
                    Click to select or drag and drop a CSV file
                  </p>
                  <p className="text-sm text-gray-500">
                    File must include columns for name, email, and phone number
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 text-sm text-gray-600">
              <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>First row must contain headers: name, email, phone</li>
                <li>Each row represents one member to invite</li>
                <li>Maximum file size: 1MB</li>
              </ul>
            </div>

            <AlertDialogFooter className="mt-6">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={uploadMembers} 
                disabled={!file || isUploading}
                className={file ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                {isUploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Members
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <div className="my-6 py-2">
              <div className="flex flex-col items-center justify-center text-center">
                {result.failed > 0 ? (
                  <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                ) : (
                  <Check className="h-12 w-12 text-green-500 mb-4" />
                )}
                
                <h3 className="text-xl font-medium mb-2">
                  {result.failed > 0 ? "Upload Completed with Issues" : "Upload Successful"}
                </h3>
                
                <div className="w-full max-w-xs mx-auto mt-4 space-y-2">
                  <div className="flex justify-between py-1 border-b">
                    <span>Members Added:</span>
                    <span className="font-medium">{result.added}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Invitations Sent:</span>
                    <span className="font-medium">{result.invited}</span>
                  </div>
                  {result.failed > 0 && (
                    <div className="flex justify-between py-1 border-b text-red-500">
                      <span>Failed Entries:</span>
                      <span className="font-medium">{result.failed}</span>
                    </div>
                  )}
                </div>

                {result.errors.length > 0 && (
                  <div className="mt-4 w-full">
                    <h4 className="font-medium text-left mb-2">Errors:</h4>
                    <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2 text-left text-sm">
                      <ul className="list-disc pl-5 space-y-1">
                        {result.errors.map((error, i) => (
                          <li key={i} className="text-red-600">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <AlertDialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
} 