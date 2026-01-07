// === INÍCIO ARQUIVO: src/auth/dto/login.dto.ts ===
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  usuario!: string;

  @IsString()
  @MinLength(3)
  senha!: string;
}
// === FIM ARQUIVO ===
