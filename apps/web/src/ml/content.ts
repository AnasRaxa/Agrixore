import type { DiseaseContent } from '@agrixore/shared';

// Knowledge base is bundled so it works offline (ARCHITECTURE.md section 9).
const modules = import.meta.glob<DiseaseContent>('../../../../content/diseases/*.json', { eager: true, import: 'default' });

export const allContent: DiseaseContent[] = Object.values(modules);

export function getContent(id: string): DiseaseContent | undefined {
  return allContent.find((c) => c.id === id);
}
