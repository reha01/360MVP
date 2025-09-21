// src/hooks/useSaveProgress.js
import { useEffect, useState } from 'react';

// A simple debounce implementation
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const useSaveProgress = (evaluationId, answers) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const saveData = async (evaluationId, answers) => {
    setIsSaving(true);
    console.log(`Saving progress for evaluation ${evaluationId}`, answers);
    // TODO: Call backend to save progress
    // await saveProgressToBackend(evaluationId, answers);
    setLastSaved(new Date());
    setIsSaving(false);
  };

  useEffect(() => {
    const debouncedSave = debounce(() => saveData(evaluationId, answers), 2000);
    debouncedSave();

    return () => {
      // Cleanup the timeout if the component unmounts
      // clearTimeout(debouncedSave);
    };
  }, [answers, evaluationId]);

  return { isSaving, lastSaved };
};

export default useSaveProgress;
