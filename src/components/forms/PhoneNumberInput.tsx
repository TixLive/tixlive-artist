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
		<div className="flex flex-col gap-1.5">
			{label && (
				<label
					htmlFor={inputId}
					className="block text-[12px] font-[600] tracking-[-0.005em] text-[var(--ink-3)]"
				>
					{label}
					{isRequired && <span className="ml-0.5 text-[#DC2626]">*</span>}
				</label>
			)}
			<div
				className={`tixlive-phone-wrapper flex h-[56px] items-stretch rounded-[14px] border bg-[var(--surface)] px-4 transition-colors duration-150 focus-within:border-[var(--ink)] ${
					invalid ? 'border-[#DC2626]' : 'border-[var(--line)]'
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
			{invalid && <p className="m-0 text-[12px] text-[#DC2626]">{errorMessage}</p>}
		</div>
	);
}
