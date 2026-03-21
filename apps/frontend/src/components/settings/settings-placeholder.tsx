import { Wrench } from 'lucide-react';
import { SettingsEmptyState, SettingsPageHeader, SettingsSection } from './settings-shell';

interface SettingsPlaceholderProps {
  title: string;
  description: string;
  phaseLabel: string;
}

export function SettingsPlaceholder({
  title,
  description,
  phaseLabel,
}: SettingsPlaceholderProps) {
  return (
    <div className="space-y-6">
      <SettingsPageHeader title={title} description={description} />

      <SettingsSection
        title="Modulo em preparacao"
        description={`Esta area entra na ${phaseLabel} com escopo dedicado.`}
      >
        <SettingsEmptyState
          title="Ainda nao ativado nesta etapa"
          description="A navegacao da area de Settings ja esta pronta, mas a implementacao completa deste bloco sera encaixada na prioridade especifica da fase correspondente."
          icon={<Wrench className="h-10 w-10" />}
        />
      </SettingsSection>
    </div>
  );
}
