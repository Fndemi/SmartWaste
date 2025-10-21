import { IsEmail, IsString, MinLength, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'NewSecurePassword123!', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ 
    example: 'HOUSEHOLD',
    enum: ['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'ADMIN'],
    required: false
  })
  @IsOptional()
  @IsIn(['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'ADMIN'])
  role?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123 Main St, City', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}
