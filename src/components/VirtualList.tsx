import React, { useState, useRef, useCallback } from 'react'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  bufferSize?: number
  onScroll?: (scrollTop: number) => void
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  bufferSize = 5,
  onScroll
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 计算可见区域的起始和结束索引
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
  const visibleCount = Math.ceil(containerHeight / itemHeight) + bufferSize * 2
  const endIndex = Math.min(items.length, startIndex + visibleCount)

  // 计算偏移量
  const offsetY = startIndex * itemHeight

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }, [onScroll])

  // 滚动到指定位置
  // const scrollToIndex = useCallback((index: number) => {
  //   if (containerRef.current) {
  //     const scrollPosition = index * itemHeight
  //     containerRef.current.scrollTop = scrollPosition
  //   }
  // }, [itemHeight])

  // 滚动到顶部
  // const scrollToTop = useCallback(() => {
  //   if (containerRef.current) {
  //     containerRef.current.scrollTop = 0
  //   }
  // }, [])

  // 滚动到底部
  // const scrollToBottom = useCallback(() => {
  //   if (containerRef.current) {
  //     containerRef.current.scrollTop = items.length * itemHeight
  //   }
  // }, [items.length, itemHeight])

  return (
    <div className={`virtual-list-container ${className}`}>
      <div
        ref={containerRef}
        className="virtual-list-scroll-container"
        style={{ height: containerHeight, overflow: 'auto' }}
        onScroll={handleScroll}
      >
        {/* 占位元素，用于撑开滚动区域 */}
        <div
          className="virtual-list-spacer"
          style={{ height: items.length * itemHeight }}
        />
        
        {/* 可见项目容器 */}
        <div
          className="virtual-list-content"
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'relative'
          }}
        >
          {items.slice(startIndex, endIndex).map((item, index) => (
            <div
              key={startIndex + index}
              className="virtual-list-item"
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface VirtualGridProps<T> {
  items: T[]
  itemWidth: number
  itemHeight: number
  containerWidth: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  bufferRows?: number
  gap?: number
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  className = '',
  bufferRows = 2,
  gap = 0
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 计算每行的列数
  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap))
  const rowsCount = Math.ceil(items.length / columnsCount)

  // 计算可见区域的行范围
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - bufferRows)
  const visibleRows = Math.ceil(containerHeight / (itemHeight + gap)) + bufferRows * 2
  const endRow = Math.min(rowsCount, startRow + visibleRows)

  // 计算偏移量
  const offsetY = startRow * (itemHeight + gap)

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // 获取指定行的项目
  const getRowItems = (rowIndex: number) => {
    const startIndex = rowIndex * columnsCount
    const endIndex = Math.min(startIndex + columnsCount, items.length)
    return items.slice(startIndex, endIndex)
  }

  return (
    <div className={`virtual-grid-container ${className}`}>
      <div
        ref={containerRef}
        className="virtual-grid-scroll-container"
        style={{ height: containerHeight, overflow: 'auto' }}
        onScroll={handleScroll}
      >
        {/* 占位元素 */}
        <div
          className="virtual-grid-spacer"
          style={{ height: rowsCount * (itemHeight + gap) - gap }}
        />
        
        {/* 可见行容器 */}
        <div
          className="virtual-grid-content"
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsCount}, ${itemWidth}px)`,
            gap: `${gap}px`
          }}
        >
          {Array.from({ length: endRow - startRow }, (_, i) => {
            const rowIndex = startRow + i
            const rowItems = getRowItems(rowIndex)
            
            return (
              <React.Fragment key={rowIndex}>
                {rowItems.map((item, colIndex) => {
                  const itemIndex = rowIndex * columnsCount + colIndex
                  return (
                    <div
                      key={itemIndex}
                      className="virtual-grid-item"
                      style={{ height: itemWidth }}
                    >
                      {renderItem(item, itemIndex)}
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default VirtualList