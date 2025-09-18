import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

const studyBlockSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endDate: z.string().min(1, 'End date is required'),
  endTime: z.string().min(1, 'End time is required'),
}).refine((data) => {
  const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
  const endDateTime = new Date(`${data.endDate}T${data.endTime}`);
  return endDateTime > startDateTime;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type StudyBlockFormData = z.infer<typeof studyBlockSchema>;

interface StudyBlockFormProps {
  onSuccess: () => void;
}

const StudyBlockForm: React.FC<StudyBlockFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<StudyBlockFormData>({
    resolver: zodResolver(studyBlockSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
    },
  });

  const onSubmit = async (data: StudyBlockFormData) => {
    if (!user) return;

    const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
    const endDateTime = new Date(`${data.endDate}T${data.endTime}`);

    const { error } = await supabase
      .from('study_blocks')
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Study block created successfully!",
      });
      form.reset();
      onSuccess();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule New Study Block</CardTitle>
        <CardDescription>
          Create a focused study session with email reminders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Mathematics Study Session"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What will you focus on during this session?"
              {...form.register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register('startDate')}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                {...form.register('startTime')}
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.startTime.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...form.register('endDate')}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                {...form.register('endTime')}
              />
              {form.formState.errors.endTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Create Study Block
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudyBlockForm;