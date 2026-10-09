import type { TFunction } from 'i18next';
import type { Lang, ScanState } from '@agrixore/shared';
import { getContent } from '../../ml/content';

export function classNameOf(classId: string, lang: Lang): string {
  return getContent(classId)?.name[lang] ?? classId;
}

export function scanHeadline(state: ScanState, classId: string, lang: Lang, t: TFunction): string {
  return t(`result.headline.${state}`, { name: classNameOf(classId, lang) });
}
