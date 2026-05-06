import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Bike, Truck, HelpCircle } from 'lucide-react';
import { getVehicleMakes, getVehicleModels, getVehicleGenerations } from '@/api/categories.api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { WizardData } from './types';
import { VehicleType, IdentMethod } from '@/types';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

const VEHICLE_TYPES: { value: VehicleType; label: string; Icon: React.ElementType }[] = [
  { value: 'CAR', label: 'Samochód', Icon: Car },
  { value: 'MOTORCYCLE', label: 'Motocykl', Icon: Bike },
  { value: 'TRUCK', label: 'Ciężarówka', Icon: Truck },
  { value: 'OTHER', label: 'Inne', Icon: HelpCircle },
];

const IDENT_METHODS: { value: IdentMethod; label: string }[] = [
  { value: 'VIN', label: 'Numer VIN' },
  { value: 'CATALOG_NUMBER', label: 'Numer katalogowy' },
  { value: 'MANUAL', label: 'Opis manualny' },
];

export function Step1Vehicle({ data, onChange }: Props) {
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [makeDropdownOpen, setMakeDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [makeOpenUpwards, setMakeOpenUpwards] = useState(false);
  const [modelOpenUpwards, setModelOpenUpwards] = useState(false);

  const { data: makes = [] } = useQuery({
    queryKey: ['makes', data.vehicleType],
    queryFn: () => getVehicleMakes(data.vehicleType),
  });

  const { data: models = [] } = useQuery({
    queryKey: ['models', data.vehicleMakeId],
    queryFn: () => getVehicleModels(data.vehicleMakeId!),
    enabled: !!data.vehicleMakeId,
  });

  const { data: generations = [] } = useQuery({
    queryKey: ['generations', data.vehicleModelId],
    queryFn: () => getVehicleGenerations(data.vehicleModelId!),
    enabled: !!data.vehicleModelId,
  });

  useEffect(() => {
    onChange({ vehicleMakeId: undefined, vehicleModelId: undefined, vehicleGenId: undefined });
  }, [data.vehicleType]);

  useEffect(() => {
    onChange({ vehicleModelId: undefined, vehicleGenId: undefined });
  }, [data.vehicleMakeId]);

  useEffect(() => {
    onChange({ vehicleGenId: undefined });
  }, [data.vehicleModelId]);

  const filteredMakes = makes.filter((m) =>
    m.name.toLowerCase().includes(makeSearch.toLowerCase()),
  );
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()),
  );

  const selectedMake = makes.find((make) => make.id === data.vehicleMakeId);
  const selectedModel = models.find((model) => model.id === data.vehicleModelId);

  useEffect(() => {
    setMakeSearch(selectedMake?.name ?? '');
  }, [selectedMake?.name]);

  useEffect(() => {
    setModelSearch(selectedModel?.name ?? '');
  }, [selectedModel?.name]);

  useEffect(() => {
    setModelDropdownOpen(false);
    setModelSearch('');
  }, [data.vehicleMakeId]);

  function resolveDropdownDirection(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    return spaceBelow < 320;
  }

  return (
    <div className="space-y-6">
      {/* Metoda identyfikacji */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Metoda identyfikacji</Label>
        <div className="flex gap-2 flex-wrap">
          {IDENT_METHODS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ identMethod: value })}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                data.identMethod === value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {data.identMethod === 'VIN' && (
        <div>
          <Label htmlFor="vin">Numer VIN</Label>
          <Input
            id="vin"
            placeholder="np. WBA3A5G50DNP26082"
            value={data.vin ?? ''}
            onChange={(e) => onChange({ vin: e.target.value })}
            className="mt-1 uppercase"
            maxLength={17}
          />
        </div>
      )}

      {data.identMethod === 'CATALOG_NUMBER' && (
        <div>
          <Label htmlFor="catalog">Numer katalogowy OEM</Label>
          <Input
            id="catalog"
            placeholder="np. 63117188979"
            value={data.catalogNumber ?? ''}
            onChange={(e) => onChange({ catalogNumber: e.target.value })}
            className="mt-1"
          />
        </div>
      )}

      {/* Typ pojazdu */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Typ pojazdu</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {VEHICLE_TYPES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ vehicleType: value })}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
                data.vehicleType === value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Marka */}
      <div>
        <Label className="text-base font-semibold mb-1 block">Marka</Label>
        <div className="relative">
          <Input
            placeholder="Szukaj marki..."
            value={makeSearch}
            onFocus={(e) => {
              setMakeOpenUpwards(resolveDropdownDirection(e.currentTarget));
              setMakeDropdownOpen(true);
            }}
            onChange={(e) => {
              setMakeSearch(e.target.value);
              setMakeOpenUpwards(resolveDropdownDirection(e.currentTarget));
              setMakeDropdownOpen(true);
            }}
            className="mb-2"
          />
          {makeDropdownOpen && (
            <div
              className={cn(
                'absolute z-50 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-xl ring-1 ring-black/5',
                makeOpenUpwards ? 'bottom-full mb-1' : 'top-full mt-1',
              )}
            >
              {filteredMakes.map((make) => (
                <button
                  key={make.id}
                  type="button"
                  onClick={() => {
                    onChange({ vehicleMakeId: make.id });
                    setMakeSearch(make.name);
                    setMakeDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                    data.vehicleMakeId === make.id && 'bg-primary-50 text-primary-700 font-medium',
                  )}
                >
                  {make.name}
                </button>
              ))}
              {filteredMakes.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">Brak wyników</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Model */}
      {data.vehicleMakeId && (
        <div>
          <Label className="text-base font-semibold mb-1 block">Model</Label>
          <div className="relative">
            <Input
              placeholder="Wybierz model..."
              value={modelSearch}
              onFocus={(e) => {
                setModelOpenUpwards(resolveDropdownDirection(e.currentTarget));
                setModelDropdownOpen(true);
              }}
              onChange={(e) => {
                setModelSearch(e.target.value);
                setModelOpenUpwards(resolveDropdownDirection(e.currentTarget));
                setModelDropdownOpen(true);
              }}
            />
            {modelDropdownOpen && (
              <div
                className={cn(
                  'absolute z-50 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-xl ring-1 ring-black/5',
                  modelOpenUpwards ? 'bottom-full mb-1' : 'top-full mt-1',
                )}
              >
                {filteredModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onChange({ vehicleModelId: model.id });
                      setModelSearch(model.name);
                      setModelDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                      data.vehicleModelId === model.id && 'bg-primary-50 text-primary-700 font-medium',
                    )}
                  >
                    {model.name}
                  </button>
                ))}
                {filteredModels.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">Brak wyników</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generacja / Rok */}
      {data.vehicleModelId && (
        <div className="grid grid-cols-2 gap-4">
          {generations.length > 0 ? (
            <div>
              <Label className="mb-1 block">Generacja</Label>
              <select
                value={data.vehicleGenId ?? ''}
                onChange={(e) => onChange({ vehicleGenId: e.target.value || undefined })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Wybierz generację</option>
                {generations.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name ? `${g.name} ` : ''}{g.yearFrom}–{g.yearTo ?? '...'}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label htmlFor="year" className="mb-1 block">Rok produkcji</Label>
              <Input
                id="year"
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                placeholder="np. 1990"
                value={data.vehicleYearRaw ?? ''}
                onChange={(e) => onChange({ vehicleYearRaw: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          )}

          <div>
            <Label htmlFor="engine" className="mb-1 block">Silnik (opcjonalne)</Label>
            <Input
              id="engine"
              placeholder="np. 1.9 TDI"
              value={data.vehicleEngine ?? ''}
              onChange={(e) => onChange({ vehicleEngine: e.target.value || undefined })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
