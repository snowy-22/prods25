import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React from 'react';

type AnimatedBorderVariant = 'primary' | 'secondary' | 'glass' | 'shimmer';

type AnimatedBorderButtonProps = Omit<ButtonProps, 'variant'> & { 
	children: React.ReactNode;
	variant?: AnimatedBorderVariant;
};

export const AnimatedBorderButton: React.FC<AnimatedBorderButtonProps> = ({ 
	children, 
	className,
	size,
	variant = 'primary',
	...props 
}) => {
	const variantStyles = {
		primary: 'bg-gradient-to-r from-primary via-purple-500 to-cyan-400 animate-gradient-pan bg-[length:200%_auto]',
		secondary: 'bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 animate-pulse-slow',
		glass: 'bg-gradient-to-r from-white/20 via-white/10 to-white/20 backdrop-blur-lg',
		shimmer: 'bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-cyan-500/50 animate-gradient-pan bg-[length:200%_auto]'
	};

	const buttonStyles = {
		primary: 'bg-background hover:bg-background/90 text-foreground shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300',
		secondary: 'bg-muted/50 hover:bg-muted/70 backdrop-blur-sm transition-all duration-300',
		glass: 'bg-background/50 hover:bg-background/70 backdrop-blur-xl border-white/20 transition-all duration-300',
		shimmer: 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300'
	};

	return (
		<div className={cn(
			"relative inline-block p-[2px] rounded-lg overflow-hidden group",
			variantStyles[variant]
		)}>
			<div className="absolute inset-0 blur-sm opacity-50 group-hover:opacity-75 transition-opacity duration-300" 
				style={{ background: 'inherit' }} 
			/>
			<Button 
				className={cn("w-full relative z-10", buttonStyles[variant], className)} 
				size={size}
				{...props}
			>
				{children}
			</Button>
		</div>
	);
};

AnimatedBorderButton.displayName = 'AnimatedBorderButton';
