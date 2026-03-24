import { useState } from 'react'
import { Calculator, Clock, Play, RefreshCw, Activity, X, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMathWorker } from '../../hooks/useWorker'

// 主线程计算函数（用于对比）- 定义在组件外部
function calculateFactorial(n: number): number {
  if (n === 0 || n === 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

function calculateFibonacci(n: number): number {
  if (n === 0) return 0
  if (n === 1) return 1
  let a = 0, b = 1
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b]
  }
  return b
}

function isPrime(n: number): boolean {
  if (n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false
  }
  return true
}

function primeFactorization(n: number): number[] {
  if (n < 2) return []
  const factors: number[] = []
  let divisor = 2
  
  while (divisor * divisor <= n) {
    while (n % divisor === 0) {
      factors.push(divisor)
      n = Math.floor(n / divisor)
    }
    divisor++
  }
  
  if (n > 1) {
    factors.push(n)
  }
  
  return factors
}

export default function WorkerDemo() {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('20')
  const [operation, setOperation] = useState<'factorial' | 'fibonacci' | 'prime' | 'factorization'>('factorial')
  const [result, setResult] = useState<{ result: any; time: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [mainThreadTime, setMainThreadTime] = useState<number | null>(null)
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' })
  
  const mathWorker = useMathWorker()

  const showError = (message: string) => {
    setErrorModal({ show: true, message })
  }
  
  const handleWorkerCalculation = async () => {
    const num = parseInt(inputValue)
    if (isNaN(num) || num < 0) {
      showError(t('pages.workerDemo.invalidInteger'))
      return
    }
    
    setLoading(true)
    setResult(null)
    
    try {
      const startTime = performance.now()
      const workerResult = await mathWorker.execute({
        operation,
        value: num
      })
      const totalTime = performance.now() - startTime
      
      setResult(workerResult)
      console.log(`Worker计算耗时: ${workerResult.time.toFixed(2)}ms`)
      console.log(`总耗时: ${totalTime.toFixed(2)}ms`)
    } catch (error) {
      console.error(t('pages.workerDemo.workerError'), error)
      showError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleMainThreadCalculation = () => {
    const num = parseInt(inputValue)
    if (isNaN(num) || num < 0) {
      showError(t('pages.workerDemo.invalidInteger'))
      return
    }
    
    setLoading(true)
    setMainThreadTime(null)
    
    // 模拟主线程计算
    setTimeout(() => {
      const startTime = performance.now()
      
      switch (operation) {
        case 'factorial':
          calculateFactorial(num)
          break
        case 'fibonacci':
          calculateFibonacci(num)
          break
        case 'prime':
          isPrime(num)
          break
        case 'factorization':
          primeFactorization(num)
          break
      }
      
      const endTime = performance.now()
      setMainThreadTime(endTime - startTime)
      setLoading(false)
      
      console.log(`主线程计算耗时: ${(endTime - startTime).toFixed(2)}ms`)
    }, 100)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* 错误弹窗 */}
      {errorModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('pages.workerDemo.notice')}</h3>
            </div>
            <p className="text-gray-600 mb-6">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ show: false, message: '' })}
              className="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              {t('auth.close')}
            </button>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Activity className="w-8 h-8 text-blue-500" />
            {t('pages.workerDemo.title')}
          </h1>
          <p className="text-gray-600">{t('pages.workerDemo.description')}</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* 输入区域 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              {t('pages.workerDemo.settingsTitle')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pages.workerDemo.inputLabel')}
                </label>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('pages.workerDemo.inputPlaceholder')}
                  min="1"
                  max="10000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pages.workerDemo.operationLabel')}
                </label>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="factorial">{t('pages.workerDemo.operations.factorial')}</option>
                  <option value="fibonacci">{t('pages.workerDemo.operations.fibonacci')}</option>
                  <option value="prime">{t('pages.workerDemo.operations.prime')}</option>
                  <option value="factorization">{t('pages.workerDemo.operations.factorization')}</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleWorkerCalculation}
                  disabled={loading}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {t('pages.workerDemo.workerCalculate')}
                </button>
                
                <button
                  onClick={handleMainThreadCalculation}
                  disabled={loading}
                  className="w-full py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('pages.workerDemo.mainThreadCalculate')}
                </button>
              </div>
            </div>
          </div>
          
          {/* 结果对比 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('pages.workerDemo.comparisonTitle')}
            </h2>
            
            <div className="space-y-4">
              {result && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">{t('pages.workerDemo.workerResult')}</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>
                      <span>{t('pages.workerDemo.resultLabel')} </span>
                      <div className="font-mono text-xs bg-white p-2 rounded mt-1 max-h-32 overflow-auto break-all">
                        {(() => {
                          const r = result.result
                          // 字符串类型的大数（BigInt 转换的）
                          if (typeof r === 'string' && r.length > 20) {
                            const len = r.length
                            const first = r.slice(0, 6)
                            return `${first[0]}.${first.slice(1)} × 10^${len - 1}`
                          }
                          // 普通数字
                          if (typeof r === 'number' && Math.abs(r) >= 1e10) {
                            return r.toExponential(5)
                          }
                          return JSON.stringify(r)
                        })()}
                      </div>
                    </div>
                    <div>{t('pages.workerDemo.timeLabel')} <span className="font-mono">{result.time.toFixed(2)}ms</span></div>
                  </div>
                </div>
              )}
              
              {mainThreadTime !== null && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">{t('pages.workerDemo.mainThreadResult')}</h3>
                  <div className="text-sm text-gray-700">
                    <div>{t('pages.workerDemo.timeLabel')} <span className="font-mono">{mainThreadTime.toFixed(2)}ms</span></div>
                  </div>
                </div>
              )}
              
              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">{t('pages.workerDemo.calculating')}</p>
                </div>
              )}
              
              {!result && !mainThreadTime && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('pages.workerDemo.emptyState')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 说明信息 */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('pages.workerDemo.infoTitle')}</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">{t('pages.workerDemo.workerFeaturesTitle')}</h3>
              <ul className="space-y-1">
                {(t('pages.workerDemo.workerFeatures', { returnObjects: true }) as string[]).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-orange-600 mb-2">{t('pages.workerDemo.useCasesTitle')}</h3>
              <ul className="space-y-1">
                {(t('pages.workerDemo.useCases', { returnObjects: true }) as string[]).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
