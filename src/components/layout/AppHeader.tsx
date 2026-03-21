import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

interface AppHeaderProps {
	organizerName: string;
	logoUrl?: string | null;
}

export default function AppHeader({ organizerName, logoUrl }: AppHeaderProps) {
	const { t } = useTranslation('common');
	const [searchOpen, setSearchOpen] = useState(false);

	return (
		<header className="sticky top-0 z-50 border-b border-default-200 bg-[var(--theme-bg)]/80 backdrop-blur-md">
			<div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
				{/* Logo / Search toggle on mobile */}
				{searchOpen ? (
					<div className="flex flex-1 items-center gap-2">
						<Input
							autoFocus
							size="sm"
							placeholder={t('header.search_placeholder')}
							startContent={<Icon icon="mdi:magnify" className="text-default-400" width={18} />}
							classNames={{ inputWrapper: 'bg-[var(--theme-surface)]' }}
						/>
						<Button isIconOnly size="sm" variant="light" onPress={() => setSearchOpen(false)}>
							<Icon icon="mdi:close" width={20} />
						</Button>
					</div>
				) : (
					<>
						{/* Logo */}
						<Link href="/" className="flex shrink-0 items-center gap-2">
							{logoUrl ? (
								<Image src={logoUrl} alt={organizerName} width={32} height={32} className="rounded" />
							) : (
								<span className="text-lg font-bold text-[var(--brand-primary)]">{organizerName}</span>
							)}
						</Link>

						{/* Desktop search */}
						<div className="ml-auto hidden flex-1 justify-center sm:flex">
							<Input
								size="sm"
								placeholder={t('header.search_placeholder')}
								startContent={<Icon icon="mdi:magnify" className="text-default-400" width={18} />}
								classNames={{
									base: 'max-w-xs',
									inputWrapper: 'bg-[var(--theme-surface)]',
								}}
							/>
						</div>

						{/* Right actions */}
						<div className="ml-auto flex items-center gap-1 sm:ml-0">
							{/* Mobile search toggle */}
							<Button
								isIconOnly
								size="sm"
								variant="light"
								className="sm:hidden"
								onPress={() => setSearchOpen(true)}
							>
								<Icon icon="mdi:magnify" width={20} />
							</Button>

							{/* My Tickets */}
							<Button
								as={Link}
								href="/my-tickets"
								size="sm"
								variant="light"
								startContent={<Icon icon="mdi:ticket-outline" width={20} />}
							>
								<span className="hidden sm:inline">{t('header.my_tickets')}</span>
							</Button>
						</div>
					</>
				)}
			</div>
		</header>
	);
}
