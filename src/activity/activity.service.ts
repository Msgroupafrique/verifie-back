import { Injectable } from '@nestjs/common';
import { ActivityType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

export interface CreateActivityType {
    title: string;
    description: string;
    type: ActivityType;
}

@Injectable()
export class ActivityService {

    constructor(private readonly prisma: PrismaService) {}

    async create (data: CreateActivityType) {
        return await this.prisma.activityLog.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
            }
        })
    }   

    async findRecent() {
        const limit = 5
        const activities = await this.prisma.activityLog.findMany({
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                title: true,
                description: true,
                type: true,
                createdAt: true,
            },
        });

        return activities.map((activity) => ({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            type: activity.type,
            time: activity.createdAt,
        }));
    }

}
