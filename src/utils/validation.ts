/**
 * 表单验证工具
 * Form validation utilities
 */

import i18n from '../i18n/config'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  message?: string
}

export interface ValidationRules {
  [key: string]: ValidationRule | ValidationRule[]
}

export interface ValidationResult {
  isValid: boolean
  errors: { [key: string]: string[] }
}

/**
 * 通用表单验证器
 */
export class FormValidator {
  private rules: ValidationRules = {}

  constructor(rules: ValidationRules = {}) {
    this.rules = rules
  }

  /**
   * 添加验证规则
   */
  addRule(field: string, rule: ValidationRule | ValidationRule[]) {
    this.rules[field] = rule
  }

  /**
   * 验证单个字段
   */
  private validateField(field: string, value: any): string[] {
    const errors: string[] = []
    const fieldRules = this.rules[field]
    
    if (!fieldRules) return errors

    const rules = Array.isArray(fieldRules) ? fieldRules : [fieldRules]

    for (const rule of rules) {
      // 必填验证
      if (rule.required && (value === null || value === undefined || value === '')) {
        errors.push(rule.message || i18n.t('validation.required', { field }))
        continue
      }

      // 如果值为空且不是必填项，跳过其他验证
      if (!rule.required && (value === null || value === undefined || value === '')) {
        continue
      }

      // 长度验证
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(rule.message || i18n.t('validation.minLength', { field, count: rule.minLength }))
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(rule.message || i18n.t('validation.maxLength', { field, count: rule.maxLength }))
      }

      // 正则表达式验证
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.message || i18n.t('validation.invalidFormat', { field }))
      }

      // 自定义验证
      if (rule.custom) {
        const customError = rule.custom(value)
        if (customError) {
          errors.push(customError)
        }
      }
    }

    return errors
  }

  /**
   * 验证整个表单
   */
  validate(data: { [key: string]: any }): ValidationResult {
    const errors: { [key: string]: string[] } = {}
    let isValid = true

    for (const field in this.rules) {
      const fieldErrors = this.validateField(field, data[field])
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors
        isValid = false
      }
    }

    return { isValid, errors }
  }

  /**
   * 验证单个字段并返回错误信息
   */
  validateFieldAndGetErrors(field: string, value: any): string[] {
    return this.validateField(field, value)
  }

  /**
   * 获取第一个错误信息
   */
  getFirstError(errors: { [key: string]: string[] }): string | null {
    for (const field in errors) {
      if (errors[field].length > 0) {
        return errors[field][0]
      }
    }
    return null
  }
}

/**
 * 常用验证规则
 */
export const commonRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: i18n.t('validation.email')
  },
  
  url: {
    pattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    message: i18n.t('validation.url')
  },
  
  domain: {
    pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.?[a-zA-Z]{2,}$/,
    message: i18n.t('validation.domain')
  },
  
  ip: {
    pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    message: i18n.t('validation.ip')
  },
  
  phone: {
    pattern: /^1[3-9]\d{9}$/,
    message: i18n.t('validation.phone')
  },
  
  password: {
    minLength: 6,
    maxLength: 20,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,20}$/,
    message: i18n.t('validation.password')
  }
}

/**
 * 快速创建验证器
 */
export function createValidator(rules: ValidationRules): FormValidator {
  return new FormValidator(rules)
}

/**
 * 验证工具函数
 */
export const validators = {
  isEmail: (value: string) => commonRules.email.pattern.test(value),
  isUrl: (value: string) => commonRules.url.pattern.test(value),
  isDomain: (value: string) => commonRules.domain.pattern.test(value),
  isIp: (value: string) => commonRules.ip.pattern.test(value),
  isPhone: (value: string) => commonRules.phone.pattern.test(value),
  isJson: (value: string) => {
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  },
  isBase64: (value: string) => {
    try {
      return btoa(atob(value)) === value
    } catch {
      return false
    }
  },
  isHex: (value: string) => /^[0-9A-Fa-f]+$/.test(value),
  isColor: (value: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
}

/**
 * 快速验证函数
 */
export const quickValidations = {
  isEmail: (value: string) => commonRules.email.pattern.test(value),
  isUrl: (value: string) => commonRules.url.pattern.test(value),
  isDomain: (value: string) => commonRules.domain.pattern.test(value),
  isIp: (value: string) => commonRules.ip.pattern.test(value),
  isPhone: (value: string) => commonRules.phone.pattern.test(value),
  isJson: (value: string) => {
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  },
  isBase64: (value: string) => {
    try {
      return btoa(atob(value)) === value
    } catch {
      return false
    }
  },
  isHex: (value: string) => /^[0-9A-Fa-f]+$/.test(value),
  isColor: (value: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
}

/**
 * 输入清理函数
 */
export const sanitizers = {
  trim: (value: string) => value.trim(),
  removeSpaces: (value: string) => value.replace(/\s/g, ''),
  removeSpecialChars: (value: string) => value.replace(/[^a-zA-Z0-9]/g, ''),
  toLowerCase: (value: string) => value.toLowerCase(),
  toUpperCase: (value: string) => value.toUpperCase(),
  normalizeUrl: (value: string) => {
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return 'https://' + value
    }
    return value
  }
}

/**
 * 实时验证 Hook 的准备函数
 */
export function createRealTimeValidator(rules: ValidationRules) {
  const validator = new FormValidator(rules)
  
  return {
    validator,
    validateField: (field: string, value: any) => {
      return validator.validateFieldAndGetErrors(field, value)
    },
    validateForm: (data: { [key: string]: any }) => {
      return validator.validate(data)
    }
  }
}
