/**
 * 数学计算 Worker
 * 用于执行复杂的数学运算
 */

export interface MathWorkerData {
  operation: 'factorial' | 'fibonacci' | 'prime' | 'factorization'
  value: number
  limit?: number
}

export interface MathWorkerResult {
  result: number | string | number[] | boolean
  time: number
}

export function mathWorker(data: MathWorkerData): MathWorkerResult {
  const startTime = performance.now();
  
  switch (data.operation) {
    case 'factorial':
      return {
        result: calculateFactorial(data.value),
        time: performance.now() - startTime
      };
    
    case 'fibonacci':
      return {
        result: calculateFibonacci(data.value),
        time: performance.now() - startTime
      };
    
    case 'prime':
      return {
        result: isPrime(data.value),
        time: performance.now() - startTime
      };
    
    case 'factorization':
      return {
        result: primeFactorization(data.value),
        time: performance.now() - startTime
      };
    
    default:
      throw new Error(`Unknown operation: ${data.operation}`);
  }
}

function calculateFactorial(n: number): number | string {
  if (n < 0) throw new Error('Factorial is not defined for negative numbers');
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

function calculateFibonacci(n: number): number {
  if (n < 0) throw new Error('Fibonacci is not defined for negative numbers');
  if (n === 0) return 0;
  if (n === 1) return 1;
  
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function primeFactorization(n: number): number[] {
  if (n < 2) return [];
  
  const factors: number[] = [];
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