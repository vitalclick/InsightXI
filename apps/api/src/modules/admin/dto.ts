import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsIn(["User", "Analyst", "Admin"])
  role?: "User" | "Analyst" | "Admin";

  @IsOptional()
  @IsIn(["Free", "Premium", "Trial"])
  plan?: "Free" | "Premium" | "Trial";

  @IsOptional()
  @IsIn(["Active", "Pending", "Suspended"])
  status?: "Active" | "Pending" | "Suspended";
}

export class SetFlagDto {
  @IsBoolean()
  enabled!: boolean;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsIn(["Open", "Pending", "Closed"])
  status?: "Open" | "Pending" | "Closed";

  @IsOptional()
  @IsString()
  assignee?: string;
}

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdatePostDto {
  @IsOptional()
  @IsIn(["Published", "Scheduled", "Draft"])
  status?: "Published" | "Scheduled" | "Draft";
}
