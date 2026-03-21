import { Injectable, Logger } from '@nestjs/common';

const WINDOW_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface WindowState {
  conversationId: string;
  lastUserMessageAt: Date;
  sessionExpiresAt: Date;
}

@Injectable()
export class WindowTrackerService {
  private readonly logger = new Logger(WindowTrackerService.name);
  private readonly windows = new Map<string, WindowState>();

  updateWindow(conversationId: string, lastUserMessageAt: Date): void {
    const sessionExpiresAt = new Date(lastUserMessageAt.getTime() + WINDOW_DURATION_MS);

    this.windows.set(conversationId, {
      conversationId,
      lastUserMessageAt,
      sessionExpiresAt,
    });

    this.logger.debug(
      `Window updated for conversation ${conversationId}: expires at ${sessionExpiresAt.toISOString()}`,
    );
  }

  isWindowOpen(conversationId: string): boolean {
    const window = this.windows.get(conversationId);
    if (!window) return false;
    return new Date() < window.sessionExpiresAt;
  }

  getTimeRemaining(conversationId: string): number {
    const window = this.windows.get(conversationId);
    if (!window) return 0;

    const remaining = window.sessionExpiresAt.getTime() - Date.now();
    return Math.max(0, remaining);
  }
}
