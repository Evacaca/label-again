import { z } from 'zod';
import type { Label } from '../data/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLabels } from '../context/labels-context';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Label name is required' }),
})

type UserForm = z.infer<typeof formSchema>

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Label;
}

export const LabelActionDialog = ({ open, onOpenChange, currentRow }: Props) => {
  const { setLabels } = useLabels()
  const isEdit = !!currentRow;
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentRow?.name,
    }
  })

  const onSubmit = (values: UserForm) => {
    if (isEdit) {
      setLabels(prev => prev.map(label => label.id === currentRow?.id ? { ...label, ...values } : label))
    } else {
      const label: Label = {
        id: crypto.randomUUID(),
        name: values.name,
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
        <form onSubmit={form.handleSubmit(onSubmit)} id="label-form">
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
        </form>
      </Form>
      <DialogFooter>
        <Button type='submit' form="label-form">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>)
}

