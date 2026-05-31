import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CredentialsDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class GoogleAuthDto {
  @IsString()
  idToken!: string;
}

export class AppleAuthDto {
  @IsString()
  idToken!: string;

  /** Apple only returns the display name on first authorization. */
  @IsOptional()
  @IsString()
  name?: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class TokenDto {
  @IsString()
  token!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
