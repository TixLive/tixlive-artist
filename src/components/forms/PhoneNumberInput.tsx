import PhoneInputRHF from 'react-phone-number-input/react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface PhoneNumberInputProps<T extends FieldValues> {
	id?: string;
	name: Path<T>;
	control: Control<T>;
	label?: string;
	isRequired?: boolean;
	errorMessage?: string;
	defaultCountry?: string;
	placeholder?: string;
}

export default function PhoneNumberInput<T extends FieldValues>({
	id,
	name,
	control,
	label,
	isRequired,
	errorMessage,
	defaultCountry = 'MD',
	placeholder,
}: PhoneNumberInputProps<T>) {
	const inputId = id ?? `phone-${String(name)}`;
	const invalid = Boolean(errorMessage);

	return (
		<div className="space-y-1.5">
			{label && (
				<label
					htmlFor={inputId}
					className="block text-[0.75rem] font-[600] text-[var(--theme-text-muted)]"
				>
					{label}
					{isRequired && <span className="ml-0.5 text-[#DC2626]">*</span>}
				</label>
			)}
			<div
				className={`tixlive-phone-wrapper flex h-14 items-center rounded-xl border bg-[var(--theme-surface)] px-3 transition-colors focus-within:border-[var(--brand-primary)] ${
					invalid
						? 'border-[#DC2626]'
						: 'border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)]'
				}`}
			>
				<PhoneInputRHF
					id={inputId}
					name={name}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					control={control as any}
					defaultCountry={defaultCountry as Parameters<typeof PhoneInputRHF>[0]['defaultCountry']}
					international
					countryCallingCodeEditable={false}
					placeholder={placeholder}
					className="tixlive-phone-input flex-1"
				/>
			</div>
			{invalid && (
				<p className="text-[0.8125rem] text-[#DC2626]">{errorMessage}</p>
			)}
		</div>
	);
}
