import { z } from 'zod';
import type { Label } from '../data/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLabels } from '../context/labels-context';
import { parseFile2Matrix, rgbaToHex } from '../utils';
import { ColorPicker, ColorPickerAlpha, ColorPickerEyeDropper, ColorPickerFormat, ColorPickerHue, ColorPickerOutput, ColorPickerSelection } from '@/components/ui/shadcn-io/color-picker';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Label name is required' }),
  file: z.instanceof(File, { message: 'Label file is required' }),
  color: z.string(),
  matrixColor: z.string(),
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
    defaultValues: currentRow
  })

  const onSubmit = async (values: UserForm) => {
    console.log('formValues', values)
    let matrixData: number[][] = [];
    if (values.file) {
      matrixData = await parseFile2Matrix(values.file);
      console.log('----- 坐标数据 -----')
      console.log(matrixData)
    }
    if (isEdit) {
      updateLabel({ ...currentRow, ...values, matrixData })
    } else {
      const label: Label = {
        id: crypto.randomUUID(),
        ...values,
        matrixData
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
          <FormField name="file" render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Matrix File</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="text"
                      readOnly
                      value={form.getValues('file')?.name || ''}
                      className="cursor-pointer pr-20"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = false;
                        input.accept = '.csv,.txt,.xlsx,.xls'
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            field.onChange(file);
                          }
                        };
                        input.click();
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute right-1 top-1 h-7"
                      onClick={() => {
                        field.onChange(null);
                      }}
                    >
                      清除
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }
          } />
          <FormField name='color' render={({ field }) =>
            <FormItem>
              <FormLabel>Label Color</FormLabel>
              <FormControl>
                <ColorPicker
                  defaultValue={currentRow?.color}
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
          <FormField name='matrixColor' render={({ field }) =>
            <FormItem>
              <FormLabel>Matrix Color</FormLabel>
              <FormControl>
                <ColorPicker
                  defaultValue={currentRow?.matrixColor}
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

