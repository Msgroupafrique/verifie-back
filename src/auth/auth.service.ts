import { ForbiddenException, Injectable, NotFoundException,Inject, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { randomUUID, createHash, randomBytes } from 'crypto';
import { UserSessionService } from 'src/user-session/user-session.service';
import { UsersService } from 'src/users/users.service';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';
import { ForgotPassword } from './dto/forgot-password';
import { ResetPassword } from './dto/reset-password';
import { throws } from 'assert';

interface SafeUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject('REFRESH_JWT_SERVICE')
    private readonly refreshJwtService: JwtService,
    private readonly userSessionService: UserSessionService,
    private readonly userService: UsersService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) {}
  
  async register(registerDto: RegisterDto) {
    const registeredUser = await this.userService.create(registerDto);

    return {
      success: true,
      message: 'Compte créé avec succès.',
      user: registeredUser
    }
  }


  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        identities: {
          where: {
            provider: 'PASSWORD',
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    //const passwordIdentity = user.identities[0];
    const [passwordIdentity] = user.identities;


    if (!passwordIdentity?.passwordHash) {
      return null;
    }

    const passwordValid = await bcrypt.compare(
      password,
      passwordIdentity.passwordHash,
    );

    if (!passwordValid) {
      return null;
    }

    const { identities, ...userWithoutIdentities } = user;

    return userWithoutIdentities;
  }

  private async generateToken (id: string, email: string | null) {

    const sessionId = randomUUID();

    const [ accessToken, refreshToken ] = await Promise.all([
      this.jwtService.signAsync({
        sub: id,
        email: email,
      }),
      this.refreshJwtService.signAsync({
        sub: id,
        email: email,
        sid: sessionId,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      sessionId,
    }

  }

  private createHashToken (refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex')
  }

  async login(user: SafeUser) {
    
    const { accessToken, refreshToken, sessionId } = await this.generateToken(user.id, user.email)

    const refreshTokenHash = this.createHashToken(refreshToken)

    const refreshTokenExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    this.userSessionService.create(sessionId, user.id, refreshTokenHash, refreshTokenExpiresAt)


    return {
      success: true,
      message: 'Connexion réussie.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
      },
    };
  }

  //generation du nouveau token
  async refresh(rt: string) {
    if (!rt) {
      throw new UnauthorizedException(
        'Refresh token manquant.',
      );
    }

    // 1. Vérifier la signature et l'expiration du refresh token
    let payload: {
      sub: string;
      email: string | null;
      sid: string;
    };

    try {
      payload = await this.refreshJwtService.verifyAsync(rt);
    } catch {
      throw new UnauthorizedException(
        'Refresh token invalide ou expiré.',
      );
    }

    // 2. Vérifier que le token contient bien un identifiant de session
    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException(
        'Refresh token invalide.',
      );
    }

    // 3. Récupérer la session
    const session = await this.prisma.userSession.findUnique({
      where: {
        id: payload.sid,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException(
        'Session introuvable.',
      );
    }

    // 4. Vérifier que la session appartient bien à l'utilisateur
    if (session.userId !== payload.sub) {
      throw new UnauthorizedException(
        'Session invalide.',
      );
    }

    // 5. Vérifier que la session n'a pas été révoquée
    if (session.revokedAt) {
      throw new UnauthorizedException(
        'Session révoquée.',
      );
    }

    // 6. Vérifier l'expiration de la session en base
    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException(
        'Session expirée.',
      );
    }

    // 7. Vérifier le hash du refresh token
    const refreshTokenHash = this.createHashToken(rt)

    if (refreshTokenHash !== session.refreshTokenHash) {
      throw new UnauthorizedException(
        'Refresh token invalide.',
      );
    }

    // 8. Vérifier que l'utilisateur est toujours actif
    if (!session.user.isActive) {
      throw new UnauthorizedException(
        'Utilisateur désactivé.',
      );
    }

    // 9. Révoquer l'ancien refresh token
    this.userSessionService.update(session.id, new Date())

    const { accessToken, refreshToken, sessionId } = await this.generateToken(session.user.id, session.user.email)

    

    // 13. Hasher le nouveau refresh token
    const newRefreshTokenHash = this.createHashToken(refreshToken)
    const mewRefreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // 14. Créer la nouvelle session
    await this.userSessionService.create(sessionId, session.user.id, newRefreshTokenHash, mewRefreshTokenExpiresAt)

    return {
      success: true,
      message: 'Token renouvelé avec succès.',
      accessToken,
      refreshToken: refreshToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        phone: session.user.phone,
        isActive: session.user.isActive,
      },
    };
  }

  //deconnexion
  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant.');
    }

    let payload: {
      sub: string;
      email: string | null;
      sid: string;
    };

    try {
      payload = await this.refreshJwtService.verifyAsync(refreshToken);
    } catch {
      // Token déjà expiré/invalide :
      // on considère quand même la déconnexion comme réussie.
      return {
        success: true,
        message: 'Déconnexion réussie.',
      };
    }

    if (!payload.sid || !payload.sub) {
      return {
        success: true,
        message: 'Déconnexion réussie.',
      };
    }

    const session = await this.prisma.userSession.findUnique({
      where: {
        id: payload.sid,
      },
    });

    if (!session || session.userId !== payload.sub) {
      return {
        success: true,
        message: 'Déconnexion réussie.',
      };
    }

    if (!session.revokedAt) {
      await this.prisma.userSession.update({
        where: {
          id: session.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return {
      success: true,
      message: 'Déconnexion réussie.',
    };
  }

  //forgot password
  async forgotPassword ({ email }: ForgotPassword) {

    //verifier l'identite de l'utilisateur
    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        provider: 'PASSWORD',
        user: {
          email,
          isActive: true,
        },
      },
      include: {
        user: true,
      },
    });

    //jamais divilgueur le secret de l'utilisateur
    if (!identity) {
      return {
        success: true,
        message: "L'email de réinitialisation a été envoyé pour cet email."
      }
    }

    //generation  du token
    const resetToken = randomBytes(32).toString('hex')

    //hasher le token pour la securiser
    const hashedToken = createHash('sha256').update(resetToken).digest('hex');

    //gerer l'expiration du token, soit 15mn
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    //stocker dans la base
    await this.prisma.authIdentity.update({
      where: { id: identity.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: tokenExpiresAt,
      }
    });

    //creation du lien dynamique
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL')
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`

    console.log('Preparation a l envoie de l email....')

    //envoie de l'email
    try {
      await this.mailerService.sendResetPasswordEmail(identity.user.email!, resetLink)
    } catch (err) {
      //nettoyer la base de donnees
      await this.prisma.authIdentity.update({
        where: { id: identity.id },
        data: {
          resetPasswordExpires: null,
          resetPasswordToken: null,
        }
      })
      //retourner une erreur
      throw new Error(`Echec de l'envoi de l'e-mail`)
    }

    return {
      success: true,
      message: "L'email de réinitialisation a été envoyé pour cet email."
    }

  }

  //reintialisation du mot de passe
  async resetPassword ({ token, password }: ResetPassword) {
    //re-hacher le token recu pour pouvoir le comparer avec celui dans la base
    const hashedToken = createHash('sha256').update(token).digest('hex');

    //trouver l'identite de ce token
    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        provider: 'PASSWORD',
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!identity) {
      throw new UnauthorizedException(`Le jeton de réinitialisation est invalide ou a expiré.`)
    }

    //hacher le nouveau mot de passe
    console.log('hachage du mot de passe')
    const newPasswordHash = await bcrypt.hash(password, 10)

    await this.prisma.$transaction([
      this.prisma.authIdentity.update({
        where: { id: identity.id },
        data: {
          passwordHash: newPasswordHash,
          resetPasswordExpires: null,
          resetPasswordToken: null,
        },
      }),

      this.prisma.userSession.updateMany({
        where: { 
          userId: identity.userId, 
          revokedAt: null
        },
        data: { revokedAt: new Date() }
      }),
    ]);

    console.log('mot de passe mis a jour')

    return {
      success: true,
      message: 'Votre mot de passe a été modifié avec succès. Veuillez vous reconnecter.',
    }
  }

}
