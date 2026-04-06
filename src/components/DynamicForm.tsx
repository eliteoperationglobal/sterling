"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import type { IFormField } from "@/models/FormTemplate";

interface DynamicFormProps {
  fields: IFormField[];
  initialValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>, files: FileList | null) => void;
  isLoading?: boolean;
  onDataChange?: (data: Record<string, any>) => void; // Callback for auto-save
}

export default function DynamicForm({
  fields,
  initialValues,
  onSubmit,
  isLoading = false,
  onDataChange,
}: DynamicFormProps) {
  const [fileInputs, setFileInputs] = useState<Record<string, FileList | null>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return (
      <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
        <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-bold text-red-900">No Form Fields Available</p>
          <p className="text-sm text-red-700 mt-1">Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  const buildSchema = () => {
    const schemaObject: Record<string, any> = {};
    fields.forEach((field) => {
      if (!field || !field.key) return;
      let fieldSchema: z.ZodTypeAny;
      switch (field.type) {
        case "text":
        case "textarea":
          fieldSchema = field.required ? z.string().min(1, `${field.label} is required`) : z.string().optional();
          break;
        case "number":
          fieldSchema = field.required ? z.number().min(0) : z.number().optional();
          break;
        case "boolean":
          fieldSchema = field.required ? z.boolean() : z.boolean().optional();
          break;
        case "date":
          fieldSchema = field.required ? z.string().min(1, `${field.label} is required`) : z.string().optional();
          break;
        case "select":
          fieldSchema = field.required ? z.string().min(1, `${field.label} is required`) : z.string().optional();
          break;
        case "file":
          fieldSchema = z.any().optional();
          break;
        default:
          fieldSchema = field.required ? z.string().min(1, `${field.label} is required`) : z.string().optional();
      }
      schemaObject[field.key] = fieldSchema;
    });
    return z.object(schemaObject);
  };

  const schema = buildSchema();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {},
  });

  const watchedValues = watch();

  // Notify parent component of form data changes (for auto-save)
  useEffect(() => {
    if (onDataChange) {
      onDataChange(watchedValues);
    }
  }, [watchedValues, onDataChange]);

  const isFieldVisible = (field: IFormField): boolean => {
    if (!field.conditional) return true;
    const { field: conditionalField, value: conditionalValue } = field.conditional;
    const fieldValue = watchedValues[conditionalField];
    return fieldValue === conditionalValue;
  };

  const handleFormSubmit = (data: Record<string, any>) => {
    try {
      const allFiles = Object.values(fileInputs).find((files) => files && files.length > 0) || null;
      onSubmit(data, allFiles);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleFileChange = (fieldKey: string, files: FileList | null) => {
    setFileInputs((prev) => ({ ...prev, [fieldKey]: files }));
    if (files && files.length > 0) {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress((prev) => ({ ...prev, [fieldKey]: progress }));
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 100);
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "text":
        return "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z";
      case "number":
        return "M7 20l4-16m2 16l4-16M6 9h14M4 15h14";
      case "textarea":
        return "M4 6h16M4 12h16M4 18h7";
      case "select":
        return "M4 6h16M4 12h16M4 18h16";
      case "boolean":
        return "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
      case "date":
        return "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
      case "file":
        return "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12";
      default:
        return "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z";
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {fields.map((field, index) => {
          if (!isFieldVisible(field)) return null;
          const error = errors[field.key];
          const isFullWidth = field.type === "textarea" || field.type === "file";

          return (
            <div
              key={field.key}
              className={`${isFullWidth ? "lg:col-span-2" : ""} space-y-2 animate-fade-in-up`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Label with Icon */}
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getFieldIcon(field.type)} />
                </svg>
                <span>{field.label}</span>
                {field.required && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                    Required
                  </span>
                )}
              </label>

              {/* Help Text */}
              {field.helpText && !error && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5 pl-6">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {field.helpText}
                </p>
              )}

              {/* Text Input */}
              {field.type === "text" && (
                <div className="relative group">
                  <input
                    type="text"
                    {...register(field.key)}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-3.5 bg-white border-2 ${
                      error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                    } rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-4 transition-all hover:border-gray-300 placeholder:text-gray-400 !text-gray-900`}
                  />
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none`}></div>
                </div>
              )}

              {/* Number Input */}
              {field.type === "number" && (
                <div className="relative group">
                  <input
                    type="number"
                    {...register(field.key, { valueAsNumber: true })}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-3.5 bg-white border-2 ${
                      error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                    } rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-4 transition-all hover:border-gray-300 placeholder:text-gray-400 !text-gray-900`}
                  />
                </div>
              )}

              {/* Textarea */}
              {field.type === "textarea" && (
                <div className="relative group">
                  <textarea
                    {...register(field.key)}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`w-full px-4 py-3.5 bg-white border-2 ${
                      error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                    } rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-4 transition-all hover:border-gray-300 resize-none placeholder:text-gray-400 !text-gray-900`}
                  />
                </div>
              )}

              {/* Select Dropdown */}
              {field.type === "select" && field.options && (
                <div className="relative">
                  <select
                    {...register(field.key)}
                    className={`w-full px-4 py-3.5 bg-white border-2 !text-gray-900 ${
                      error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                    } rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-4 transition-all hover:border-gray-300 appearance-none cursor-pointer !text-gray-900`}
                  >
                    <option value="">Select {field.label}...</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Boolean Checkbox */}
              {field.type === "boolean" && (
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100 group hover:border-indigo-200 transition-all">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(field.key)}
                      className="w-6 h-6 text-indigo-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 transition cursor-pointer mt-0.5"
                    />
                    <span className="text-sm text-gray-700 font-medium leading-relaxed">
                      {field.helpText || "Yes, I agree"}
                    </span>
                  </label>
                </div>
              )}

              {/* Date Input */}
              {field.type === "date" && (
                <div className="relative">
                  <input
                    type="date"
                    {...register(field.key)}
                    className={`w-full px-4 py-3.5 bg-white border-2 ${
                      error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                    } rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-4 transition-all hover:border-gray-300`}
                  />
                </div>
              )}

              {/* File Upload */}
              {field.type === "file" && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(field.key, e.target.files)}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      id={`file-${field.key}`}
                    />
                    <label
                      htmlFor={`file-${field.key}`}
                      className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed ${
                        error ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      } rounded-xl cursor-pointer transition-all group`}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900">
                          {fileInputs[field.key] && fileInputs[field.key]!.length > 0
                            ? fileInputs[field.key]![0].name
                            : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
                      </div>
                    </label>
                  </div>
                  
                  {/* Upload Progress */}
                  {uploadProgress[field.key] && uploadProgress[field.key] < 100 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700">Uploading...</span>
                        <span className="font-bold text-indigo-600">{uploadProgress[field.key]}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress[field.key]}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* File Success */}
                  {fileInputs[field.key] && uploadProgress[field.key] === 100 && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-emerald-900">File uploaded successfully</span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in-up">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-red-800">{error.message as string}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Premium Submit Button */}
      <div className="pt-8 border-t-2 border-gray-200">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full sm:flex-1 px-10 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white rounded-2xl font-bold text-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-600/60 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            
            {/* Button Content */}
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Submit Application</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>

            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500"></div>
          </button>

          {/* Info Text */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-medium">Secure submission</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-size-200 { background-size: 200% auto; }
        .bg-pos-0 { background-position: 0% center; }
        .bg-pos-100 { background-position: 100% center; }
      `}</style>
    </form>
  );
}
