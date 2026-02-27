
import React, { useState, useCallback, useRef } from 'react';
import { UploadCloudIcon, FileIcon, XIcon } from './icons';

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  acceptedFileTypes?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, acceptedFileTypes }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    onFileSelect(selectedFile);
  }, [onFileSelect]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  if (file) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-100 border border-gray-300 rounded-lg">
        <div className="flex items-center gap-3 overflow-hidden">
          <FileIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
          <span className="font-medium text-gray-700 truncate">{file.name}</span>
        </div>
        <button
          onClick={() => handleFileChange(null)}
          className="p-1 rounded-full hover:bg-gray-200 flex-shrink-0"
          aria-label="Remove file"
        >
          <XIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={triggerFileSelect}
      className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleInputChange}
        accept={acceptedFileTypes}
      />
      <UploadCloudIcon className="w-10 h-10 text-gray-400 mb-2" />
      <p className="font-semibold text-gray-700">Click to upload or drag and drop</p>
      <p className="text-sm text-gray-500">PDF, PPTX, or DOCX (optional)</p>
    </div>
  );
};
