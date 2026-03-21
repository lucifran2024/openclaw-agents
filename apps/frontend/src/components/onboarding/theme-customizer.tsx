'use client';

import { useRef } from 'react';
import { ImagePlus, Palette, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { OnboardingTheme } from '@/hooks/use-onboarding';

interface ThemeCustomizerProps {
  value: Required<OnboardingTheme>;
  onChange: (value: Required<OnboardingTheme>) => void;
  previewName?: string;
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export function ThemeCustomizer({
  value,
  onChange,
  previewName = 'Sua marca',
}: ThemeCustomizerProps) {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);

  function updateTheme<K extends keyof Required<OnboardingTheme>>(
    key: K,
    nextValue: Required<OnboardingTheme>[K],
  ) {
    onChange({ ...value, [key]: nextValue });
  }

  async function handleFileChange(key: 'logo' | 'favicon', file?: File) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updateTheme(key, dataUrl);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-5 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <Palette className="h-4 w-4" />
            Cor principal
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value.primaryColor}
              onChange={(e) => updateTheme('primaryColor', e.target.value)}
              className="h-11 w-14 rounded-xl border border-[var(--color-border)] bg-white"
            />
            <Input
              value={value.primaryColor}
              onChange={(e) => updateTheme('primaryColor', e.target.value)}
              placeholder="#2563eb"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <ImagePlus className="h-4 w-4" />
              Logo
            </label>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-slate-50 px-4 py-5 text-center"
            >
              {value.logo ? (
                <img
                  src={value.logo}
                  alt="Logo"
                  className="max-h-20 max-w-full rounded-xl object-contain"
                />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-slate-500" />
                  <p className="mt-3 text-sm font-medium text-slate-900">Enviar logo</p>
                  <p className="mt-1 text-xs text-slate-500">
                    PNG, JPG ou SVG para preview rapido
                  </p>
                </>
              )}
            </button>
            <Input
              value={value.logo}
              onChange={(e) => updateTheme('logo', e.target.value)}
              placeholder="ou cole a URL da logo"
            />
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange('logo', e.target.files?.[0])}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <ImagePlus className="h-4 w-4" />
              Favicon
            </label>
            <button
              type="button"
              onClick={() => faviconInputRef.current?.click()}
              className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-slate-50 px-4 py-5 text-center"
            >
              {value.favicon ? (
                <img
                  src={value.favicon}
                  alt="Favicon"
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-slate-500" />
                  <p className="mt-3 text-sm font-medium text-slate-900">Enviar favicon</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Recomendado 64x64 para uma leitura limpa
                  </p>
                </>
              )}
            </button>
            <Input
              value={value.favicon}
              onChange={(e) => updateTheme('favicon', e.target.value)}
              placeholder="ou cole a URL do favicon"
            />
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange('favicon', e.target.files?.[0])}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Preview da Marca
        </p>
        <div
          className="mt-5 rounded-[1.6rem] bg-white p-5 text-slate-900"
          style={{ borderTop: `6px solid ${value.primaryColor}` }}
        >
          <div className="flex items-center gap-3">
            {value.logo ? (
              <img
                src={value.logo}
                alt="Logo preview"
                className="h-12 w-12 rounded-2xl object-cover"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: value.primaryColor }}
              >
                {previewName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-base font-semibold">{previewName}</p>
              <p className="text-sm text-slate-500">Experiencia white-label pronta para setup</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div
              className="rounded-2xl p-4 text-white"
              style={{ backgroundColor: value.primaryColor }}
            >
              <p className="text-sm font-medium">Mensagem destacada</p>
              <p className="mt-2 text-sm/6 text-white/90">
                Seu time ja pode usar uma identidade visual coerente desde o primeiro dia.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Primaria</p>
                <div className="mt-3 flex items-center gap-3">
                  <span
                    className="h-8 w-8 rounded-full border border-slate-200"
                    style={{ backgroundColor: value.primaryColor }}
                  />
                  <span className="font-mono text-sm">{value.primaryColor}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Favicon</p>
                <div className="mt-3 flex items-center gap-3">
                  {value.favicon ? (
                    <img
                      src={value.favicon}
                      alt="Favicon preview"
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-sm text-slate-500">Nao enviado</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
