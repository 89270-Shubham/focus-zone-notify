import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProvider';
import StudyBlockForm from '@/components/StudyBlockForm';
import StudyBlocksList from '@/components/StudyBlocksList';

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Quiet Hours Scheduler</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user.email}
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Welcome to Your Study Scheduler
                <Button onClick={() => setShowForm(!showForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {showForm ? 'Cancel' : 'New Study Block'}
                </Button>
              </CardTitle>
              <CardDescription>
                Schedule focused study sessions and receive email reminders 10 minutes before they start.
              </CardDescription>
            </CardHeader>
          </Card>

          {showForm && (
            <StudyBlockForm onSuccess={handleFormSuccess} />
          )}

          <StudyBlocksList refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
};

export default Index;
