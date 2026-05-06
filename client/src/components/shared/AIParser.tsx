import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseListingInput } from '@/api/ai-parser.api';
import { WizardData } from '@/pages/Listings/wizard/types';

interface Props {
  onParsed: (data: Partial<WizardData>) => void;
}

export function AIParser({ onParsed }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [parserMode, setParserMode] = useState<'AI' | 'REGEX' | null>(null);

  async function handleParse() {
    if (input.trim().length < 3) return;
    setLoading(true);
    try {
      const parsed = await parseListingInput(input.trim());
      onParsed({
        identMethod: 'AI_PARSED',
        vehicleYearRaw: parsed.vehicleYear ?? undefined,
        partSide: parsed.partSide ?? undefined,
        condition: parsed.condition ?? undefined,
        catalogNumber: parsed.catalogNumber ?? undefined,
      });
      setNeedsReview(parsed.needsReview);
      setParserMode(parsed.parserMode);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
      <h3 className="text-sm font-semibold text-primary-900">Szybki opis (AI Parser)</h3>
      <p className="mb-3 mt-1 text-xs text-primary-700">Wpisz np. "lampa tył samurai prawa 1990".</p>
      <p className="mb-2 text-xs text-primary-600">
        {parserMode === 'REGEX'
          ? 'Tryb uproszczony (regex): brak klucza AI, wyniki wymagaja recznej weryfikacji.'
          : 'Parser uzupelnia podstawowe pola na podstawie opisu.'}
      </p>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Szybki opis części..." />
        <Button type="button" onClick={handleParse} disabled={loading || input.trim().length < 3}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Wypełnij automatycznie
        </Button>
      </div>
      {needsReview && (
        <p className="mt-3 rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-900">
          Sprawdz uzupelnione pola przed przejsciem dalej.
        </p>
      )}
    </div>
  );
}
