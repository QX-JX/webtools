import { useState } from 'react'
import { Shield, Mail, Globe, Phone, User, CreditCard, Calendar, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormValidator, ValidationRules, commonRules, sanitizers, quickValidations } from '../../utils/validation'

interface FormData {
  username: string
  email: string
  phone: string
  website: string
  age: string
  idCard: string
  address: string
  bio: string
}

export default function FormValidationDemo() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    phone: '',
    website: '',
    age: '',
    idCard: '',
    address: '',
    bio: ''
  })
  
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({})
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  // 设置验证规则
  const validationRules: ValidationRules = {
    username: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_]+$/,
      message: t('pages.formValidationDemo.validation.username')
    },
    email: {
      required: true,
      ...commonRules.email
    },
    phone: {
      required: true,
      pattern: /^1[3-9]\d{9}$/,
      message: t('pages.formValidationDemo.validation.phone')
    },
    website: {
      required: false,
      ...commonRules.url
    },
    age: {
      required: true,
      custom: (value: string) => {
        const age = parseInt(value)
        if (isNaN(age) || age < 1 || age > 120) {
          return t('pages.formValidationDemo.validation.age')
        }
        return null
      }
    },
    idCard: {
      required: true,
      pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]$/,
      message: t('pages.formValidationDemo.validation.idCard')
    },
    address: {
      required: false,
      maxLength: 200,
      message: t('pages.formValidationDemo.validation.address')
    },
    bio: {
      required: false,
      maxLength: 500,
      message: t('pages.formValidationDemo.validation.bio')
    }
  }

  const validator = new FormValidator(validationRules)

  const validateField = (fieldName: keyof FormData, value: string) => {
    const validationResult = validator.validate({ [fieldName]: value })
    setValidationErrors(prev => ({ 
      ...prev, 
      [fieldName]: validationResult.errors[fieldName] || [] 
    }))
    return validationResult.errors[fieldName] || []
  }

  const handleFieldBlur = (fieldName: keyof FormData) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }))
    validateField(fieldName, formData[fieldName])
  }

  const handleInputChange = (fieldName: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // 如果字段已经被触摸过，实时验证
    if (touchedFields[fieldName]) {
      validateField(fieldName, value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    
    // 标记所有字段为已触摸
    const allFieldsTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as { [key: string]: boolean })
    setTouchedFields(allFieldsTouched)
    
    // 验证整个表单
    const validationResult = validator.validate(formData)
    setValidationErrors(validationResult.errors)
    
    if (validationResult.isValid) {
      // 清理数据
      const sanitizedData = {
        ...formData,
        username: sanitizers.trim(formData.username),
        email: sanitizers.toLowerCase(sanitizers.trim(formData.email)),
        website: formData.website ? sanitizers.normalizeUrl(formData.website) : '',
        address: sanitizers.trim(formData.address),
        bio: sanitizers.trim(formData.bio)
      }
      
      alert(`${t('pages.formValidationDemo.submitSuccess')}\n${JSON.stringify(sanitizedData, null, 2)}`)
    }
  }

  const getValidationStatus = (fieldName: keyof FormData) => {
    const hasError = validationErrors[fieldName] && validationErrors[fieldName].length > 0
    const isTouched = touchedFields[fieldName]
    const hasValue = formData[fieldName].length > 0
    
    if (hasError) return 'error'
    if (isTouched && hasValue && !hasError) return 'success'
    return 'default'
  }

  const getInputClassName = (fieldName: keyof FormData) => {
    const status = getValidationStatus(fieldName)
    const baseClasses = "w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
    
    switch (status) {
      case 'error':
        return `${baseClasses} border-red-300 focus:ring-red-500 bg-red-50`
      case 'success':
        return `${baseClasses} border-green-300 focus:ring-green-500 bg-green-50`
      default:
        return `${baseClasses} border-gray-200 focus:ring-blue-500`
    }
  }

  const getFieldIcon = (fieldName: keyof FormData) => {
    const status = getValidationStatus(fieldName)
    
    switch (status) {
      case 'error':
        return "❌"
      case 'success':
        return "✅"
      default:
        switch (fieldName) {
          case 'username': return "👤"
          case 'email': return "📧"
          case 'phone': return "📱"
          case 'website': return "🌐"
          case 'age': return "🎂"
          case 'idCard': return "🆔"
          case 'address': return "📍"
          case 'bio': return "📝"
          default: return "•"
        }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.formValidationDemo.title')}</h1>
          <p className="text-gray-500">{t('pages.formValidationDemo.description')}</p>
        </div>
      </div>

      {/* Quick Validation Test */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('pages.formValidationDemo.quickTestTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.formValidationDemo.quickLabels.email')}</label>
            <input
              type="text"
              placeholder={t('pages.formValidationDemo.quickPlaceholders.email')}
              onChange={(e) => {
                const isValid = quickValidations.isEmail(e.target.value)
                const resultEl = document.getElementById('email-test-result')
                if (resultEl) {
                  resultEl.textContent = isValid ? t('pages.formValidationDemo.valid') : t('pages.formValidationDemo.invalid')
                  resultEl.className = isValid ? 'text-green-600' : 'text-red-600'
                }
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div id="email-test-result" className="text-sm mt-1"></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.formValidationDemo.quickLabels.phone')}</label>
            <input
              type="text"
              placeholder={t('pages.formValidationDemo.quickPlaceholders.phone')}
              onChange={(e) => {
                const isValid = quickValidations.isPhone(e.target.value)
                const resultEl = document.getElementById('phone-test-result')
                if (resultEl) {
                  resultEl.textContent = isValid ? t('pages.formValidationDemo.valid') : t('pages.formValidationDemo.invalid')
                  resultEl.className = isValid ? 'text-green-600' : 'text-red-600'
                }
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div id="phone-test-result" className="text-sm mt-1"></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.formValidationDemo.quickLabels.url')}</label>
            <input
              type="text"
              placeholder={t('pages.formValidationDemo.quickPlaceholders.url')}
              onChange={(e) => {
                const isValid = quickValidations.isUrl(e.target.value)
                const resultEl = document.getElementById('url-test-result')
                if (resultEl) {
                  resultEl.textContent = isValid ? t('pages.formValidationDemo.valid') : t('pages.formValidationDemo.invalid')
                  resultEl.className = isValid ? 'text-green-600' : 'text-red-600'
                }
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div id="url-test-result" className="text-sm mt-1"></div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">{t('pages.formValidationDemo.formTitle')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">
              {getFieldIcon('username')}
            </div>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              onBlur={() => handleFieldBlur('username')}
              placeholder={t('pages.formValidationDemo.placeholders.username')}
              className={getInputClassName('username')}
            />
            {validationErrors.username && validationErrors.username.length > 0 && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.username[0]}</div>
            )}
            {touchedFields.username && !validationErrors.username?.length && formData.username && (
              <div className="text-xs text-green-600 mt-1">{t('pages.formValidationDemo.success.username')}</div>
            )}
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              placeholder={t('pages.formValidationDemo.placeholders.email')}
              className={getInputClassName('email')}
            />
            {validationErrors.email && validationErrors.email.length > 0 && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.email[0]}</div>
            )}
            {touchedFields.email && !validationErrors.email?.length && formData.email && (
              <div className="text-xs text-green-600 mt-1">{t('pages.formValidationDemo.success.email')}</div>
            )}
          </div>

          {/* Phone */}
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              onBlur={() => handleFieldBlur('phone')}
              placeholder={t('pages.formValidationDemo.placeholders.phone')}
              className={getInputClassName('phone')}
            />
            {validationErrors.phone && validationErrors.phone.length > 0 && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.phone[0]}</div>
            )}
            {touchedFields.phone && !validationErrors.phone?.length && formData.phone && (
              <div className="text-xs text-green-600 mt-1">{t('pages.formValidationDemo.success.phone')}</div>
            )}
          </div>

          {/* Website */}
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              onBlur={() => handleFieldBlur('website')}
              placeholder={t('pages.formValidationDemo.placeholders.website')}
              className={getInputClassName('website')}
            />
            {validationErrors.website && validationErrors.website.length > 0 && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.website[0]}</div>
            )}
            {touchedFields.website && !validationErrors.website?.length && formData.website && (
              <div className="text-xs text-green-600 mt-1">{t('pages.formValidationDemo.success.website')}</div>
            )}
          </div>

          {/* Age */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              onBlur={() => handleFieldBlur('age')}
              placeholder={t('pages.formValidationDemo.placeholders.age')}
              className={getInputClassName('age')}
            />
            {validationErrors.age && validationErrors.age.length > 0 && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.age[0]}</div>
            )}
            {touchedFields.age && !validationErrors.age?.length && formData.age && (
              <div className="text-xs text-green-600 mt-1">{t('pages.formValidationDemo.success.age')}</div>
            )}
          </div>

          {/* ID Card */}
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.idCard}
              onChange={(e) => handleInputChange('idCard', e.target.value)}
              onBlur={() => handleFieldBlur('idCard')}
              placeholder={t('pages.formValidationDemo.placeholders.idCard')}
              className={getInputClassName('idCard')}
            />
            {validationErrors.idCard && validationErrors.idCard.length > 0 && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.idCard[0]}</div>
            )}
            {touchedFields.idCard && !validationErrors.idCard?.length && formData.idCard && (
              <div className="text-xs text-green-600 mt-1">{t('pages.formValidationDemo.success.idCard')}</div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="relative mt-6">
          <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            onBlur={() => handleFieldBlur('address')}
            placeholder={t('pages.formValidationDemo.placeholders.address')}
            rows={3}
            className={getInputClassName('address')}
          />
          {validationErrors.address && validationErrors.address.length > 0 && (
            <div className="text-xs text-red-600 mt-1">{validationErrors.address[0]}</div>
          )}
          {touchedFields.address && !validationErrors.address?.length && formData.address && (
            <div className="text-xs text-green-600 mt-1">{t('pages.formValidationDemo.success.address')}</div>
          )}
        </div>

        {/* Bio */}
        <div className="relative mt-6">
          <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            onBlur={() => handleFieldBlur('bio')}
            placeholder={t('pages.formValidationDemo.placeholders.bio')}
            rows={4}
            className={getInputClassName('bio')}
          />
          <div className="flex justify-between items-center mt-1">
            {validationErrors.bio && validationErrors.bio.length > 0 && (
              <div className="text-xs text-red-600">{validationErrors.bio[0]}</div>
            )}
            {touchedFields.bio && !validationErrors.bio?.length && formData.bio && (
              <div className="text-xs text-green-600">{t('pages.formValidationDemo.success.bio')}</div>
            )}
            <div className="text-xs text-gray-500">
              {formData.bio.length}/500
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pages.formValidationDemo.submit')}
          </button>
        </div>
      </form>

      {/* Validation Summary */}
      {isSubmitted && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('pages.formValidationDemo.summaryTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData).map(([field, value]) => {
              const hasError = validationErrors[field] && validationErrors[field].length > 0
              const fieldLabels = t('pages.formValidationDemo.fieldLabels', { returnObjects: true }) as Record<string, string>
              
              return (
                <div key={field} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{fieldLabels[field]}</span>
                  <div className="flex items-center gap-2">
                    {hasError ? (
                      <span className="text-xs text-red-600">{t('pages.formValidationDemo.summaryStatus.failed')}</span>
                    ) : value ? (
                      <span className="text-xs text-green-600">{t('pages.formValidationDemo.summaryStatus.passed')}</span>
                    ) : (
                      <span className="text-xs text-gray-500">{t('pages.formValidationDemo.summaryStatus.empty')}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-green-50 rounded-xl p-6 border border-green-100">
        <h3 className="font-semibold text-green-800 mb-2">{t('pages.formValidationDemo.infoTitle')}</h3>
        <ul className="text-green-700 text-sm leading-relaxed space-y-1">
          {(
            t('pages.formValidationDemo.infoItems', { returnObjects: true }) as { title: string; description: string }[]
          ).map((item) => (
            <li key={item.title}><strong>{item.title}</strong>：{item.description}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
