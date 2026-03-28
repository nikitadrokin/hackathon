import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '#/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';

export const Route = createFileRoute('/login')({
	beforeLoad: ({ context }) => {
		if (context.isAuthenticated) {
			throw redirect({ to: '/' });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [mode, setMode] = useState<'signin' | 'signup'>('signin');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			if (mode === 'signup') {
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name: name.trim() || email.split('@')[0] || 'User',
				});
				if (err) {
					setError(err.message ?? 'Could not create account');
					return;
				}
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password,
				});
				if (err) {
					setError(err.message ?? 'Could not sign in');
					return;
				}
			}
			await navigate({ to: '/' });
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="page-wrap flex min-h-[70vh] items-center justify-center px-4 pb-12 pt-10">
			<Card className="w-full max-w-md border-[var(--line)] bg-[var(--header-bg)] shadow-lg">
				<CardHeader>
					<CardTitle className="text-[var(--sea-ink)]">
						{mode === 'signin' ? 'Sign in' : 'Create account'}
					</CardTitle>
					<CardDescription>
						Email and password authentication via Better Auth and Convex.
					</CardDescription>
				</CardHeader>
				<form onSubmit={onSubmit}>
					<CardContent className="flex flex-col gap-4">
						<div className="flex gap-2">
							<Button
								type="button"
								variant={mode === 'signin' ? 'default' : 'outline'}
								size="sm"
								className="flex-1"
								onClick={() => {
									setMode('signin');
									setError(null);
								}}
							>
								Sign in
							</Button>
							<Button
								type="button"
								variant={mode === 'signup' ? 'default' : 'outline'}
								size="sm"
								className="flex-1"
								onClick={() => {
									setMode('signup');
									setError(null);
								}}
							>
								Sign up
							</Button>
						</div>
						{mode === 'signup' ? (
							<div className="grid gap-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									name="name"
									autoComplete="name"
									value={name}
									onChange={(ev) => {
										setName(ev.target.value);
									}}
									placeholder="Your name"
								/>
							</div>
						) : null}
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(ev) => {
									setEmail(ev.target.value);
								}}
								placeholder="you@example.com"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete={
									mode === 'signin' ? 'current-password' : 'new-password'
								}
								required
								minLength={8}
								value={password}
								onChange={(ev) => {
									setPassword(ev.target.value);
								}}
							/>
						</div>
						{error ? (
							<p className="text-sm text-destructive" role="alert">
								{error}
							</p>
						) : null}
					</CardContent>
					<CardFooter>
						<Button
							type="submit"
							className="w-full"
							disabled={loading}
						>
							{loading
								? 'Please wait…'
								: mode === 'signin'
									? 'Sign in'
									: 'Create account'}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</main>
	);
}
