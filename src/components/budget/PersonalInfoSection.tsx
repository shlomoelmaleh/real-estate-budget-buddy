import { Control, Controller, FieldErrors } from 'react-hook-form';
import { UserCircle, User, Phone, Mail, Clock } from 'lucide-react';
import { FormSection } from '../FormSection';
import { FormInput } from '../FormInput';
import { Translations } from '@/lib/translations';
import { CalculatorFormValues } from './types';

interface PersonalInfoSectionProps {
  control: Control<CalculatorFormValues>;
  t: Translations;
  errors: FieldErrors<CalculatorFormValues>;
}

export function PersonalInfoSection({ control, t, errors }: PersonalInfoSectionProps) {
  return (
    <FormSection icon={<UserCircle className="w-5 h-5 text-primary" />} title={t.titlePersonal} variant="primary">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Controller
          name="fullName"
          control={control}
          render={({ field }) => (
            <FormInput
              label={t.fullName}
              icon={<User className="w-4 h-4" />}
              value={field.value}
              onChange={field.onChange}
              type="text"
              required
              hasError={!!errors.fullName}
            />
          )}
        />
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <FormInput
              label={t.phone}
              icon={<Phone className="w-4 h-4" />}
              value={field.value}
              onChange={field.onChange}
              type="tel"
              required
              hasError={!!errors.phone}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <FormInput
              label={t.email}
              icon={<Mail className="w-4 h-4" />}
              value={field.value}
              onChange={field.onChange}
              type="email"
              required
              hasError={!!errors.email}
            />
          )}
        />
        <Controller
          name="age"
          control={control}
          render={({ field }) => (
            <FormInput
              label={t.age}
              icon={<Clock className="w-4 h-4" />}
              value={field.value}
              onChange={field.onChange}
              formatNumber
              required
              hasError={!!errors.age}
            />
          )}
        />
      </div>
    </FormSection>
  );
}
