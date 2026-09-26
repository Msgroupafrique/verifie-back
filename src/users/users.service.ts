import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt'

export interface RemoveByEmailInterface {
  email: string;
}

@Injectable()
export class UsersService {

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findUserByEmail(createUserDto.email);

    if (existingUser) {
      throw new ForbiddenException(`L'email est deja utilise`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        identities: {
          create: {
            provider: 'PASSWORD',
            providerId: createUserDto.email,
            passwordHash: hashedPassword,
          }
        }
      },
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return createdUser;
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findUserByEmail (email: string) {
    const findUser = await this.prisma.user.findUnique({
      where: { email }
    })

    return findUser;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async removeByEmail(data: RemoveByEmailInterface) {
    const user = await this.findUserByEmail(data.email);

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    await this.prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès.',
    };
  }
}
