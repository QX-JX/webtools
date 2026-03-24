/**
 * Web Worker 工具函数
 * 用于处理复杂计算任务，避免阻塞主线程
 */

import { useRef, useEffect, useCallback } from 'react';

export interface WorkerMessage<T = any> {
  id: string
  type: string
  payload: T
}

export interface WorkerResponse<T = any> {
  id: string
  type: string
  payload: T
  error?: string
}

/**
 * 创建 Web Worker 的包装函数
 * 注意：workerCode 必须是完整的、自包含的代码字符串
 */
export function createWorkerFromCode(workerCode: string): Worker {
  const fullCode = `
    ${workerCode}
    
    self.onmessage = async function(e) {
      const { id, type, payload } = e.data;
      try {
        const result = await workerHandler(payload);
        self.postMessage({
          id,
          type: type + '_SUCCESS',
          payload: result
        });
      } catch (error) {
        self.postMessage({
          id,
          type: type + '_ERROR',
          error: error.message || 'Unknown error'
        });
      }
    };
  `;
  
  const blob = new Blob([fullCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

// 数学计算 Worker 代码
const mathWorkerCode = `
function calculateFactorial(n) {
  if (n < 0) throw new Error('阶乘不支持负数');
  if (n > 10000) throw new Error('数值过大，阶乘计算上限为 10000');
  if (n === 0 || n === 1) return 1;
  
  // 对于大数使用 BigInt
  if (n > 170) {
    let result = BigInt(1);
    for (let i = 2; i <= n; i++) {
      result *= BigInt(i);
    }
    return result.toString();
  }
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function calculateFibonacci(n) {
  if (n < 0) throw new Error('斐波那契数列不支持负数');
  if (n > 10000) throw new Error('数值过大，斐波那契计算上限为 10000');
  if (n === 0) return 0;
  if (n === 1) return 1;
  
  // 对于大数使用 BigInt
  if (n > 78) {
    let a = BigInt(0), b = BigInt(1);
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b.toString();
  }
  
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

function isPrime(n) {
  if (n > 1000000000) throw new Error('数值过大，质数判断上限为 10 亿');
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function primeFactorization(n) {
  if (n > 1000000000) throw new Error('数值过大，质因数分解上限为 10 亿');
  if (n < 2) return [];
  const factors = [];
  let divisor = 2;
  while (divisor * divisor <= n) {
    while (n % divisor === 0) {
      factors.push(divisor);
      n = Math.floor(n / divisor);
    }
    divisor++;
  }
  if (n > 1) {
    factors.push(n);
  }
  return factors;
}

function workerHandler(data) {
  const startTime = performance.now();
  let result;
  
  switch (data.operation) {
    case 'factorial':
      result = calculateFactorial(data.value);
      break;
    case 'fibonacci':
      result = calculateFibonacci(data.value);
      break;
    case 'prime':
      result = isPrime(data.value);
      break;
    case 'factorization':
      result = primeFactorization(data.value);
      break;
    default:
      throw new Error('Unknown operation: ' + data.operation);
  }
  
  return {
    result: result,
    time: performance.now() - startTime
  };
}
`;

/**
 * 使用数学计算 Worker 的 Hook
 */
export function useMathWorker(): {
  execute: (data: { operation: string; value: number }) => Promise<{ result: any; time: number }>;
  terminate: () => void;
} {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());

  useEffect(() => {
    // 创建 Worker
    workerRef.current = createWorkerFromCode(mathWorkerCode);
    
    // 处理 Worker 消息
    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, type, payload, error } = e.data;
      const request = pendingRequests.current.get(id);
      
      if (request) {
        if (type.endsWith('_SUCCESS')) {
          request.resolve(payload);
        } else if (type.endsWith('_ERROR')) {
          request.reject(new Error(error || 'Worker error'));
        }
        pendingRequests.current.delete(id);
      }
    };
    
    // 处理 Worker 错误
    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
      pendingRequests.current.forEach((request) => {
        request.reject(new Error('Worker crashed'));
      });
      pendingRequests.current.clear();
    };
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);
  
  const execute = useCallback(async (data: { operation: string; value: number }): Promise<{ result: any; time: number }> => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    const message: WorkerMessage = {
      id,
      type: 'EXECUTE',
      payload: data
    };
    
    return new Promise((resolve, reject) => {
      pendingRequests.current.set(id, { resolve, reject });
      workerRef.current!.postMessage(message);
    });
  }, []);
  
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      pendingRequests.current.clear();
    }
  }, []);
  
  return { execute, terminate };
}

/**
 * 通用 Worker Hook（保留旧接口兼容性）
 */
export function useWorker<T, R>(workerFunction: (data: T) => R | Promise<R>): {
  execute: (data: T) => Promise<R>;
  terminate: () => void;
} {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());

  useEffect(() => {
    const workerCode = `
      const workerHandler = ${workerFunction.toString()};
    `;
    workerRef.current = createWorkerFromCode(workerCode);
    
    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse<R>>) => {
      const { id, type, payload, error } = e.data;
      const request = pendingRequests.current.get(id);
      
      if (request) {
        if (type.endsWith('_SUCCESS')) {
          request.resolve(payload);
        } else if (type.endsWith('_ERROR')) {
          request.reject(new Error(error || 'Worker error'));
        }
        pendingRequests.current.delete(id);
      }
    };
    
    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
      pendingRequests.current.forEach((request) => {
        request.reject(new Error('Worker crashed'));
      });
      pendingRequests.current.clear();
    };
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [workerFunction]);
  
  const execute = useCallback(async (data: T): Promise<R> => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    const message: WorkerMessage<T> = {
      id,
      type: 'EXECUTE',
      payload: data
    };
    
    return new Promise((resolve, reject) => {
      pendingRequests.current.set(id, { resolve, reject });
      workerRef.current!.postMessage(message);
    });
  }, []);
  
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      pendingRequests.current.clear();
    }
  }, []);
  
  return { execute, terminate };
}
