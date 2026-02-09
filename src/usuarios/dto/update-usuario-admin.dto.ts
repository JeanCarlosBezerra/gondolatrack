import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUsuarioAdminDto {
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  // CSV: "ADMIN,CFG_USERS_VIEW,..."
  @IsOptional()
  @IsString()
  roles?: string;

  @IsOptional()
  @IsString()
  nome?: string | null;
}
