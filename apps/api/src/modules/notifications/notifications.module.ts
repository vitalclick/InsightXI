import { Global, Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationStore } from "./notification.store";
import { InMemoryNotificationStore } from "./in-memory-notification.store";
import { PostgresNotificationStore } from "./postgres-notification.store";

const usePostgres = process.env.DATA_BACKEND === "postgres";

/**
 * In-app notifications. Global so any module can inject NotificationsService to
 * raise a notification on a meaningful event. Store backend follows DATA_BACKEND.
 */
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NotificationStore,
      useClass: usePostgres ? PostgresNotificationStore : InMemoryNotificationStore,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
