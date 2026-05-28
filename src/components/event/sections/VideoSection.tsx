import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';

interface VideoSectionProps {
	videoUrl: string;
	aftermovieUrl?: string;
}

function getEmbedUrl(url: string): { embed: string; thumb?: string } | null {
	const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
	if (yt) {
		return {
			embed: `https://www.youtube.com/embed/${yt[1]}?autoplay=1`,
			thumb: `https://img.youtube.com/vi/${yt[1]}/maxresdefault.jpg`,
		};
	}
	const vimeo = url.match(/vimeo\.com\/(\d+)/);
	if (vimeo) return { embed: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` };
	return null;
}

function VideoEmbed({ url, label, fallbackTitle }: { url: string; label?: string; fallbackTitle: string }) {
	const parsed = getEmbedUrl(url);
	const [playing, setPlaying] = useState(false);
	if (!parsed) return null;

	return (
		<div>
			{label && (
				<p className="mb-3 text-[11px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
					{label}
				</p>
			)}
			<div
				className="relative aspect-video overflow-hidden rounded-[22px] bg-[var(--ink)]"
				style={{ boxShadow: 'var(--shadow-cinema)', cursor: playing ? 'default' : 'pointer' }}
				onClick={() => !playing && setPlaying(true)}
			>
				{playing ? (
					<iframe
						src={parsed.embed}
						title={label || fallbackTitle}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
						loading="lazy"
						sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
						className="absolute inset-0 h-full w-full border-0"
					/>
				) : (
					<>
						{parsed.thumb && (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={parsed.thumb}
								alt=""
								className="absolute inset-0 h-full w-full object-cover"
								style={{ filter: 'brightness(0.6) saturate(0.9)' }}
							/>
						)}
						<div className="absolute inset-0 flex items-center justify-center">
							<div
								className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-white/95 transition-transform duration-200 hover:scale-[1.08]"
								style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
							>
								<Icon icon="mdi:play" width={32} className="text-[var(--ink)]" />
							</div>
						</div>
					</>
				)}
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
			<div className="flex flex-col gap-5">
				{hasVideo && <VideoEmbed url={videoUrl} fallbackTitle={fallbackTitle} />}
				{hasAftermovie && (
					<VideoEmbed url={aftermovieUrl} label={t('sections.aftermovie')} fallbackTitle={fallbackTitle} />
				)}
			</div>
		</SectionShell>
	);
}
