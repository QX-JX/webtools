import i18n from './config'
import { useTranslation } from 'react-i18next'

export function useI18nSection<T>(key: string) {
  const { t } = useTranslation()
  return t(key, { returnObjects: true }) as T
}

export function getI18nSection<T>(key: string) {
  return i18n.t(key, { returnObjects: true }) as T
}
