import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React from 'react';

type AnimatedBorderButtonProps = ButtonProps & { children: React.ReactNode };

export const AnimatedBorderButton: React.FC<AnimatedBorderButtonProps> = ({ 
	children, 
	className, 
	...props 
}) => (
	<div className="relative inline-block p-[2px] rounded-md bg-gradient-to-r from-primary via-purple-500 to-cyan-400 animate-gradient-pan bg-[length:200%_auto]">
		<Button className={cn("w-full", className)} {...props}>
			{children}
		</Button>
	</div>
);

AnimatedBorderButton.displayName = 'AnimatedBorderButton';
