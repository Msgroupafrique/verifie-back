import {
  Injectable,
} from '@nestjs/common';

export interface LinkAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  observations: string[];
  actions: string[];
  thingsToAvoid: string[];
}

@Injectable()
export class LinkAnalyzerService {
  analyze(urlString: string): LinkAnalysis {
    const url = new URL(urlString.trim());

    const observations: string[] = [];
    const actions: string[] = [];
    const thingsToAvoid: string[] = [];

    let riskScore = 0;

    // 1. HTTPS
    if (url.protocol === 'https:') {
      observations.push(
        'Le lien utilise HTTPS.',
      );
    } else {
      observations.push(
        'Le lien utilise HTTP et non HTTPS.',
      );

      riskScore += 2;
    }

    // 2. Adresse IP utilisée comme domaine
    const hostname = url.hostname.toLowerCase();

    const isIpAddress =
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);

    if (isIpAddress) {
      observations.push(
        'Le lien utilise directement une adresse IP au lieu d’un nom de domaine.',
      );

      riskScore += 3;
    }

    // 3. Punycode
    if (hostname.includes('xn--')) {
      observations.push(
        'Le domaine contient une représentation Punycode pouvant correspondre à des caractères internationaux.',
      );

      riskScore += 2;
    }

    // 4. Sous-domaines nombreux
    const parts = hostname.split('.');

    if (parts.length >= 5) {
      observations.push(
        'Le domaine possède un nombre élevé de sous-domaines.',
      );

      riskScore += 1;
    }

    // 5. Userinfo dans l'URL
    if (url.username || url.password) {
      observations.push(
        'L’URL contient des informations avant le domaine.',
      );

      riskScore += 3;
    }

    // 6. Paramètres très nombreux
    const parametersCount = [...url.searchParams.keys()].length;

    if (parametersCount >= 6) {
      observations.push(
        'L’URL contient un nombre important de paramètres.',
      );

      riskScore += 1;
    }

    // 7. Mots fréquemment utilisés dans les liens de phishing
    const suspiciousTerms = [
      'login',
      'verify',
      'verification',
      'secure',
      'account',
      'password',
      'payment',
      'wallet',
      'confirm',
      'update',
      'urgent',
    ];

    const urlText = url.toString().toLowerCase();

    const detectedTerms = suspiciousTerms.filter((term) =>
      urlText.includes(term),
    );

    if (detectedTerms.length > 0) {
      observations.push(
        `L’URL contient des termes associés à des pages sensibles : ${detectedTerms.join(', ')}.`,
      );

      riskScore += Math.min(
        detectedTerms.length,
        3,
      );
    }

    // Résultat
    let riskLevel: LinkAnalysis['riskLevel'];
    let confidence: LinkAnalysis['confidence'];

    if (riskScore >= 5) {
      riskLevel = 'HIGH';
      confidence = 'MEDIUM';
    } else if (riskScore >= 2) {
      riskLevel = 'MEDIUM';
      confidence = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
      confidence = 'MEDIUM';
    }

    if (riskLevel === 'LOW') {
      actions.push(
        'Vérifier que le domaine correspond bien au site officiel attendu.',
      );

      actions.push(
        'Éviter de saisir des informations sensibles si l’origine du lien est inconnue.',
      );
    }

    if (riskLevel === 'MEDIUM') {
      actions.push(
        'Vérifier le domaine directement depuis une source officielle.',
      );

      actions.push(
        'Ne pas saisir de mot de passe ou de données bancaires avant vérification.',
      );

      thingsToAvoid.push(
        'Ne pas se fier uniquement à la présence de HTTPS.',
      );
    }

    if (riskLevel === 'HIGH') {
      actions.push(
        'Ne pas ouvrir le lien si son origine est inconnue.',
      );

      actions.push(
        'Accéder au service concerné en saisissant directement son adresse officielle.',
      );

      thingsToAvoid.push(
        'Ne pas saisir d’identifiants, de données bancaires ou de codes de validation.',
      );

      thingsToAvoid.push(
        'Ne pas effectuer de paiement depuis ce lien sans vérification externe.',
      );
    }

    const summary =
      riskLevel === 'HIGH'
        ? 'Plusieurs signaux techniques nécessitent une vérification approfondie de ce lien.'
        : riskLevel === 'MEDIUM'
          ? 'Le lien présente certains signaux nécessitant de la prudence.'
          : 'Aucun signal technique fortement suspect n’a été détecté lors de cette vérification.';

    return {
      riskLevel,
      confidence,
      summary,
      observations: observations.slice(0, 5),
      actions: actions.slice(0, 3),
      thingsToAvoid: thingsToAvoid.slice(0, 2),
    };
  }
}