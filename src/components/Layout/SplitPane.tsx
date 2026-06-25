import { useRef, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { SizeUnit } from '../../layout/types';
import './SplitPane.css';

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical';
  initialSize: number;
  sizeUnit?: SizeUnit;
  minSize?: number;
  maxSize?: number;
  reverse?: boolean;
  onSizeChange: (size: number) => void;
  children: [ReactNode, ReactNode];
}

export default function SplitPane({
  direction,
  initialSize,
  sizeUnit = 'px',
  minSize = 100,
  maxSize = 800,
  reverse = false,
  onSizeChange,
  children,
}: SplitPaneProps) {
  const [size, setSize] = useState(initialSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startRef = useRef(0);
  const startSizeRef = useRef(0);

  const isHorizontal = direction === 'horizontal';

  useEffect(() => {
    setSize(initialSize);
  }, [initialSize]);

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startRef.current = isHorizontal ? e.clientX : e.clientY;
      startSizeRef.current = size;

      const container = containerRef.current?.parentElement;
      const getTotalDim = () => {
        if (!container) return 1;
        return isHorizontal ? container.clientWidth : container.clientHeight;
      };

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = (isHorizontal ? ev.clientX : ev.clientY) - startRef.current;
        let raw = isHorizontal
          ? startSizeRef.current + delta
          : startSizeRef.current - delta;

        if (sizeUnit === '%') {
          const total = getTotalDim();
          const deltaPct = (delta / total) * 100;
          raw = startSizeRef.current + deltaPct;
        }

        const clamped = Math.max(minSize, Math.min(maxSize, raw));
        setSize(clamped);
        onSizeChange(clamped);
      };

      const onUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [isHorizontal, size, sizeUnit, minSize, maxSize, onSizeChange],
  );

  const primaryStyle: React.CSSProperties = isHorizontal
    ? sizeUnit === '%'
      ? { flex: `0 0 ${size}%`, minWidth: minSize, maxWidth: maxSize }
      : { flexShrink: 0, width: size }
    : sizeUnit === '%'
      ? { flex: `0 0 ${size}%`, minHeight: minSize, maxHeight: maxSize }
      : { flexShrink: 0, height: size };

  const reverseClass = reverse ? ` split-pane--${direction}-reverse` : '';

  return (
    <div ref={containerRef} className={`split-pane split-pane--${direction}${reverseClass}`}>
      <div className="split-pane__primary" style={primaryStyle}>
        {children[0]}
      </div>
      <div
        className={`split-pane__handle split-pane__handle--${direction}`}
        onMouseDown={onDragStart}
      />
      <div className="split-pane__secondary">{children[1]}</div>
    </div>
  );
}
