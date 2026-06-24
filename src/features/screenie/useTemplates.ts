import { useCallback, useEffect, useState } from 'react';
import type { CaptureTemplate } from '../../domain/captureTemplate';
import { screenieRepository } from '../../lib/storage/screenieRepository';

export function useTemplates() {
  const [customTemplates, setCustomTemplates] = useState<CaptureTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setCustomTemplates(await screenieRepository.listTemplates());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveTemplate = useCallback(
    async (template: CaptureTemplate) => {
      const saved = await screenieRepository.saveTemplate(template);
      await reload();
      return saved;
    },
    [reload]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      await screenieRepository.deleteTemplate(id);
      await reload();
    },
    [reload]
  );

  return { customTemplates, isLoading, reload, saveTemplate, deleteTemplate };
}
