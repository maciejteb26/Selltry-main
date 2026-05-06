import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { connectPlatform, disconnectPlatform, getAllegroOAuthStart, getPlatforms } from '@/api/platforms.api';
import { Platform } from '@/types';
import { useToast } from '@/components/ui/toast';

const PLATFORMS: Platform[] = ['ALLEGRO', 'OVOKO', 'OTOMOTO', 'OLX', 'EBAY'];

export default function PlatformsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data = [] } = useQuery({ queryKey: ['platforms'], queryFn: getPlatforms });
  const connectMut = useMutation({
    mutationFn: connectPlatform,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
  });
  const allegroOauthMut = useMutation({
    mutationFn: getAllegroOAuthStart,
  });

  async function handleAllegroOAuthStart() {
    const oauthWindow = window.open('', '_blank', 'noopener,noreferrer');
    try {
      const { authorizationUrl } = await allegroOauthMut.mutateAsync();
      if (oauthWindow) {
        oauthWindow.location.href = authorizationUrl;
      } else {
        window.location.href = authorizationUrl;
      }
    } catch {
      if (oauthWindow) oauthWindow.close();
      try {
        await connectMut.mutateAsync('ALLEGRO');
        toast('Allegro podlaczone w trybie MOCK', 'success');
      } catch {
        toast('Nie udalo sie polaczyc Allegro', 'error');
      }
    }
  }
  const disconnectMut = useMutation({
    mutationFn: disconnectPlatform,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Platformy</h1>
      {PLATFORMS.map((platform) => {
        const current = data.find((item) => item.platform === platform);
        const active = !!current?.isActive;
        return (
          <div key={platform} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
            <div>
              <h2 className="font-semibold text-gray-900">{platform}</h2>
              <p className="text-sm text-gray-500">{active ? 'Polaczona' : 'Rozlaczona'}</p>
            </div>
            {active ? (
              <Button variant="outline" onClick={() => disconnectMut.mutate(platform)}>
                Rozlacz
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (platform === 'ALLEGRO') {
                    void handleAllegroOAuthStart();
                    return;
                  }
                  connectMut.mutate(platform);
                }}
              >
                {platform === 'ALLEGRO' ? 'Polacz przez OAuth' : 'Polacz'}
              </Button>
            )}
          </div>
        );
      })}
      <p className="text-xs text-gray-500">
        Dane dostepowe platform sa obslugiwane wylacznie po stronie backendu i szyfrowane.
      </p>
    </div>
  );
}
