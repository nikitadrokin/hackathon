import { createFileRoute, redirect } from '@tanstack/react-router';
import MindApp from '#/components/MindApp';

export const Route = createFileRoute('/')({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: '/login' });
		}
	},
	component: MindApp,
});
