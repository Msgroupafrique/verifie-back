import { Type } from 'class-transformer';
import { AnalysisType } from 'src/generated/prisma/enums';
import { RiskLevel } from 'src/generated/prisma/enums';
import { ConfidenceLevel } from 'src/generated/prisma/enums';
import { IsIn, IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export class ListHistoryDto {
    @IsOptional() 
    @Type(() => Number) 
    @IsInt() 
    @Min(1)
    page?: number = 1;

    @IsOptional() 
    @Type(() => Number) 
    @IsInt() 
    @Min(1) 
    @Max(200)
    pageSize?: number = 100;

    @IsOptional() 
    type?: AnalysisType;

    @IsOptional() 
    risk?: RiskLevel;

    @IsOptional() 
    confidence?: ConfidenceLevel;

    @IsOptional()
    @IsISO8601()
    from?: string;

    @IsOptional() 
    @IsISO8601()
    to?: string;
}