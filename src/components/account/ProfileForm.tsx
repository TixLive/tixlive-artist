import { useState } from 'react';
import { Button, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'next-i18next';
import type { IMe } from '@/types';

interface ProfileFormProps {
	initial: IMe;
}

type FormState = 'idle' | 'saving' | 'success' | 'error';

const PHONE_RE = /^\+?\d{7,15}$/;

export default function ProfileForm({ initial }: ProfileFormProps) {
	const { t } = useTranslation('common');
	const [state, setState] = useState<FormState>('idle');

	const schema = z.object({
		first_name: z
			.string()
			.trim()
			.min(1, t('profile.first_name_required'))
			.max(100, t('profile.too_long')),
		last_name: z
			.string()
			.trim()
			.min(1, t('profile.last_name_required'))
			.max(100, t('profile.too_long')),
		phone: z
			.string()
			.trim()
			.refine((v) => v === '' || PHONE_RE.test(v), { message: t('profile.phone_invalid') }),
	});

	type FormValues = z.infer<typeof schema>;

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty },
		reset,
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			first_name: initial.first_name ?? '',
			last_name: initial.last_name ?? '',
			phone: initial.phone ?? '',
		},
	});

	const onSubmit = async (values: FormValues) => {
		setState('saving');
		try {
			const res = await fetch('/api/me', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values),
			});

			if (!res.ok) {
				setState('error');
				return;
			}

			reset(values);
			setState('success');
			setTimeout(() => setState('idle'), 3000);
		} catch {
			setState('error');
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
			<div>
				<h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
					{t('account.profile')}
				</h1>
				<p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--theme-text-muted)]">
					{t('profile.subtitle')}
				</p>
			</div>

			<div className="space-y-6 rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-6 shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)] sm:p-7">
				<div className="grid gap-5 md:grid-cols-2">
					<Controller
						name="first_name"
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								label={t('profile.first_name')}
								labelPlacement="outside"
								placeholder=" "
								isInvalid={!!errors.first_name}
								errorMessage={errors.first_name?.message}
								classNames={{
									label: 'font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]',
									inputWrapper:
										'rounded-full border border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] bg-[var(--theme-bg)] px-5 shadow-none data-[hover=true]:bg-[var(--theme-bg)] group-data-[focus=true]:border-[var(--brand-accent)]',
									input: 'font-[family-name:var(--font-body)] text-[0.9375rem]',
								}}
							/>
						)}
					/>
					<Controller
						name="last_name"
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								label={t('profile.last_name')}
								labelPlacement="outside"
								placeholder=" "
								isInvalid={!!errors.last_name}
								errorMessage={errors.last_name?.message}
								classNames={{
									label: 'font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]',
									inputWrapper:
										'rounded-full border border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] bg-[var(--theme-bg)] px-5 shadow-none data-[hover=true]:bg-[var(--theme-bg)] group-data-[focus=true]:border-[var(--brand-accent)]',
									input: 'font-[family-name:var(--font-body)] text-[0.9375rem]',
								}}
							/>
						)}
					/>
				</div>

				<Controller
					name="phone"
					control={control}
					render={({ field }) => (
						<Input
							{...field}
							type="tel"
							label={t('profile.phone')}
							labelPlacement="outside"
							placeholder="+373 ..."
							isInvalid={!!errors.phone}
							errorMessage={errors.phone?.message}
							classNames={{
								label: 'font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]',
								inputWrapper:
									'rounded-full border border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] bg-[var(--theme-bg)] px-5 shadow-none data-[hover=true]:bg-[var(--theme-bg)] group-data-[focus=true]:border-[var(--brand-accent)]',
								input: 'font-[family-name:var(--font-body)] text-[0.9375rem]',
							}}
						/>
					)}
				/>

				<div>
					<Input
						value={initial.email}
						label={t('profile.email')}
						labelPlacement="outside"
						isDisabled
						classNames={{
							label: 'font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]',
							inputWrapper:
								'rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[color-mix(in_srgb,var(--theme-text)_4%,transparent)] px-5 shadow-none',
							input: 'font-[family-name:var(--font-data)] text-[0.9375rem]',
						}}
					/>
					<p className="mt-2 text-[0.75rem] text-[var(--theme-text-muted)]">
						{t('profile.email_hint')}
					</p>
				</div>

				{state === 'success' && (
					<div className="flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,#16A34A_25%,transparent)] bg-[color-mix(in_srgb,#16A34A_10%,transparent)] px-4 py-3 text-[0.875rem] text-[#16A34A]">
						<Icon icon="mdi:check" width={16} />
						{t('profile.saved')}
					</div>
				)}

				{state === 'error' && (
					<div className="flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,#DC2626_25%,transparent)] bg-[color-mix(in_srgb,#DC2626_10%,transparent)] px-4 py-3 text-[0.875rem] text-[#DC2626]">
						<Icon icon="mdi:alert-circle-outline" width={16} />
						{t('profile.save_error')}
					</div>
				)}

				<div className="flex items-center justify-end gap-4 border-t border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] pt-5">
					{!isDirty && state === 'idle' && (
						<span className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">
							{t('profile.no_changes')}
						</span>
					)}
					<Button
						type="submit"
						variant="solid"
						size="lg"
						className="rounded-full font-[family-name:var(--font-body)] text-[0.9375rem] font-[700] text-[var(--theme-bg)]"
						style={{ backgroundColor: 'var(--brand-primary)' }}
						isLoading={state === 'saving'}
						isDisabled={!isDirty || state === 'saving'}
					>
						{t('profile.save')}
					</Button>
				</div>
			</div>
		</form>
	);
}
