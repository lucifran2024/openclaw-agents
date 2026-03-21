// Module
export { CampaignsModule } from './campaigns.module';

// Entities
export { CampaignEntity, CampaignStatus, CampaignType } from './entities/campaign.entity';
export type { CampaignSettings, CampaignStats } from './entities/campaign.entity';
export { CampaignMessageEntity, CampaignMessageStatus } from './entities/campaign-message.entity';
export { CampaignSuppressionEntity, SuppressionReason } from './entities/campaign-suppression.entity';
export { OptOutEntity } from './entities/opt-out.entity';

// Services
export { CampaignService } from './campaign.service';
export { CampaignGovernorService } from './campaign-governor.service';
export type { GovernorDecision } from './campaign-governor.service';
export { SuppressionService } from './suppression.service';

// DTOs
export { CreateCampaignDto } from './dto/create-campaign.dto';
export { UpdateCampaignDto } from './dto/update-campaign.dto';

// Controller
export { CampaignsController } from './campaigns.controller';
