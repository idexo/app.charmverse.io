import { yupResolver } from '@hookform/resolvers/yup';
import { isValidName } from 'ethers/lib/utils';
import type { FieldValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isUUID, isUrl, isValidEmail } from 'lib/utils/strings';

import type { FieldType, FormFieldValue } from '../interfaces';

export function getInitialFormFieldValue(prop: { type: FieldType; value?: FormFieldValue }) {
  const value =
    prop.type === 'multiselect' || prop.type === 'person'
      ? // Convert to array if not already as yup expects array
        Array.isArray(prop.value)
        ? prop.value
        : []
      : prop.type === 'long_text'
      ? // convert to content and contentText for prosemirror document
        prop.value || {
          content: emptyDocument,
          contentText: ''
        }
      : prop.value || '';

  return value;
}

export function useFormFields({
  fields,
  onSubmit
}: {
  fields: {
    value?: any;
    id: string;
    required: boolean;
    type: FieldType;
  }[];
  onSubmit?: (values: FieldValues) => void;
}) {
  const {
    control,
    formState: { isValid, errors, isDirty, isSubmitting },
    watch,
    setValue,
    handleSubmit,
    reset,
    getValues
  } = useForm({
    mode: 'onChange',
    defaultValues: fields
      .filter((field) => field.type !== 'label')
      .reduce<Record<string, FormFieldValue>>((acc, prop) => {
        acc[prop.id] = getInitialFormFieldValue(prop);
        return acc;
      }, {}),
    resolver: yupResolver(
      yup.object(
        fields.reduce((acc, property) => {
          const isRequired = property.required;
          switch (property.type) {
            case 'text':
            case 'short_text':
            case 'text_multiline': {
              acc[property.id] = yup.string().test('is-required', 'Required', (value) => {
                return isRequired ? !!value : true;
              });
              break;
            }
            case 'date': {
              acc[property.id] = yup.string().test('is-date', 'Invalid date', (value) => {
                if (isRequired && !value) {
                  return false;
                }
                return value ? !Number.isNaN(new Date(value)) : true;
              });
              break;
            }
            case 'email': {
              acc[property.id] = yup.string().test('is-email', 'Invalid email', (value) => {
                if (isRequired && !value) {
                  return false;
                }

                return value ? isValidEmail(value) : true;
              });

              break;
            }
            case 'number': {
              acc[property.id] = yup.string().test('is-number', 'Invalid number', (value) => {
                if (isRequired && !value) {
                  return false;
                }

                return value ? !Number.isNaN(value) : true;
              });
              break;
            }
            case 'select': {
              acc[property.id] = yup.string().test('is-uuid', 'Invalid uuid', (value) => {
                if (isRequired && !value) {
                  return false;
                }

                return value ? isUUID(value) : true;
              });
              break;
            }
            case 'person':
            case 'multiselect': {
              acc[property.id] = yup
                .array()
                .of(yup.string().uuid())
                .test('is-uuid', 'Invalid uuid', (value) => {
                  if (isRequired) {
                    return value ? value.length !== 0 && value.every((v) => (v ? isUUID(v) : false)) : false;
                  }

                  return value ? value.every((v) => (v ? isUUID(v) : false)) : true;
                });
              break;
            }
            case 'phone': {
              acc[property.id] = yup.string().test('is-phone', 'Invalid phone number', (value) => {
                if (isRequired && !value) {
                  return false;
                }

                return value ? !!value.match(/^\+?[0-9]+$/) : true;
              });
              break;
            }
            case 'wallet': {
              acc[property.id] = yup.string().test('is-wallet', 'Invalid wallet address', (value) => {
                if (isRequired && !value) {
                  return false;
                }

                return value ? isAddress(value) || value.endsWith('.eth') || isValidName(value) : true;
              });
              break;
            }
            case 'url': {
              acc[property.id] = yup.string().test('is-url', 'Invalid url', (value) => {
                if (isRequired && !value) {
                  return false;
                }
                return value ? isUrl(value) : true;
              });
              break;
            }
            case 'long_text': {
              acc[property.id] = yup.object().test('is-required', 'Required', (value) => {
                if (isRequired && !value) {
                  return false;
                }

                return isRequired && value && 'content' in value
                  ? !checkIsContentEmpty(value.content as PageContent)
                  : true;
              });
              break;
            }
            default: {
              return acc;
            }
          }

          return acc;
        }, {} as Record<string, any>)
      )
    )
  });

  const values = watch() as Record<string, FormFieldValue>;

  function onFormChange(updatedFields: { id: string; value: FormFieldValue }[]) {
    updatedFields.forEach((updatedField) => {
      setValue(updatedField.id, updatedField.value, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true
      });
    });
  }

  return {
    values,
    control,
    isValid,
    errors,
    isDirty,
    setValue,
    getValues,
    isSubmitting,
    onSubmit: () => {
      if (!isDirty || !isValid) {
        return;
      }
      handleSubmit((_values) => {
        onSubmit?.(_values);
        // Reset dirty state after submit
        reset(_values, {
          keepDirty: false,
          keepDirtyValues: false
        });
      })();
    },
    onFormChange
  };
}
