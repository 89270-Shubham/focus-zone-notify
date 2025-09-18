import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, BookOpen, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface StudyBlock {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  reminder_sent: boolean;
  created_at: string;
}

interface StudyBlocksListProps {
  refreshTrigger: number;
}

const StudyBlocksList: React.FC<StudyBlocksListProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studyBlocks, setStudyBlocks] = useState<StudyBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudyBlocks = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('study_blocks')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStudyBlocks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudyBlocks();
  }, [user, refreshTrigger]);

  const deleteStudyBlock = async (id: string) => {
    const { error } = await supabase
      .from('study_blocks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Study block deleted successfully!",
      });
      fetchStudyBlocks();
    }
  };

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };

  const isPast = (endTime: string) => {
    return new Date(endTime) < new Date();
  };

  const isActive = (startTime: string, endTime: string) => {
    const now = new Date();
    return new Date(startTime) <= now && new Date(endTime) > now;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-muted-foreground">Loading study blocks...</p>
        </CardContent>
      </Card>
    );
  }

  if (studyBlocks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No study blocks scheduled</p>
          <p className="text-muted-foreground">
            Create your first study session to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Study Schedule</h2>
      {studyBlocks.map((block) => (
        <Card key={block.id} className="relative">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {block.title}
                </CardTitle>
                {block.description && (
                  <CardDescription className="mt-1">
                    {block.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isActive(block.start_time, block.end_time) && (
                  <Badge variant="default" className="bg-green-500">
                    Active
                  </Badge>
                )}
                {isUpcoming(block.start_time) && !isActive(block.start_time, block.end_time) && (
                  <Badge variant="secondary">
                    Upcoming
                  </Badge>
                )}
                {isPast(block.end_time) && (
                  <Badge variant="outline">
                    Completed
                  </Badge>
                )}
                {block.reminder_sent && (
                  <Badge variant="outline" className="text-xs">
                    Reminder Sent
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteStudyBlock(block.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(block.start_time), 'MMM dd, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(block.start_time), 'HH:mm')} - {format(new Date(block.end_time), 'HH:mm')}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudyBlocksList;