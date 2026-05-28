import { useState, useCallback } from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

interface ShareButtonProps {
  title: string;
  variant?: 'hero' | 'inline';
}

export default function ShareButton({ title, variant = 'hero' }: ShareButtonProps) {
  const { t } = useTranslation('common');
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

  const heroClass = 'rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25';
  const inlineClass = 'rounded-full text-[var(--ink-3)] hover:bg-[var(--bg-2)] hover:text-[var(--ink)]';

  return (
    <div className="relative">
      <Button
        isIconOnly
        variant="ghost"
        className={variant === 'hero' ? heroClass : inlineClass}
        onPress={handleShare}
        aria-label={t('event.share_event')}
      >
        <Icon icon="mdi:share-variant" width={variant === 'hero' ? 22 : 18} />
      </Button>

      {/* Copied toast */}
      {copied && (
        <div className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-full bg-[var(--ink)] px-3 py-1.5 text-[12px] font-[600] text-white" style={{ boxShadow: 'var(--shadow-float)' }}>
          {t('event.link_copied')}
        </div>
      )}
    </div>
  );
}
