import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContactEntity } from './contact.entity';
import { TagEntity } from './tag.entity';
import { ContactTagEntity } from './contact-tag.entity';
import { CustomFieldDefinitionEntity } from './custom-field-definition.entity';
import { SegmentEntity } from './segment.entity';
import { ContactService } from './contact.service';
import { TagService } from './tag.service';
import { SegmentService } from './segment.service';
import { ContactController } from './contact.controller';
import { TagController } from './tag.controller';
import { SegmentController } from './segment.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ContactEntity,
      TagEntity,
      ContactTagEntity,
      CustomFieldDefinitionEntity,
      SegmentEntity,
    ]),
  ],
  controllers: [ContactController, TagController, SegmentController],
  providers: [ContactService, TagService, SegmentService],
  exports: [ContactService, TagService, SegmentService],
})
export class ContactsModule {}
