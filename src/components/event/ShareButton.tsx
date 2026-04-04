import { useState, useCallback } from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface ShareButtonProps {
  title: string;
  variant?: 'hero' | 'inline';
}

export default function ShareButton({ title, variant = 'hero' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const text = `${title} — Get your tickets at ${url}`;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or API not available, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [title]);

  const heroClass = 'rounded-xl bg-white/15 text-white backdrop-blur-sm hover:bg-white/25';
  const inlineClass = 'rounded-xl text-[var(--theme-text-muted)] hover:text-[var(--brand-accent)] hover:bg-[var(--theme-surface)]';

  return (
    <div className="relative">
      <Button
        isIconOnly
        variant="ghost"
        className={variant === 'hero' ? heroClass : inlineClass}
        onPress={handleShare}
        aria-label="Share event"
      >
        <Icon icon="mdi:share-variant" width={variant === 'hero' ? 22 : 18} />
      </Button>

      {/* Copied toast */}
      {copied && (
        <div className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-xl bg-[var(--theme-text)] px-3 py-1.5 text-xs text-[var(--theme-bg)] shadow-lg">
          Link copied!
        </div>
      )}
    </div>
  );
}
