import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getMarginRules, saveMarginRules } from '@/api/margins.api';
import { MarginRule, Platform } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

const PLATFORMS: Platform[] = ['ALLEGRO', 'OVOKO', 'OTOMOTO', 'OLX', 'EBAY'];

export default function MarginsPage() {
  const { data = [] } = useQuery({ queryKey: ['margins'], queryFn: getMarginRules });
  const [rules, setRules] = useState<Omit<MarginRule, 'id'>[]>([]);
  const debounced = useDebounce(rules, 500);
  const mutation = useMutation({ mutationFn: saveMarginRules });

  useEffect(() => {
    if (!data.length) {
      setRules(PLATFORMS.map((platform) => ({ platform, marginType: 'PERCENTAGE', marginValue: 0 })));
      return;
    }
    setRules(data.map(({ id: _id, ...rest }) => rest));
  }, [data]);

  useEffect(() => {
    if (debounced.length > 0) mutation.mutate(debounced);
  }, [debounced, mutation]);

  const byPlatform = useMemo(
    () => Object.fromEntries(rules.map((rule) => [rule.platform, rule])) as Record<Platform, Omit<MarginRule, 'id'>>,
    [rules],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Ustawienia marz</h1>
      {PLATFORMS.map((platform) => {
        const rule = byPlatform[platform] ?? { platform, marginType: 'PERCENTAGE', marginValue: 0 };
        const preview = rule.marginType === 'PERCENTAGE' ? 100 * (1 + rule.marginValue / 100) : 100 + rule.marginValue;
        return (
          <div key={platform} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{platform}</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setRules((prev) =>
                    prev.map((item) =>
                      item.platform === platform
                        ? { ...item, marginType: item.marginType === 'PERCENTAGE' ? 'FIXED_AMOUNT' : 'PERCENTAGE' }
                        : item,
                    ),
                  )
                }
              >
                {rule.marginType === 'PERCENTAGE' ? '%' : 'Kwota'}
              </Button>
            </div>
            <Input
              type="number"
              value={rule.marginValue}
              onChange={(e) =>
                setRules((prev) =>
                  prev.map((item) =>
                    item.platform === platform ? { ...item, marginValue: Number(e.target.value) || 0 } : item,
                  ),
                )
              }
            />
            <p className="mt-2 text-xs text-gray-500">100 PLN -&gt; {preview.toFixed(2)} PLN</p>
          </div>
        );
      })}
    </div>
  );
}
