import { useState } from 'react';
import { Button, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { useTranslation } from 'next-i18next';
import { useUpdateMe } from '@/queries/me/useUpdateMe';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import type { IMe } from '@/types';

interface ProfileFormProps {
	initial: IMe;
}

type FormState = 'idle' | 'saving' | 'success' | 'error';

export default function ProfileForm({ initial }: ProfileFormProps) {
	const { t } = useTranslation('common');
	const [state, setState] = useState<FormState>('idle');
	const updateMe = useUpdateMe();

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
			.refine((v) => v === '' || isValidPhoneNumber(v), { message: t('profile.phone_invalid') }),
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
			await updateMe.mutateAsync(values);
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
				<h1 className="m-0 text-[28px] font-[800] tracking-[-0.028em] text-[var(--ink)] sm:text-[32px]">
					{t('account.profile')}
				</h1>
				<p className="mt-2 text-[14px] leading-[1.55] text-[var(--ink-3)]">
					{t('profile.subtitle')}
				</p>
			</div>

			<div className="space-y-6 rounded-[18px] bg-[var(--surface)] p-6 sm:p-7" style={{ boxShadow: 'var(--shadow-2)' }}>
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
									label: 'text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]',
									inputWrapper:
										'rounded-[14px] border border-[var(--line)] bg-[var(--bg)] px-4 shadow-none data-[hover=true]:bg-[var(--bg)] group-data-[focus=true]:border-[var(--ink)]',
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
									label: 'text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]',
									inputWrapper:
										'rounded-[14px] border border-[var(--line)] bg-[var(--bg)] px-4 shadow-none data-[hover=true]:bg-[var(--bg)] group-data-[focus=true]:border-[var(--ink)]',
									input: 'font-[family-name:var(--font-body)] text-[0.9375rem]',
								}}
							/>
						)}
					/>
				</div>

				<PhoneNumberInput
					name="phone"
					control={control}
					label={t('profile.phone')}
					errorMessage={errors.phone?.message}
				/>

				<div>
					<Input
						value={initial.email}
						label={t('profile.email')}
						labelPlacement="outside"
						isDisabled
						classNames={{
							label: 'text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]',
							inputWrapper:
								'rounded-[14px] border border-[var(--line)] bg-[var(--bg-2)] px-4 shadow-none',
							input: 'font-[family-name:var(--font-data)] text-[0.9375rem]',
						}}
					/>
					<p className="mt-2 text-[12px] text-[var(--ink-3)]">{t('profile.email_hint')}</p>
				</div>

				{state === 'success' && (
					<div
						className="flex items-center gap-2 rounded-[12px] px-4 py-3 text-[13.5px] font-[600]"
						style={{ background: 'rgba(61, 123, 92, 0.10)', color: '#2A5A42' }}
					>
						<Icon icon="mdi:check-circle" width={16} />
						{t('profile.saved')}
					</div>
				)}

				{state === 'error' && (
					<div className="flex items-center gap-2 rounded-[12px] bg-[#DC2626]/10 px-4 py-3 text-[13.5px] font-[600] text-[#DC2626]">
						<Icon icon="mdi:alert-circle-outline" width={16} />
						{t('profile.save_error')}
					</div>
				)}

				<div className="flex items-center justify-end gap-4 border-t border-[var(--line)] pt-5">
					{!isDirty && state === 'idle' && (
						<span className="text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
							{t('profile.no_changes')}
						</span>
					)}
					<Button
						type="submit"
						variant="solid"
						size="lg"
						className="rounded-full text-[14px] font-[600] tracking-[-0.005em] text-white"
						style={{ backgroundColor: 'var(--ink)' }}
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
