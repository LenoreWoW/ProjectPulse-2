import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, AlertCircle, CheckCircle2, File } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

interface FileUploadProps {
  id: string;
  label: string;
  accept?: string;
  required?: boolean;
  onChange: (file: File | null) => void;
  value?: File | null;
  className?: string;
  errorMessage?: string;
}

export function FileUpload({
  id,
  label,
  accept = "image/*,.pdf",
  required = false,
  onChange,
  value,
  className,
  errorMessage,
}: FileUploadProps) {
  const { t, isRtl } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files?.length) {
      const file = e.dataTransfer.files[0];
      onChange(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-maroon-700 ml-1">*</span>}
        </label>
      </div>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-maroon-700 bg-maroon-50 dark:bg-maroon-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-maroon-700 dark:hover:border-maroon-600",
          errorMessage && "border-red-500 dark:border-red-600",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-maroon-700"
        )}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          required={required}
          className="sr-only"
        />
        
        {value ? (
          <div className="flex flex-col items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600 mb-2" />
            <p className="text-sm font-medium">{value.name}</p>
            <p className="text-xs text-gray-500">
              {(value.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-maroon-700"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              {t("removeFile")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Upload className="h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm font-medium">{t("dropFileHere")}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t("orClickToBrowse")}
            </p>
          </div>
        )}
      </div>
      
      {errorMessage && (
        <div className="flex items-center text-red-500 text-xs mt-1">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}