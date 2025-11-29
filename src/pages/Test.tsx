import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Test: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>This is a test page to verify the app is working.</p>
          <div className="space-y-2">
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>Origin:</strong> {window.location.origin}</p>
            <p><strong>Port:</strong> {window.location.port}</p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Auth Page
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Test;