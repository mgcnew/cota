import * as React from "react";
import { FixedSizeList, VariableSizeList, ListChildComponentProps } from "react-window";
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
 * Row component for FixedSizeList
 */
function FixedRow<T>({
  index,
  style,
  data,
}: ListChildComponentProps<{
  items: T[];
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
}>) {
  const { items, renderItem } = data;
  return <>{renderItem(items[index], index, style)}</>;
}

/**
 * Row component for VariableSizeList
 */
function VariableRow<T>({
  index,
  style,
  data,
}: ListChildComponentProps<{
  items: T[];
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
}>) {
  const { items, renderItem } = data;
  return <>{renderItem(items[index], index, style)}</>;
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
  width = '100%',
  className,
  innerClassName,
  keyExtractor,
  onScroll,
  initialScrollOffset = 0,
}: VirtualListProps<T>): JSX.Element {
  const listRef = React.useRef<FixedSizeList | VariableSizeList>(null);
  const isVariableHeight = typeof itemHeight === 'function';

  // Handle scroll events
  const handleScroll = React.useCallback(
    ({ scrollOffset }: { scrollOffset: number }) => {
      onScroll?.(scrollOffset);
    },
    [onScroll]
  );

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

  // Data to pass to row components
  const itemData = React.useMemo(
    () => ({ items, renderItem }),
    [items, renderItem]
  );

  // Render virtualized list
  if (isVariableHeight) {
    return (
      <VariableSizeList
        ref={listRef as React.RefObject<VariableSizeList>}
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemHeight as (index: number) => number}
        itemData={itemData}
        overscanCount={overscan}
        onScroll={handleScroll}
        initialScrollOffset={initialScrollOffset}
        className={cn("scrollbar-thin scrollbar-thumb-muted", className)}
        innerElementType={innerClassName ? 
          React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
            (props, ref) => <div ref={ref} className={innerClassName} {...props} />
          ) : undefined
        }
      >
        {VariableRow as React.ComponentType<ListChildComponentProps<typeof itemData>>}
      </VariableSizeList>
    );
  }

  return (
    <FixedSizeList
      ref={listRef as React.RefObject<FixedSizeList>}
      height={height}
      width={width}
      itemCount={items.length}
      itemSize={itemHeight as number}
      itemData={itemData}
      overscanCount={overscan}
      onScroll={handleScroll}
      initialScrollOffset={initialScrollOffset}
      className={cn("scrollbar-thin scrollbar-thumb-muted", className)}
      innerElementType={innerClassName ? 
        React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
          (props, ref) => <div ref={ref} className={innerClassName} {...props} />
        ) : undefined
      }
    >
      {FixedRow as React.ComponentType<ListChildComponentProps<typeof itemData>>}
    </FixedSizeList>
  );
}

export default VirtualList;
