import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Sprout } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiError, api } from '../api';
import { Button, Notice, inputClass } from '../components/ui';
import { ME_KEY } from '../session';

export function LoginPage() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const login = useMutation({
    mutationFn: () => api.login(email.trim(), password),
    onSuccess: (admin) => qc.setQueryData(ME_KEY, admin),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-canopy text-white"><Sprout aria-hidden="true" className="size-6" /></span>
        <div>
          <h1 className="text-2xl font-bold text-canopy">Agrixore Admin</h1>
          <p className="text-sm text-muted">Sign in to manage mandi prices</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pe-11`} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute inset-y-0 end-0 grid w-11 place-items-center text-muted">
              {show ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
            </button>
          </div>
        </div>
        {login.isError && <Notice tone="error" live>{login.error instanceof ApiError ? login.error.message : 'Could not sign in. Please try again.'}</Notice>}
        <Button type="submit" className="w-full" disabled={login.isPending}>{login.isPending ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </main>
  );
}
