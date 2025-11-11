import { useCallback, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Contact {
  id: string;
  phone: string;
  name?: string;
}

interface Props {
  contacts: Contact[];
  onRemove: (id: string) => void;
}

const ITEM_HEIGHT = 48;
const BUFFER_SIZE = 5;

export function ContactListVirtualized({ contacts, onRemove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;

    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const end = Math.min(
      contacts.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    );

    setVisibleRange({ start, end });
  }, [contacts.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateVisibleRange);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    updateVisibleRange();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateVisibleRange]);

  const totalHeight = contacts.length * ITEM_HEIGHT;
  const offsetY = visibleRange.start * ITEM_HEIGHT;
  const visibleContacts = contacts.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto max-h-64 border rounded-md"
      style={{
        WebkitOverflowScrolling: 'touch',
        willChange: 'scroll-position',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {visibleContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              style={{ height: ITEM_HEIGHT }}
            >
              <span className="text-sm truncate flex-1">
                {contact.name || contact.phone}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(contact.id)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
