-- Add player aspect ratio column to content_items table
-- This allows storing the player frame aspect ratio setting (16:9, 1:1, or auto)

ALTER TABLE public.content_items 
ADD COLUMN IF NOT EXISTS player_aspect_ratio TEXT DEFAULT 'auto';

-- Add comment for documentation
COMMENT ON COLUMN public.content_items.player_aspect_ratio IS 
'Player aspect ratio setting: 16:9 (widescreen), 1:1 (square), or auto (default)';

-- Create index for performance on queries filtering by aspect ratio
CREATE INDEX IF NOT EXISTS idx_content_items_player_aspect_ratio 
ON public.content_items(player_aspect_ratio);

-- Update existing records with default auto value (if any explicit null values exist)
UPDATE public.content_items 
SET player_aspect_ratio = 'auto' 
WHERE player_aspect_ratio IS NULL;
