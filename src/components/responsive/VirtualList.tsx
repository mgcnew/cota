import * as React from "react";
import { List, useDynamicRowHeight } from "react-window";
import type { ListImperativeAPI } from "react-window";
import { cn } from "@/lib/utils";

export interface VirtualListProps<T> {
  /**
   * Array of items to render
   */
  items: T[];
  /**
   * Height of each item (fixed) or function returning height for variable sizes
   */
  itemHeight: number | ((index: number) => number);
  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  /**
   * Minimum number of items to activate virtualization
   * @default 20
   */
  threshold?: number;
  /**
   * Number of items to render outside of the visible area
   * @default 5
   */
  overscan?: number;
  /**
   * Height of the list container
   * @default 400
   */
  height?: number;
  /**
   * Width of the list container
   * @default '100%'
   */
  width?: number | string;
  /**
   * Additional class name for the container
   */
  className?: string;
  /**
   * Additional class name for the inner container
   */
  innerClassName?: string;
  /**
   * Key extractor function for items
   */
  keyExtractor?: (item: T, index: number) => string | number;
  /**
   * Callback when scroll position changes
   */
  onScroll?: (scrollOffset: number) => void;
  /**
   * Initial scroll offset
   */
  initialScrollOffset?: number;
}


/**
 * Non-virtualized list for small item counts
 */
function SimpleList<T>({
  items,
  renderItem,
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item, index, {})}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * VirtualList - A wrapper component for react-window that provides virtualization
 * for long lists with configurable threshold.
 * 
 * Features:
 * - Configurable threshold (default 20 items) - below threshold renders normally
 * - Supports fixed and variable height items
 * - Configurable overscan for smoother scrolling
 * - Falls back to simple list for small item counts
 * - Optimized for mobile performance
 * 
 * @example
 * ```tsx
 * // Fixed height items
 * <VirtualList
 *   items={products}
 *   itemHeight={80}
 *   height={500}
 *   renderItem={(item, index, style) => (
 *     <div style={style}>
 *       <ProductCard product={item} />
 *     </div>
 *   )}
 * />
 * 
 * // Variable height items
 * <VirtualList
 *   items={messages}
 *   itemHeight={(index) => messages[index].expanded ? 120 : 60}
 *   height={400}
 *   renderItem={(item, index, style) => (
 *     <div style={style}>
 *       <MessageCard message={item} />
 *     </div>
 *   )}
 * />
 * ```
 * 
 * Requirements: 2.1, 4.5, 13.5, 15.5
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  threshold = 20,
  overscan = 5,
  height = 400,
  className,
}: VirtualListProps<T>): JSX.Element {
  const listRef = React.useRef<ListImperativeAPI>(null);
  const isVariableHeight = typeof itemHeight === 'function';
  
  // For dynamic row heights, use the hook
  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: typeof itemHeight === 'number' ? itemHeight : 60,
  });

  // If items count is below threshold, render without virtualization
  if (items.length <= threshold) {
    return (
      <SimpleList
        items={items}
        renderItem={renderItem}
        className={className}
      />
    );
  }

  // Determine row height to use
  const rowHeightValue = isVariableHeight 
    ? dynamicRowHeight 
    : (itemHeight as number);

  // Row props to pass to the row component
  const rowProps = React.useMemo(
    () => ({ items, renderItem }),
    [items, renderItem]
  );

  return (
    <List
      listRef={listRef}
      style={{ height, width: '100%' }}
      className={cn("scrollbar-thin scrollbar-thumb-muted", className)}
      rowCount={items.length}
      rowHeight={rowHeightValue}
      rowProps={rowProps}
      overscanCount={overscan}
      rowComponent={({ index, style, items: rowItems, renderItem: rowRenderItem }) => (
        <>{rowRenderItem(rowItems[index], index, style)}</>
      )}
    />
  );
}

export default VirtualList;
