import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/hooks/use-i18n-new';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  projectId: number;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function FavoriteButton({ 
  projectId, 
  className, 
  variant = 'ghost', 
  size = 'sm',
  showText = false 
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  
  // Check if project is favorited
  const { data: favoriteStatus, isLoading: isCheckingFavorite } = useQuery<{ isFavorited: boolean }>({
    queryKey: [`/api/projects/${projectId}/is-favorited`],
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
  
  const isFavorited = favoriteStatus?.isFavorited || false;
  
  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to favorites');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/is-favorited`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/favorite-projects`] });
      toast({
        title: t('success'),
        description: t('projectAddedToFavorites'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToAddToFavorites'),
        variant: 'destructive',
      });
    },
  });
  
  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/favorite`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove from favorites');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/is-favorited`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/favorite-projects`] });
      toast({
        title: t('success'),
        description: t('projectRemovedFromFavorites'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToRemoveFromFavorites'),
        variant: 'destructive',
      });
    },
  });
  
  const handleToggleFavorite = () => {
    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };
  
  const isLoading = addFavoriteMutation.isPending || removeFavoriteMutation.isPending || isCheckingFavorite;
  
  if (!user) {
    return null; // Don't show favorite button for unauthenticated users
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        'transition-colors',
        isFavorited 
          ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300' 
          : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400',
        className
      )}
      aria-label={isFavorited ? t('removeFromFavorites') : t('addToFavorites')}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart 
          className={cn(
            "h-4 w-4 transition-all",
            isFavorited ? "fill-current" : ""
          )} 
        />
      )}
      {showText && (
        <span className="ml-2">
          {isFavorited ? t('favorited') : t('addToFavorites')}
        </span>
      )}
    </Button>
  );
} 