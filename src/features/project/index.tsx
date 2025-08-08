import { z } from 'zod';
import type { Project } from './data/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseFile2Matrix, rgbaToHex } from '@/lib/utils';
import { ColorPicker, ColorPickerAlpha, ColorPickerEyeDropper, ColorPickerFormat, ColorPickerHue, ColorPickerOutput, ColorPickerSelection } from '@/components/ui/shadcn-io/color-picker';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from '@tanstack/react-router';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Label name is required' }),
  type: z.enum(['Labeling', 'Matching']),
  file: z.instanceof(File, { message: 'Label file is required' }),
  matrixColor: z.string(),
  image: z.instanceof(File).optional(),
})

type UserForm = z.infer<typeof formSchema>


export default function Project() {
  const navigate = useNavigate();
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (values: UserForm) => {
    console.log('formValues', values)
    let matrixData: number[][] = [];
    if (values.file) {
      matrixData = await parseFile2Matrix(values.file);
      console.log('----- 坐标数据 -----')
      console.log(matrixData)
    }
    const project: Project = {
      id: crypto.randomUUID(),
      ...values,
      matrixData,
    }
    localStorage.setItem(project.id, JSON.stringify(project));
    navigate({ to: '/$labelId', params: { labelId: project.id } });
  }
  return (
    <div className='h-screen flex items-center justify-center'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Create Label Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="project-form" className="space-y-6">
              <FormField name="name" render={({ field }) =>
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              } />
              <FormField name="type" render={({ field }) =>
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange}>
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
              <FormField name='matrixColor' render={({ field }) =>
                <FormItem>
                  <FormLabel>Matrix Color</FormLabel>
                  <FormControl>
                    <ColorPicker
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
              <FormField name="file" render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
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
                            input.accept = 'image/*';
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

            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button type='submit' form="project-form">Save</Button>
        </CardFooter>
      </Card>
    </div>
  )
}