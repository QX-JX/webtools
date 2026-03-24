/**
 * 工具结果导出功能
 * 支持多种格式：JSON、CSV、TXT、XML、PDF
 */

import i18n from '../i18n/config'

export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  includeMetadata?: boolean
  prettyPrint?: boolean
}

export interface ExportMetadata {
  tool: string
  timestamp: string
  url: string
  userAgent: string
  version: string
}

/**
 * 基础导出类
 */
export class DataExporter {
  private static readonly DEFAULT_FILENAME = 'export'
  private static readonly VERSION = '1.0.0'

  /**
   * 导出数据
   */
  static export(data: any, options: ExportOptions): void {
    const { format, filename, includeMetadata = true, prettyPrint = true } = options
    
    let content: string
    let mimeType: string
    let extension: string

    switch (format) {
      case 'json':
        content = this.exportToJSON(data, includeMetadata, prettyPrint)
        mimeType = 'application/json'
        extension = 'json'
        break
      case 'csv':
        content = this.exportToCSV(data, includeMetadata)
        mimeType = 'text/csv'
        extension = 'csv'
        break
      case 'txt':
        content = this.exportToTXT(data, includeMetadata)
        mimeType = 'text/plain'
        extension = 'txt'
        break
      case 'xml':
        content = this.exportToXML(data, includeMetadata, prettyPrint)
        mimeType = 'application/xml'
        extension = 'xml'
        break
      case 'pdf':
        content = this.exportToPDF(data, includeMetadata)
        mimeType = 'text/html'
        extension = 'html'
        break
      default:
        throw new Error(i18n.t('exporter.unsupportedFormat', { format }))
    }

    const finalFilename = `${filename || this.DEFAULT_FILENAME}_${Date.now()}.${extension}`
    this.downloadFile(content, finalFilename, mimeType)
  }

  /**
   * 获取元数据
   */
  private static getMetadata(tool: string): ExportMetadata {
    return {
      tool,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      version: this.VERSION
    }
  }

  /**
   * JSON 导出
   */
  private static exportToJSON(data: any, includeMetadata: boolean, prettyPrint: boolean): string {
    let exportData = data
    
    if (includeMetadata) {
      exportData = {
        data,
        metadata: this.getMetadata('unknown')
      }
    }

    return JSON.stringify(exportData, null, prettyPrint ? 2 : 0)
  }

  /**
   * CSV 导出
   */
  private static exportToCSV(data: any, includeMetadata: boolean): string {
    if (!Array.isArray(data)) {
      // 如果不是数组，尝试转换为数组
      if (typeof data === 'object' && data !== null) {
        data = [data]
      } else {
        throw new Error(i18n.t('exporter.csvRequiresArrayOrObject'))
      }
    }

    if (data.length === 0) {
      return ''
    }

    // 获取所有可能的键
    const allKeys = new Set<string>()
    data.forEach((item: any) => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key))
      }
    })

    const headers = Array.from(allKeys)
    const rows = data.map((item: any) => {
      return headers.map(header => {
        const value = this.getNestedValue(item, header)
        return this.escapeCSVValue(value)
      })
    })

    let csv = headers.join(',') + '\n'
    rows.forEach((row: any[]) => {
      csv += row.join(',') + '\n'
    })

    if (includeMetadata) {
      const metadata = this.getMetadata('unknown')
      csv += '\n\nMetadata:\n'
      csv += `Tool,${metadata.tool}\n`
      csv += `Timestamp,${metadata.timestamp}\n`
      csv += `URL,${metadata.url}\n`
      csv += `Version,${metadata.version}\n`
    }

    return csv
  }

  /**
   * TXT 导出
   */
  private static exportToTXT(data: any, includeMetadata: boolean): string {
    let txt = ''
    
    if (includeMetadata) {
      const metadata = this.getMetadata('unknown')
      txt += `=== ${i18n.t('exporter.toolUsageInfo')} ===\n`
      txt += `${i18n.t('exporter.tool')}: ${metadata.tool}\n`
      txt += `${i18n.t('exporter.time')}: ${metadata.timestamp}\n`
      txt += `${i18n.t('exporter.url')}: ${metadata.url}\n`
      txt += `${i18n.t('exporter.version')}: ${metadata.version}\n`
      txt += '===================\n\n'
    }

    txt += this.formatAsText(data, 0)
    return txt
  }

  /**
   * XML 导出
   */
  private static exportToXML(data: any, includeMetadata: boolean, prettyPrint: boolean): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    if (includeMetadata) {
      const metadata = this.getMetadata('unknown')
      xml += '<export>\n'
      xml += '  <metadata>\n'
      xml += `    <tool>${metadata.tool}</tool>\n`
      xml += `    <timestamp>${metadata.timestamp}</timestamp>\n`
      xml += `    <url>${metadata.url}</url>\n`
      xml += `    <version>${metadata.version}</version>\n`
      xml += '  </metadata>\n'
      xml += '  <data>\n'
      xml += this.objectToXML(data, prettyPrint ? 2 : 0)
      xml += '  </data>\n'
      xml += '</export>'
    } else {
      xml += this.objectToXML(data, 0)
    }

    return xml
  }

  /**
   * 对象转换为 XML
   */
  private static objectToXML(obj: any, indent: number): string {
    const spaces = '  '.repeat(indent)
    let xml = ''

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        xml += `${spaces}<item index="${index}">\n`
        xml += this.objectToXML(item, indent + 1)
        xml += `${spaces}</item>\n`
      })
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const value = obj[key]
        const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_')
        
        if (typeof value === 'object' && value !== null) {
          xml += `${spaces}<${safeKey}>\n`
          xml += this.objectToXML(value, indent + 1)
          xml += `${spaces}</${safeKey}>\n`
        } else {
          xml += `${spaces}<${safeKey}>${this.escapeXML(value)}</${safeKey}>\n`
        }
      })
    } else {
      xml += `${spaces}${this.escapeXML(obj)}\n`
    }

    return xml
  }

  /**
   * 获取嵌套值
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : ''
    }, obj)
  }

  /**
   * CSV 值转义
   */
  private static escapeCSVValue(value: any): string {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  /**
   * XML 值转义
   */
  private static escapeXML(value: any): string {
    if (value === null || value === undefined) return ''
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * 格式化为文本
   */
  private static formatAsText(obj: any, indent: number): string {
    const spaces = '  '.repeat(indent)
    let text = ''

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        text += `${spaces}[${index}]:\n`
        text += this.formatAsText(item, indent + 1)
        text += '\n'
      })
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const value = obj[key]
        if (typeof value === 'object' && value !== null) {
          text += `${spaces}${key}:\n`
          text += this.formatAsText(value, indent + 1)
        } else {
          text += `${spaces}${key}: ${value}\n`
        }
      })
    } else {
      text += `${spaces}${obj}\n`
    }

    return text
  }

  /**
   * PDF 导出（生成HTML格式用于打印）
   */
  private static exportToPDF(data: any, includeMetadata: boolean): string {
    let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DNS查询结果</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 10px 0 0 0;
        }
        .summary {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .summary h2 {
            margin: 0 0 10px 0;
            color: #1e40af;
            font-size: 20px;
        }
        .record-section {
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        .record-header {
            background: #3b82f6;
            color: white;
            padding: 15px 20px;
            margin: 0;
            font-size: 18px;
            font-weight: bold;
        }
        .record-content {
            padding: 20px;
        }
        .record-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .record-item:last-child {
            margin-bottom: 0;
        }
        .record-value {
            font-family: 'Consolas', 'Monaco', monospace;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 8px 12px;
            margin: 8px 0;
            word-break: break-all;
        }
        .record-meta {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #666;
            margin-top: 8px;
        }
        .metadata {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #666;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .record-section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${i18n.t('exporter.dnsReportTitle')}</h1>
        <p>${i18n.t('exporter.dnsReportDescription')}</p>
    </div>
`

    if (data.domain && data.records) {
      // DNS查询结果格式
      html += `
    <div class="summary">
        <h2>${i18n.t('exporter.summaryTitle')}</h2>
        <p><strong>${i18n.t('exporter.domain')}：</strong>${data.domain}</p>
        <p><strong>${i18n.t('exporter.recordCount')}：</strong>${i18n.t('exporter.recordCountValue', { count: data.records.length })}</p>
        <p><strong>${i18n.t('exporter.queryTime')}：</strong>${new Date().toLocaleString('zh-CN')}</p>
    </div>
`

      // 按类型分组记录
      const groupedRecords: { [key: string]: any[] } = {}
      data.records.forEach((record: any) => {
        if (!groupedRecords[record.type]) {
          groupedRecords[record.type] = []
        }
        groupedRecords[record.type].push(record)
      })

      // 生成每种类型的记录
      Object.entries(groupedRecords).forEach(([type, records]) => {
        const typeDescriptions: { [key: string]: string } = {
          'A': i18n.t('exporter.typeDescriptions.A'),
          'AAAA': i18n.t('exporter.typeDescriptions.AAAA'),
          'MX': i18n.t('exporter.typeDescriptions.MX'),
          'TXT': i18n.t('exporter.typeDescriptions.TXT'),
          'CNAME': i18n.t('exporter.typeDescriptions.CNAME'),
          'NS': i18n.t('exporter.typeDescriptions.NS'),
          'SOA': i18n.t('exporter.typeDescriptions.SOA')
        }

        html += `
    <div class="record-section">
        <h3 class="record-header">${type} ${i18n.t('exporter.record')} (${typeDescriptions[type] || i18n.t('exporter.otherRecords')}) - ${i18n.t('exporter.recordCountValue', { count: records.length })}</h3>
        <div class="record-content">
`

        records.forEach((record: any, index: number) => {
          html += `
            <div class="record-item">
                <strong>${i18n.t('exporter.recordIndex', { index: index + 1 })}:</strong>
                <div class="record-value">${record.value}</div>
                <div class="record-meta">
`
          if (record.ttl !== undefined) {
            html += `<span><strong>TTL:</strong> ${record.ttl}</span>`
          }
          if (record.priority !== undefined) {
            html += `<span><strong>${i18n.t('exporter.priority')}:</strong> ${record.priority}</span>`
          }
          if (record.class) {
            html += `<span><strong>${i18n.t('exporter.class')}:</strong> ${record.class}</span>`
          }
          html += `
                </div>
            </div>
`
        })

        html += `
        </div>
    </div>
`
      })
    } else {
      // 通用数据格式
      html += `
    <div class="summary">
        <h2>${i18n.t('exporter.exportData')}</h2>
        <pre style="background: #f8fafc; padding: 20px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
    </div>
`
    }

    if (includeMetadata) {
      const metadata = this.getMetadata(i18n.t('exporter.dnsToolName'))
      html += `
    <div class="metadata">
        <h3>${i18n.t('exporter.exportInfo')}</h3>
        <p><strong>${i18n.t('exporter.tool')}：</strong>${metadata.tool}</p>
        <p><strong>${i18n.t('exporter.exportTime')}：</strong>${new Date(metadata.timestamp).toLocaleString('zh-CN')}</p>
        <p><strong>${i18n.t('exporter.version')}：</strong>${metadata.version}</p>
    </div>
`
    }

    html += `
</body>
</html>
`

    return html
  }
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    // 对于HTML格式的PDF，直接在新窗口打开用于打印
    if (mimeType === 'text/html' && filename.includes('.html')) {
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(content)
        newWindow.document.close()
        // 延迟一下再触发打印对话框
        setTimeout(() => {
          newWindow.print()
        }, 500)
      }
      return
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}

/**
 * 工具特定的导出器
 */
export class ToolExporter {
  /**
   * DNS 查询结果导出
   */
  static exportDNSResults(records: any[], domain: string, options: ExportOptions): void {
    const data = {
      domain,
      records: records.map(record => ({
        type: record.type,
        name: record.name,
        value: record.value,
        ttl: record.ttl,
        class: record.class
      }))
    }
    
    const finalOptions = {
      ...options,
      filename: `dns_lookup_${domain}`
    }
    
    DataExporter.export(data, finalOptions)
  }

  /**
   * WHOIS 查询结果导出
   */
  static exportWhoisResults(result: any, domain: string, options: ExportOptions): void {
    const data = {
      domain,
      result: {
        domainName: result.domainName,
        registrar: result.registrar,
        creationDate: result.creationDate,
        expirationDate: result.expirationDate,
        updatedDate: result.updatedDate,
        nameServers: result.nameServers,
        status: result.status,
        registrant: result.registrant,
        dnssec: result.dnssec
      }
    }
    
    const finalOptions = {
      ...options,
      filename: `whois_lookup_${domain}`
    }
    
    DataExporter.export(data, finalOptions)
  }

  /**
   * 通用工具结果导出
   */
  static exportToolResults(toolName: string, data: any, options: ExportOptions): void {
    const finalOptions = {
      ...options,
      filename: `${toolName}_${Date.now()}`
    }
    
    DataExporter.export(data, finalOptions)
  }
}

/**
 * 导出格式选项
 */
export const exportFormats: { value: ExportFormat; label: string; icon: string; description: string }[] = [
  { value: 'json', label: 'JSON', icon: '📄', description: i18n.t('exporter.formats.json') },
  { value: 'csv', label: 'CSV', icon: '📊', description: i18n.t('exporter.formats.csv') },
  { value: 'txt', label: 'TXT', icon: '📝', description: i18n.t('exporter.formats.txt') },
  { value: 'xml', label: 'XML', icon: '🗂️', description: i18n.t('exporter.formats.xml') },
  { value: 'pdf', label: 'PDF', icon: '📑', description: i18n.t('exporter.formats.pdf') }
]
