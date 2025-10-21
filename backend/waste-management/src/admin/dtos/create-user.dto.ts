import { IsEmail, IsString, MinLength, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    example: 'HOUSEHOLD',
    enum: ['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'ADMIN']
  })
  @IsIn(['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'ADMIN'])
  role: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123 Main St, City', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}
