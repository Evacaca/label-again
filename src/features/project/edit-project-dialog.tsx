import { z } from 'zod';
import type { Project } from '@/context/data/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseFile2Matrix, rgbaToHex } from '@/lib/utils';
import { ColorPicker, ColorPickerAlpha, ColorPickerEyeDropper, ColorPickerFormat, ColorPickerHue, ColorPickerOutput, ColorPickerSelection } from '@/components/ui/shadcn-io/color-picker';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/context/project-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Label name is required' }),
  type: z.enum(['Labeling', 'Matching']),
  file: z.instanceof(File).optional(),
  matrixColor: z.string(),
  image: z.instanceof(File).optional(),
})

type UserForm = z.infer<typeof formSchema>

interface Props {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({ project, open, onOpenChange }: Props) {
  const { updateProject } = useProjects();
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: project || {},
  });

  useEffect(() => {
    if (project) {
      form.reset(project);
    }
  }, [project, form]);

  const onSubmit = async (values: UserForm) => {
    if (!project) return;

    let matrixData: number[][] = project.matrixData;
    if (values.file && values.file !== project.file) {
      matrixData = await parseFile2Matrix(values.file);
    }

    const updatedProject: Project = {
      ...project,
      ...values,
      matrixData,
    };
    await updateProject(updatedProject);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="edit-project-form" className="space-y-6 p-4">
            <FormField name="name" render={({ field }) =>
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            } />
            <FormField name="type" render={({ field }) =>
              <FormItem>
                <FormLabel>Project Type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Labeling', 'Matching'].map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            } />
            <FormField name="file" render={({ field }) => (
              <FormItem>
                <FormLabel>Matrix File</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="text"
                      readOnly
                      value={field.value?.name || ''}
                      className="cursor-pointer pr-20"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.csv,.txt,.xlsx,.xls';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) field.onChange(file);
                        };
                        input.click();
                      }}
                    />
                    <Button type="button" variant="secondary" size="sm" className="absolute right-1 top-1 h-7" onClick={() => field.onChange(undefined)}>
                      Clear
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name='matrixColor' render={({ field }) => (
              <FormItem>
                <FormLabel>Matrix Color</FormLabel>
                <FormControl>
                  <ColorPicker defaultValue={field.value} onChange={(rgba) => field.onChange(rgbaToHex(rgba as number[]))} className="rounded-md border bg-background p-4 shadow-sm">
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
            )} />
            <FormField name="image" render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="text"
                      readOnly
                      value={field.value?.name || ''}
                      className="cursor-pointer pr-20"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) field.onChange(file);
                        };
                        input.click();
                      }}
                    />
                    <Button type="button" variant="secondary" size="sm" className="absolute right-1 top-1 h-7" onClick={() => field.onChange(undefined)}>
                      Clear
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form="edit-project-form">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}