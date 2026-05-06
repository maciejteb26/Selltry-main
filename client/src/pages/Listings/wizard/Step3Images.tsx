import { ImageUploader } from '@/components/shared/ImageUploader';
import { WizardData } from './types';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

export function Step3Images({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Zdjęcia ogłoszenia</h3>
        <p className="text-sm text-gray-500 mt-1">
          Pierwsze zdjęcie będzie zdjęciem głównym. Dodaj co najmniej 1, maksymalnie 20 zdjęć.
        </p>
      </div>

      <ImageUploader
        files={data.images}
        onChange={(images) => onChange({ images })}
        maxFiles={20}
      />

      {data.images.length === 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Ogłoszenie bez zdjęć sprzedaje się znacznie gorzej. Dodaj co najmniej 1 zdjęcie.
        </p>
      )}
    </div>
  );
}
