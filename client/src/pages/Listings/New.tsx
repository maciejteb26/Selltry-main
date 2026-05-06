import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { createListing, uploadImages } from '@/api/listings.api';
import { publishListing } from '@/api/platforms.api';
import { Step1Vehicle } from './wizard/Step1Vehicle';
import { Step2Details } from './wizard/Step2Details';
import { Step3Images } from './wizard/Step3Images';
import { Step4Submit } from './wizard/Step4Submit';
import { WizardData, WIZARD_DEFAULTS } from './wizard/types';
import { AIParser } from '@/components/shared/AIParser';

const STEPS = [
  { label: 'Pojazd', desc: 'Identyfikacja i dane pojazdu' },
  { label: 'Szczegóły', desc: 'Kategoria, stan i opis' },
  { label: 'Zdjęcia', desc: 'Dodaj zdjęcia części' },
  { label: 'Cena', desc: 'Ustal cenę i zatwierdź' },
];

export default function NewListingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(WIZARD_DEFAULTS);
  const [submitting, setSubmitting] = useState(false);

  function patch(update: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...update }));
  }

  function canProceed(): boolean {
    if (step === 0) return !!data.vehicleType;
    if (step === 1) return !!data.categoryId && !!data.condition && !!data.title && (data.description?.length ?? 0) >= 10;
    if (step === 2) return true;
    if (step === 3) return !!data.basePrice;
    return false;
  }

  async function handleSubmit() {
    if (!data.categoryId || !data.condition || !data.title || !data.description || !data.basePrice) return;

    setSubmitting(true);
    try {
      const listing = await createListing({
        title: data.title,
        description: data.description,
        basePrice: data.basePrice,
        condition: data.condition,
        quantity: data.quantity ?? 1,
        identMethod: data.identMethod,
        vin: data.vin,
        catalogNumber: data.catalogNumber,
        vehicleType: data.vehicleType,
        vehicleMakeId: data.vehicleMakeId,
        vehicleModelId: data.vehicleModelId,
        vehicleGenId: data.vehicleGenId,
        vehicleYearRaw: data.vehicleYearRaw,
        vehicleEngine: data.vehicleEngine,
        categoryId: data.categoryId,
        partSide: data.partSide,
        partDetails: data.partDetails,
        damageDescription: data.damageDescription,
      });

      if (data.images.length > 0) {
        await uploadImages(listing.id, data.images);
      }

      if (data.selectedPlatforms.length > 0) {
        await publishListing(listing.id, data.selectedPlatforms);
      }

      toast('Ogłoszenie zostało zapisane!', 'success');
      navigate('/listings');
    } catch {
      toast('Błąd podczas zapisywania ogłoszenia', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nowe ogłoszenie</h1>
        <p className="text-sm text-gray-500 mt-1">Wypełnij dane w 4 krokach</p>
      </div>

      <AIParser
        onParsed={(parsed) => {
          patch(parsed);
        }}
      />

      {/* Pasek kroków */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  i < step && 'bg-primary-600 text-white',
                  i === step && 'bg-primary-600 text-white ring-4 ring-primary-100',
                  i > step && 'bg-gray-200 text-gray-500',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-primary-700' : 'text-gray-500')}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 flex-1', i < step ? 'bg-primary-600' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Krok */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{STEPS[step].label}</h2>
        <p className="text-sm text-gray-500 mb-6">{STEPS[step].desc}</p>

        {step === 0 && <Step1Vehicle data={data} onChange={patch} />}
        {step === 1 && <Step2Details data={data} onChange={patch} />}
        {step === 2 && <Step3Images data={data} onChange={patch} />}
        {step === 3 && <Step4Submit data={data} onChange={patch} />}
      </div>

      {/* Nawigacja */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => (step === 0 ? navigate('/listings') : setStep(step - 1))}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 0 ? 'Anuluj' : 'Wstecz'}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Dalej
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed() || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            {submitting ? 'Zapisywanie...' : 'Zapisz ogłoszenie'}
          </Button>
        )}
      </div>
    </div>
  );
}
