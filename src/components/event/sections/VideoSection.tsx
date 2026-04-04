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

function VideoEmbed({ url, label }: { url: string; label?: string }) {
	const embedUrl = getEmbedUrl(url);
	if (!embedUrl) return null;

	return (
		<div>
			{label && (
				<p className="mb-2 text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--theme-text-muted)]">
					{label}
				</p>
			)}
			<div className="relative aspect-video overflow-hidden rounded-xl">
				<iframe
					src={embedUrl}
					title={label || 'Event video'}
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
	const hasVideo = videoUrl && getEmbedUrl(videoUrl);
	const hasAftermovie = aftermovieUrl && getEmbedUrl(aftermovieUrl);

	if (!hasVideo && !hasAftermovie) return null;

	return (
		<section className="mt-8">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
				Video
			</h2>
			<div className="space-y-4">
				{hasVideo && <VideoEmbed url={videoUrl} />}
				{hasAftermovie && (
					<VideoEmbed url={aftermovieUrl} label="Aftermovie" />
				)}
			</div>
		</section>
	);
}
