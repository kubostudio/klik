'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatThousands?: boolean;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1600,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatThousands = false,
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Check user preference for reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      setHasStarted(true);
      setIsCompleted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          observer.disconnect();

          let startTimestamp: number | null = null;
          const startValue = 0;
          const endValue = value;

          // Out-expo easing curve: smooth explosive start and ultra-gentle stop
          const easeOutExpo = (x: number): number => {
            return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
          };

          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const elapsed = timestamp - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);

            const current = startValue + (endValue - startValue) * easedProgress;
            setDisplayValue(current);

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setDisplayValue(endValue);
              setIsCompleted(true);
            }
          };

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, hasStarted]);

  // Format the numerical output cleanly
  const formattedText = useMemo(() => {
    let numStr = displayValue.toFixed(decimals);
    if (formatThousands) {
      const parts = numStr.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      numStr = parts.join('.');
    }
    return `${prefix}${numStr}${suffix}`;
  }, [displayValue, decimals, formatThousands, prefix, suffix]);

  return (
    <span
      ref={elementRef}
      className={`${className} ${isCompleted ? 'counter--completed' : ''}`}
      style={{
        display: 'inline-block',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {formattedText}
    </span>
  );
}
