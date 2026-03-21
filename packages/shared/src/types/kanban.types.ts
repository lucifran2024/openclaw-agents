export type BoardType = 'conversation' | 'scheduling' | 'custom';
export type CardPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Board {
  id: string;
  tenantId: string;
  name: string;
  type: BoardType;
  settings: Record<string, unknown>;
  createdAt: Date;
}

export interface Column {
  id: string;
  boardId: string;
  tenantId: string;
  name: string;
  position: number;
  wipLimit?: number;
  color?: string;
}

export interface Card {
  id: string;
  tenantId: string;
  boardId: string;
  columnId: string;
  swimlaneId?: string;
  entityType: string;
  entityId: string;
  position: number;
  title: string;
  assigneeId?: string;
  priority: CardPriority;
  dueAt?: Date;
  enteredColumnAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
