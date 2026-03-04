import { z } from 'zod';
import type { Label } from '../data/schema';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLabels } from '../context/labels-context';
import { rgbaToHex } from '@/lib/utils';
import { ColorPicker, ColorPickerAlpha, ColorPickerEyeDropper, ColorPickerFormat, ColorPickerHue, ColorPickerOutput, ColorPickerSelection } from '@/components/ui/shadcn-io/color-picker';
import { genId } from '@/features/labeling/utils';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Label name is required' }),
  color: z.string(),
  pointRadius: z.number().optional(),
  minRadius: z.number().optional(),
  maxRadius: z.number().optional(),
})

type UserForm = z.infer<typeof formSchema>

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Label;
}

export const LabelActionDialog = ({ open, onOpenChange, currentRow }: Props) => {
  const { setLabels, updateLabel } = useLabels()
  const isEdit = !!currentRow;
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...currentRow,
    }
  })

  // 当对话框打开或数据变化时，重置表单
  useEffect(() => {
    if (open) {
      form.reset(currentRow || { name: '', color: '#000000' })
    }
  }, [open, currentRow, form])

  const onSubmit = async (values: UserForm) => {
    console.log('formValues', values)
    if (isEdit) {
      updateLabel({ ...currentRow, ...values })
    } else {
      const label: Label = {
        id: genId(),
        ...values,
      }
      setLabels(prev => [...prev, label])
    }
    onOpenChange(false)
  }

  return (<Dialog open={open} onOpenChange={(state) => onOpenChange(state)}>

    <DialogContent>
      <DialogTitle>
        {isEdit ? 'Edit Label' : 'Add Label'}
      </DialogTitle>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} id="label-form" className="space-y-6">
          <FormField name="name" render={({ field }) =>
            <FormItem>
              <FormLabel>Label Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          } />
          <FormField name='color' render={({ field }) =>
            <FormItem>
              <FormLabel>Label Color</FormLabel>
              <FormControl>
                <ColorPicker
                  key={currentRow?.id || 'new'}
                  defaultValue={field.value}
                  onChange={(rgba) => {
                    field.onChange(rgbaToHex(rgba as number[]));
                  }}
                  className="rounded-md border bg-background p-4 shadow-sm">
                  <ColorPickerSelection />
                  <div className="flex items-center gap-4">
                    <ColorPickerEyeDropper />
                    <div className="grid w-full gap-1">
                      <ColorPickerHue />
                      <ColorPickerAlpha />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ColorPickerOutput />
                    <ColorPickerFormat />
                  </div>
                </ColorPicker>
              </FormControl>
              <FormMessage />
            </FormItem>
          } />
        </form>
      </Form>
      <DialogFooter>
        <Button type='submit' form="label-form">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog >)
}

