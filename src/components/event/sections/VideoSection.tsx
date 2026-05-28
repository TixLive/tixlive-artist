import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';

interface VideoSectionProps {
	videoUrl: string;
	aftermovieUrl?: string;
}

function getEmbedUrl(url: string): string | null {
	// YouTube
	const ytMatch = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
	);
	if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

	// Vimeo
	const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
	if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

	return null;
}

function VideoEmbed({ url, label, fallbackTitle }: { url: string; label?: string; fallbackTitle: string }) {
	const embedUrl = getEmbedUrl(url);
	if (!embedUrl) return null;

	return (
		<div>
			{label && (
				<p className="mb-3 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
					{label}
				</p>
			)}
			<div className="relative aspect-video overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--brand-primary)]">
				<iframe
					src={embedUrl}
					title={label || fallbackTitle}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					loading="lazy"
					sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
					className="absolute inset-0 h-full w-full"
				/>
			</div>
		</div>
	);
}

export default function VideoSection({ videoUrl, aftermovieUrl }: VideoSectionProps) {
	const { t } = useTranslation('common');
	const hasVideo = videoUrl && getEmbedUrl(videoUrl);
	const hasAftermovie = aftermovieUrl && getEmbedUrl(aftermovieUrl);

	if (!hasVideo && !hasAftermovie) return null;

	const fallbackTitle = t('sections.event_video');

	return (
		<SectionShell label={t('sections.video')}>
			<div className="space-y-5">
				{hasVideo && <VideoEmbed url={videoUrl} fallbackTitle={fallbackTitle} />}
				{hasAftermovie && (
					<VideoEmbed url={aftermovieUrl} label={t('sections.aftermovie')} fallbackTitle={fallbackTitle} />
				)}
			</div>
		</SectionShell>
	);
}
