"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onFile, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setFileName(file.name);
      onFile(file);
    },
    [onFile]
  );

  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted[0]) handleFile(accepted[0]); },
    [handleFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    disabled,
  });

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const handleCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (preview) {
    return (
      <div className="space-y-3 animate-scale-in">
        {/* Preview */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-sage-300 bg-sage-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Selected product label"
            className="w-full max-h-72 object-contain"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-white/90 backdrop-blur-sm px-4 py-2.5 border-t border-sage-200">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sage-600 text-lg flex-shrink-0">📷</span>
              <span className="text-sm font-medium text-gray-700 truncate">
                {fileName ?? "Image selected"}
              </span>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={clearImage}
                className="flex-shrink-0 ml-3 rounded-lg bg-white border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
              >
                Change
              </button>
            )}
          </div>
          {/* Success badge */}
          <div className="absolute top-3 right-3 bg-sage-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            ✓ Ready
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Make sure the ingredient list is clearly visible · not the front label
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={clsx(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer select-none transition-all duration-200 focus:outline-none",
          disabled
            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
            : isDragActive
            ? "border-sage-400 bg-sage-50 scale-[1.01] shadow-inner"
            : "border-gray-300 bg-white hover:border-sage-300 hover:bg-sage-50"
        )}
      >
        <input {...getInputProps()} />

        {/* Icon */}
        <div
          className={clsx(
            "flex h-16 w-16 items-center justify-center rounded-full text-3xl transition-all",
            isDragActive ? "bg-sage-100 scale-110" : "bg-gray-100"
          )}
        >
          {isDragActive ? "📥" : "🖼️"}
        </div>

        <div>
          <p className="font-semibold text-gray-800 text-base">
            {isDragActive ? "Drop your photo here" : "Drag & drop your photo"}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            JPG, PNG, WebP · up to 10 MB
          </p>
        </div>

        <span className="rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors px-4 py-2 text-sm font-medium text-gray-700">
          Browse files
        </span>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or use your camera</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Camera button */}
      <label
        className={clsx(
          "flex items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-gray-300 bg-white py-4 px-4 text-sm font-semibold text-gray-700 transition-all cursor-pointer",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700 active:scale-[0.99]"
        )}
      >
        <span className="text-xl">📸</span>
        Take a photo now
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={disabled}
          onChange={handleCamera}
        />
      </label>

      {/* Tip */}
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3">
        <span className="text-amber-500 text-base flex-shrink-0 mt-0.5">💡</span>
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Tip:</span> Photograph the back of the product where
          ingredients are listed — not the front. Good lighting helps a lot!
        </p>
      </div>
    </div>
  );
}
