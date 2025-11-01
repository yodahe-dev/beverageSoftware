'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@/app/common/components/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type InputType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'money'
  | 'select'
  | 'custom';

export interface PopoverField {
  label: string;
  type: InputType;
  value: string | number | null;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  customComponent?: React.ReactNode;
}

interface FormPopoverProps {
  trigger: React.ReactNode;
  fields: PopoverField[];
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onSave: (values: Record<string, string | number | null>) => void | Promise<void>;
}

export const FormPopover: React.FC<FormPopoverProps> = ({
  trigger,
  fields,
  title = 'Confirm Action',
  confirmText = 'Save',
  cancelText = 'Cancel',
  danger = false,
  onSave,
}) => {
  const [open, setOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState<Record<string, string | number | null>>(
    fields.reduce((acc, f) => ({ ...acc, [f.label]: f.value }), {})
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setFormValues(fields.reduce((acc, f) => ({ ...acc, [f.label]: f.value }), {}));
    setErrors({});
  }, [fields]);

  const handleChange = (label: string, value: string | number | null) => {
    setFormValues(prev => ({ ...prev, [label]: value }));
    if (errors[label]) setErrors(prev => ({ ...prev, [label]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach(f => {
      if (f.required && (formValues[f.label] === null || formValues[f.label] === '')) {
        newErrors[f.label] = `${f.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setConfirmOpen(false);
    setLoading(true);
    try {
      await onSave(formValues);
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="bg-[#121212] border border-gray-700 p-0 rounded-xl shadow-lg w-[320px] sm:w-[450px]">
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">{title}</h3>

              <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
                {fields.map(f => (
                  <div key={f.label} className="flex flex-col">
                    <Label className="text-gray-300">{f.label}</Label>

                    {f.type === 'text' && (
                      <Input
                        value={(formValues[f.label] as string) || ''}
                        placeholder={f.placeholder}
                        onChange={e => handleChange(f.label, e.target.value)}
                        className={`bg-gray-900 text-white border-gray-700 focus:ring-2 focus:ring-[#00cec9] transition-all`}
                      />
                    )}

                    {f.type === 'number' && (
                      <Input
                        type="number"
                        value={(formValues[f.label] as number) ?? 0}
                        placeholder={f.placeholder}
                        onChange={e => handleChange(f.label, Number(e.target.value))}
                        className={`bg-gray-900 text-white border-gray-700 focus:ring-2 focus:ring-[#00cec9] transition-all`}
                      />
                    )}

                    {f.type === 'decimal' && (
                      <Input
                        type="number"
                        step="0.01"
                        value={(formValues[f.label] as number) ?? 0}
                        placeholder={f.placeholder}
                        onChange={e => handleChange(f.label, parseFloat(e.target.value))}
                        className={`bg-gray-900 text-white border-gray-700 focus:ring-2 focus:ring-[#00cec9] transition-all`}
                      />
                    )}

                    {f.type === 'money' && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">ETB</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={(formValues[f.label] as number) ?? 0}
                          placeholder={f.placeholder}
                          onChange={e => handleChange(f.label, parseFloat(e.target.value))}
                          className="bg-gray-900 text-white border-gray-700 flex-1 focus:ring-2 focus:ring-[#00cec9] transition-all"
                        />
                      </div>
                    )}

                    {f.type === 'select' && (
                      <Select
                        value={String(formValues[f.label] ?? '')}
                        onValueChange={val => {
                          const opt = f.options?.find(o => String(o.value) === val);
                          handleChange(f.label, opt ? opt.value : val);
                        }}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue placeholder={f.placeholder || 'Select'} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {f.options?.map(o => (
                            <SelectItem key={o.value} value={String(o.value)}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {f.type === 'custom' && f.customComponent}

                    {errors[f.label] && <p className="text-red-500 text-sm mt-1">{errors[f.label]}</p>}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  onClick={() => setOpen(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={() => setConfirmOpen(true)}
                  className={`${
                    danger
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gradient-to-r from-[#00cec9] to-[#a8eb12] text-black hover:from-[#00b894] hover:to-[#a8eb12]'
                  }`}
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </PopoverContent>
      </Popover>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={danger ? 'Are you sure?' : 'Confirm Action'}
        description={danger ? 'This action cannot be undone.' : 'Do you want to save the changes?'}
        confirmText={confirmText}
        cancelText={cancelText}
        danger={danger}
        loading={loading}
        onConfirm={handleSave}
      />
    </>
  );
};
