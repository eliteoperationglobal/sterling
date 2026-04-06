 import { useEffect, useRef, useState, useCallback } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  formType: string; // e.g., "admin_quote", "agency_submission"
  formId: string; // Unique identifier (e.g., submissionId, quoteId)
  data: Record<string, any>; // Form data to save
  debounceMs?: number; // Debounce delay (default: 2000ms)
  enabled?: boolean; // Enable/disable auto-save (default: true)
  onSaveSuccess?: (data: any) => void;
  onSaveError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<Record<string, any> | null>;
  deleteDraft: () => Promise<void>;
  isDirty: boolean; // Whether data has changed since last save
}

/**
 * useAutoSave Hook
 * 
 * Provides auto-save functionality for forms
 * - Debounced auto-save (saves after user stops typing)
 * - Save status indicators (idle, saving, saved, error)
 * - Load draft on mount
 * - Delete draft after submission
 */
export function useAutoSave({
  formType,
  formId,
  data,
  debounceMs = 2000,
  enabled = true,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isDirty, setIsDirty] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>("");
  const saveInProgressRef = useRef(false);

  // Serialize data for comparison
  const serializeData = useCallback((data: Record<string, any>) => {
    return JSON.stringify(data);
  }, []);

  // Save draft to API
  const saveDraft = useCallback(async () => {
    if (!enabled) {
      console.log("[AutoSave] Save skipped - enabled:", enabled);
      return;
    }

    // Prevent duplicate saves
    if (saveInProgressRef.current) {
      console.log("[AutoSave] Save already in progress, skipping");
      return;
    }

    console.log("[AutoSave] Saving draft...", { formType, formId, dataKeys: Object.keys(data) });
    saveInProgressRef.current = true;
    setSaveStatus("saving");

    try {
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType,
          formId,
          data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[AutoSave] Save failed:", errorData);
        throw new Error(errorData.error || "Failed to save draft");
      }

      const result = await response.json();
      console.log("[AutoSave] Save successful:", result);

      setSaveStatus("saved");
      lastSavedDataRef.current = serializeData(data);
      setIsDirty(false);
      saveInProgressRef.current = false;
      onSaveSuccess?.(result.draft);

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error: any) {
      console.error("[AutoSave] Error saving draft:", error);
      setSaveStatus("error");
      saveInProgressRef.current = false;
      onSaveError?.(error);

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  }, [formType, formId, data, enabled, serializeData, onSaveSuccess, onSaveError]);

  // Load draft from API
  const loadDraft = useCallback(async (): Promise<Record<string, any> | null> => {
    if (!enabled || !formType || !formId) return null;

    try {
      const response = await fetch(
        `/api/drafts?formType=${encodeURIComponent(formType)}&formId=${encodeURIComponent(formId)}`
      );

      if (!response.ok) {
        console.warn("[AutoSave] Failed to load draft");
        return null;
      }

      const result = await response.json();

      console.log("[AutoSave] Load draft response:", result);
      console.log("[AutoSave] Response structure:", {
        success: result.success,
        draft: result.draft,
        draftType: typeof result.draft,
        draftNull: result.draft === null,
        draftUndefined: result.draft === undefined,
      });

      if (result.success && result.draft && result.draft !== null) {
        const draftData = result.draft.data;
        console.log("[AutoSave] Draft data loaded:", draftData);
        lastSavedDataRef.current = serializeData(draftData);
        setIsDirty(false);
        return draftData;
      }

      console.log("[AutoSave] No draft found or draft is null");
      return null;
    } catch (error: any) {
      console.error("[AutoSave] Error loading draft:", error);
      return null;
    }
  }, [formType, formId, enabled, serializeData]);

  // Delete draft from API
  const deleteDraft = useCallback(async () => {
    if (!formType || !formId) return;

    try {
      const response = await fetch(
        `/api/drafts?formType=${encodeURIComponent(formType)}&formId=${encodeURIComponent(formId)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        console.warn("[AutoSave] Failed to delete draft");
      }
    } catch (error: any) {
      console.error("[AutoSave] Error deleting draft:", error);
    }
  }, [formType, formId]);

  // Auto-save effect with debouncing
  useEffect(() => {
    if (!enabled) {
      console.log("[AutoSave] Auto-save disabled - enabled:", enabled);
      return;
    }

    const currentDataString = serializeData(data);
    const hasChanged = currentDataString !== lastSavedDataRef.current;

    if (!hasChanged) {
      setIsDirty(false);
      return;
    }

    console.log("[AutoSave] Data changed, scheduling save in", debounceMs, "ms");
    setIsDirty(true);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      console.log("[AutoSave] Debounce timer fired, calling saveDraft");
      saveDraft();
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, debounceMs, enabled, saveDraft, serializeData]);

  return {
    saveStatus,
    saveDraft,
    loadDraft,
    deleteDraft,
    isDirty,
  };
}
