/**
 * Web Worker Hooks
 * 用于在React组件中使用Web Workers处理复杂计算
 */

import { useMathWorker as useBaseMathWorker, useWorker as useBaseWorker } from '../utils/worker';

// 导出类型
export interface MathWorkerData {
  operation: 'factorial' | 'fibonacci' | 'prime' | 'factorization'
  value: number
}

export interface MathWorkerResult {
  result: number | number[] | boolean
  time: number
}

/**
 * 数学计算 Worker Hook
 */
export function useMathWorker() {
  return useBaseMathWorker();
}

/**
 * 通用 Worker Hook
 * 可以用于任何自定义worker函数
 */
export function useWorker<T, R>(workerFunction: (data: T) => R | Promise<R>) {
  return useBaseWorker<T, R>(workerFunction);
}
