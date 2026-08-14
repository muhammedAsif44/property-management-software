'use client';

import React, { CSSProperties, HTMLAttributes, useEffect, useMemo, useRef, useState } from 'react';

type TileState = {
  current: string;
  next: string;
  flipping: boolean;
  tick: number;
};

type AnimationPlan = {
  index: number;
  from: string;
  target: string;
  sequence: string[];
  start: number;
  step: number;
  done: boolean;
};

type TileUpdate = {
  index: number;
  current: string;
  next: string;
  done: boolean;
};

export interface SplitFlapTextProps extends HTMLAttributes<HTMLDivElement> {
  words?: string[];
  text?: string;
  flipDuration?: number;
  stagger?: number;
  cycleDelay?: number;
  charset?: 'alpha' | 'alphanumeric' | 'numeric' | (string & {});
  flipsPerChar?: number;
  tileColor?: string;
  textColor?: string;
  tileRadius?: number | string;
  gap?: number | string;
  fontSize?: number | string;
  loop?: boolean;
  padTo?: number;
  showSplitLine?: boolean;
}

const DEFAULT_WORDS = ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'];

const CHARSETS: Record<string, string> = {
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  numeric: '0123456789',
};

const styles = `
.split-flap-text {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: var(--split-flap-font-size, 24px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}
.split-flap-text__tile {
  position: relative;
  width: 0.82em;
  height: 1.25em;
  overflow: hidden;
  border-radius: var(--split-flap-radius, 6px);
  background: var(--split-flap-tile-color, #111827);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  perspective: 520px;
  transform-style: preserve-3d;
  isolation: isolate;
}
.split-flap-text__tile:before {
  content: '';
  position: absolute;
  z-index: 8;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.18);
  opacity: var(--split-line-opacity, 0.2);
  pointer-events: none;
}
.split-flap-text__tile:after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 9;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: inherit;
  pointer-events: none;
}
.split-flap-text__half,
.split-flap-text__flap {
  position: absolute;
  left: 0;
  width: 100%;
  height: 50%;
  overflow: hidden;
  background: var(--split-flap-tile-color, #111827);
  backface-visibility: hidden;
}
.split-flap-text__half--top,
.split-flap-text__flap--front {
  top: 0;
}
.split-flap-text__half--bottom,
.split-flap-text__flap--back {
  bottom: 0;
  background: color-mix(in srgb, var(--split-flap-tile-color, #111827) 94%, black);
}
.split-flap-text__char {
  position: absolute;
  left: 0;
  width: 100%;
  height: 200%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--split-flap-text-color, #f8fafc);
  font-weight: 800;
  text-shadow: none;
}
.split-flap-text__half--top .split-flap-text__char,
.split-flap-text__flap--front .split-flap-text__char {
  top: 0;
}
.split-flap-text__half--bottom .split-flap-text__char,
.split-flap-text__flap--back .split-flap-text__char {
  bottom: 0;
}
.split-flap-text__flap {
  z-index: 6;
  will-change: transform, filter;
  transform-style: preserve-3d;
}
.split-flap-text__flap--front {
  transform-origin: center bottom;
  animation: split-flap-front var(--split-flap-flip-duration, 0.12s) cubic-bezier(0.23, 1, 0.32, 1) both;
}
.split-flap-text__flap--back {
  transform-origin: center top;
  transform: rotateX(90deg);
  animation: split-flap-back var(--split-flap-flip-duration, 0.12s) cubic-bezier(0.23, 1, 0.32, 1) both;
}
@keyframes split-flap-front {
  0% { transform: rotateX(0deg); filter: brightness(1.05); }
  100% { transform: rotateX(-90deg); filter: brightness(0.65); }
}
@keyframes split-flap-back {
  0%, 45% { transform: rotateX(90deg); filter: brightness(0.7); }
  100% { transform: rotateX(0deg); filter: brightness(1); }
}
@media (prefers-reduced-motion: reduce) {
  .split-flap-text__flap { animation: none !important; }
}
`;

const toCssUnit = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const resolveCharset = (charset: SplitFlapTextProps['charset']) => {
  if (charset && CHARSETS[charset]) return CHARSETS[charset];
  return typeof charset === 'string' && charset.length > 0 ? charset : CHARSETS.alphanumeric;
};

const normalizePhrase = (phrase: string, width: number) => {
  const safe = String(phrase ?? '');
  return safe.padEnd(width, ' ').slice(0, width);
};

const createTiles = (phrase: string): TileState[] =>
  phrase.split('').map((char) => ({
    current: char,
    next: char,
    flipping: false,
    tick: 0,
  }));

const sampleChar = (charset: string) => charset.charAt(Math.floor(Math.random() * charset.length)) || ' ';

const buildSequence = (target: string, flips: number, charset: string) => {
  const steps: string[] = [];
  for (let i = 0; i < flips; i += 1) {
    steps.push(sampleChar(charset));
  }
  steps.push(target);
  return steps;
};

const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReduced(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
};

export const SplitFlapText: React.FC<SplitFlapTextProps> = ({
  words = ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'],
  text,
  flipDuration = 0.12,
  stagger = 0.06,
  cycleDelay = 2400,
  charset = 'alphanumeric',
  flipsPerChar = 8,
  tileColor = '#111827',
  textColor = '#f8fafc',
  tileRadius = 6,
  gap = 4,
  fontSize = 24,
  loop = true,
  padTo = 12,
  showSplitLine = false,
  className = '',
  style = {},
  ...props
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rafRef = useRef<number | null>(null);
  const cycleTimerRef = useRef<any>(null);
  const currentTextRef = useRef('');

  const sourceWords = Array.isArray(words) && words.length > 0 ? words : DEFAULT_WORDS;
  const phrasesKey = typeof text === 'string' ? text : sourceWords.map((word) => String(word ?? '')).join('\u001f');
  const phrases = useMemo(() => phrasesKey.split('\u001f'), [phrasesKey]);

  const width = useMemo(() => {
    const longest = phrases.reduce((max, phrase) => Math.max(max, phrase.length), 1);
    return Math.max(1, Math.ceil(Number(padTo) || 0), longest);
  }, [padTo, phrases]);

  const normalizedPhrases = useMemo(() => phrases.map((phrase) => normalizePhrase(phrase, width)), [phrases, width]);

  const [tiles, setTiles] = useState<TileState[]>(() => createTiles(normalizedPhrases[0] || ''));

  useEffect(() => {
    const clearAnimation = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (cycleTimerRef.current) {
        clearTimeout(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
    };

    clearAnimation();

    const firstPhrase = normalizedPhrases[0] || '';
    currentTextRef.current = firstPhrase;
    setTiles(createTiles(firstPhrase));

    if (normalizedPhrases.length <= 1 || typeof window === 'undefined') {
      return clearAnimation;
    }

    let phraseIndex = 0;
    let cancelled = false;

    const safeFlipMs = Math.max(40, (Number(flipDuration) || 0.12) * 1000);
    const safeStaggerMs = Math.max(0, (Number(stagger) || 0) * 1000);
    const safeCycleDelay = Math.max(400, Number(cycleDelay) || 2400);
    const safeFlips = Math.max(0, Math.floor(Number(flipsPerChar) || 0));
    const activeCharset = resolveCharset(charset);

    const animateTo = (targetPhrase: string) => {
      if (prefersReducedMotion) {
        currentTextRef.current = targetPhrase;
        setTiles(createTiles(targetPhrase));
        return 0;
      }

      const fromPhrase = normalizePhrase(currentTextRef.current, width);
      const targetChars = targetPhrase.split('');

      const plans = targetChars
        .map<AnimationPlan | null>((targetChar, index) => {
          const fromChar = fromPhrase[index] || ' ';
          if (fromChar === targetChar) return null;

          return {
            index,
            from: fromChar,
            target: targetChar,
            sequence: buildSequence(targetChar, safeFlips, activeCharset),
            start: index * safeStaggerMs,
            step: -1,
            done: false,
          };
        })
        .filter((plan): plan is AnimationPlan => plan !== null);

      if (!plans.length) {
        currentTextRef.current = targetPhrase;
        setTiles(createTiles(targetPhrase));
        return 0;
      }

      const totalDuration = plans.reduce(
        (max, plan) => Math.max(max, plan.start + plan.sequence.length * safeFlipMs),
        0
      );
      const startedAt = performance.now();

      const updateTiles = (updates: TileUpdate[]) => {
        setTiles((previous) => {
          const nextTiles = [...previous];
          updates.forEach((update) => {
            const tile = nextTiles[update.index];
            if (!tile) return;

            nextTiles[update.index] = {
              current: update.current,
              next: update.next,
              flipping: !update.done,
              tick: tile.tick + 1,
            };
          });
          return nextTiles;
        });
      };

      const tick = (now: number) => {
        if (cancelled) return;

        const elapsed = now - startedAt;
        const updates: TileUpdate[] = [];
        let shouldContinue = false;

        plans.forEach((plan) => {
          const localElapsed = elapsed - plan.start;

          if (localElapsed < 0) {
            shouldContinue = true;
            return;
          }

          const step = Math.floor(localElapsed / safeFlipMs);

          if (step < plan.sequence.length) {
            shouldContinue = true;

            if (step !== plan.step) {
              plan.step = step;
              updates.push({
                index: plan.index,
                current: step === 0 ? plan.from : plan.sequence[step - 1],
                next: plan.sequence[step],
                done: false,
              });
            }
          } else if (!plan.done) {
            plan.done = true;
            updates.push({
              index: plan.index,
              current: plan.target,
              next: plan.target,
              done: true,
            });
          }
        });

        if (updates.length > 0) updateTiles(updates);

        if (shouldContinue) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          currentTextRef.current = targetPhrase;
          rafRef.current = null;
        }
      };

      rafRef.current = requestAnimationFrame(tick);
      return totalDuration;
    };

    const scheduleNext = (delay: number) => {
      cycleTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;

        const nextIndex = phraseIndex + 1;

        if (nextIndex >= normalizedPhrases.length && !loop) return;

        phraseIndex = nextIndex % normalizedPhrases.length;
        const animationDuration = animateTo(normalizedPhrases[phraseIndex]);
        scheduleNext(safeCycleDelay + animationDuration);
      }, delay);
    };

    scheduleNext(safeCycleDelay);

    return () => {
      cancelled = true;
      clearAnimation();
    };
  }, [normalizedPhrases, width, loop, cycleDelay, flipDuration, stagger, flipsPerChar, charset, prefersReducedMotion]);

  const settledText = tiles
    .map((tile) => tile.current)
    .join('')
    .trimEnd();
  const componentStyle: CSSProperties & Record<string, string | number | undefined> = {
    '--split-flap-tile-color': tileColor,
    '--split-flap-text-color': textColor,
    '--split-flap-radius': toCssUnit(tileRadius),
    '--split-flap-gap': toCssUnit(gap),
    '--split-flap-font-size': toCssUnit(fontSize),
    '--split-flap-flip-duration': `${Math.max(0.04, Number(flipDuration) || 0.12)}s`,
    '--split-line-opacity': showSplitLine ? 0.2 : 0,
    ...style,
  };

  return (
    <>
      <style>{styles}</style>
      <div
        className={`split-flap-text inline-flex items-center whitespace-pre select-none ${className}`.trim()}
        style={componentStyle}
        role="text"
        aria-label={settledText || undefined}
        {...props}
      >
        {tiles.map((tile, index) => {
          const isSpace = tile.current === ' ' && tile.next === ' ' && !tile.flipping;

          return (
            <span
              className={`split-flap-text__tile flex items-center justify-center shrink-0 transition-opacity duration-200 ${
                isSpace ? 'opacity-0 border-transparent shadow-none bg-transparent' : ''
              }`}
              aria-hidden="true"
              key={`${index}-${tiles.length}`}
            >
              <span className="split-flap-text__half split-flap-text__half--top">
                <span className="split-flap-text__char">{tile.current === ' ' ? '\u00A0' : tile.current}</span>
              </span>
              <span className="split-flap-text__half split-flap-text__half--bottom">
                <span className="split-flap-text__char">{tile.flipping ? tile.next : tile.current}</span>
              </span>

              {tile.flipping && (
                <>
                  <span
                    className="split-flap-text__flap split-flap-text__flap--front"
                    key={`front-${index}-${tile.tick}`}
                  >
                    <span className="split-flap-text__char">{tile.current === ' ' ? '\u00A0' : tile.current}</span>
                  </span>
                  <span className="split-flap-text__flap split-flap-text__flap--back" key={`back-${index}-${tile.tick}`}>
                    <span className="split-flap-text__char">{tile.next === ' ' ? '\u00A0' : tile.next}</span>
                  </span>
                </>
              )}
            </span>
          );
        })}
      </div>
    </>
  );
};

export default SplitFlapText;
