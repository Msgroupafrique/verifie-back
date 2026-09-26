import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserRole } from "src/generated/prisma/enums";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcrypt'


@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(AdminSeedService.name)

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    async onApplicationBootstrap() {
        await this.seedInitialAdmin();
    }

    private async seedInitialAdmin () {
        const adminEmail = this.configService.get<string>('INITIAL_ADMIN_EMAIL')
        const adminPassword = this.configService.get<string>('INITIAL_ADMIN_PASSWORD')

        if(!adminEmail || !adminPassword) {
            this.logger.warn(`L'email initial ou le mot de passe initial n'est pas fournit.`)
            return;
        }

        const existingAdmin = await this.prisma.user.findFirst({
            where: { 
                email: adminEmail,
                userRole: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN]}, 
            },
        });

        if (existingAdmin) {
            this.logger.warn(`Un compte administrateur existe deja.`);
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await this.prisma.user.create({
            data: {
                name: 'Super Admin',
                email: adminEmail,
                userRole: 'SUPER_ADMIN',
                identities: {
                    create: {
                        provider: 'PASSWORD',
                        providerId: 'adminEmail',
                        passwordHash: hashedPassword,
                    },
                },
            },
        });

        this.logger.log(` Premier administrateur créé avec succès (${adminEmail})`);
    }
}