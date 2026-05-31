import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service";

/** Global transactional email (Resend HTTP / sandbox). */
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
