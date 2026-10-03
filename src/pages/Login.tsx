import React, { useState } from 'react';
import { useStore } from '../store';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { downloadFullProject } from '../lib/download';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useStore(s => s.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!login(username, password)) {
      setError('Invalid credentials or account disabled');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-[hsl(var(--foreground))]">
            Brew & Bean
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">Specialty Coffee POS</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              
              {error && (
                <div className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 rounded-md p-3">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full" size="lg">
                Sign In
              </Button>
            </form>
            
            <div className="mt-6 p-4 rounded-md bg-[hsl(var(--muted))] text-sm">
              <p className="font-medium mb-2">Demo Credentials:</p>
              <p className="text-[hsl(var(--muted-foreground))]">
                <strong>Admin:</strong> admin / admin123<br/>
                <strong>Cashier:</strong> cashier / cash123
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Download Button */}
        <div className="mt-6 text-center">
          <button
            onClick={downloadFullProject}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium shadow-[var(--shadow-md)] hover:bg-[hsl(var(--primary))]/90 transition-all hover:-translate-y-0.5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Full Project (.zip)
          </button>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
            Includes Flask backend + run.bat + README
          </p>
        </div>
      </div>
    </div>
  );
}
