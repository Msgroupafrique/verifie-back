import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class UserSessionService {
    constructor(private readonly prisma: PrismaService) {}

    async create (sessionId: string, userId: string, refreshTokenHash: string, refreshTokenExpiresAt: Date) {
        const createdUserSession = await this.prisma.userSession.create({
            data: {
                id: sessionId,
                userId: userId,
                refreshTokenHash: refreshTokenHash,
                expiresAt: refreshTokenExpiresAt
            }
        })

        return createdUserSession;
    }

    async update (id: string, revokedAt: Date) {
        return await this.prisma.userSession.update({
            where: { id },
            data: {
                revokedAt
            }
        })
    }
}
