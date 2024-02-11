import { detectPatternsGroups } from "../utils/string"

const lines = [
    "\t\t\t\t\t\t\t\t   CONDITIONS\t\t\t\t Marché n°\t\t\t\t\t\t\tPage 1/43",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°     Page 2/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t      Page 4/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t Page 5/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t   Page 6/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS\tMarché n°\t\t\t     Page 7/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t    Page 8/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t    Page 9/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t    Page 10/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t     Page 11/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS\tMarché n°\t\t\t     Page 12/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t       CONDITIONS\t  Marché n°\t\t\t    Page 13/43",
    "   CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t    Page 14/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t      CONDITIONS\t    Marché n°\t\t    Page 15/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t\t CONDITIONS\t    Marché n°\t\t\t      Page 16/43",
    "\t\t\t\t\t\t\t\t\t  - nombre de kilomètres parcourus : sur justificatif",
    "\t  - péage d’autoroute\t\t\t\t\t     - sur justificatif",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS\t  Marché n°\t\t\t     Page 17/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t    Page 18/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS\tMarché n°\t\t\t  Page 19/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS\t    Marché n°\t\t\t\t  Page 20/43",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t   Page 21/43",
    "\t    U = nombre d'unités de temps de retard.",
    "\t      Le taux de pénalités « T » applicable est fixé à xx % jour calendaire / jour ouvré / heure (",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t    CONDITIONS      Marché n°\t\t\t    Page 23/43",
    "\t  mettre en œuvre les mesures correctives nécessaires, à ses frais et dans le délai notifié par",
    "\t  l’Entreprise.",
    "\t  30.2 RÉCEPTION EN CAS DE FOURNITURES",
    "\t    La réception est prononcée par l'Entreprise à la livraison des fournitures sous réserve de leur",
    "\t  l’une quelconque des actions suivantes, à moins que ces activités aient été expressément",
    "\t  autorisées par Paris 2024, par le CIO ou par l’IPC :",
    "\t     Chacune des Parties s’engage au respect intégral des obligations légales et réglementaires lui",
    "\t  incombant au titre de la législation relative à la protection des Données à Caractère Personnel ( ci-",
    "\t\t       En outre, si le Titulaire est tenu de procéder à un transfert de Données vers un Pays Tiers",
    "\t\t       ou une organisation internationale, en vertu du droit de l’Union Européenne ou du droit de",
    "\t\t\trestitution doit s’accompagner de la destruction de toutes les copies existantes dans les",
    "\t\t\tsystèmes d’information du Titulaire et le Titulaire doit justifier par écrit de leur destruction ;",
    "\t      Assistance du Titulaire",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t  peuvent être valablement mises en place (nécessaires pour transférer licitement les données vers",
    "\t  les pays en question). Attention : la clause ci-dessous ne permet pas – à elle seule - de sécuriser",
    "\t     L’acheteur pourra trouver le modèle des CCT à cette adresse :",
    "\t      https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A32021D0914&qid=1623058111316",
    "\t  33.3.3 ci-dessus.",
    "\t     Conformément aux dispositions de l’article 28.4 du RGPD, le Titulaire s’engage, en cas de",
    "\t  France / dans le monde entier / xxxxx ( à adapter) pour ses besoins propres ainsi que, le cas",
    "\t  échéant, pour ceux des filiales telles que définies dans le Marché.",
    "\t  intégrateurs/développeurs d'application restent régis par lesdits marchés.",
    "\t       POUR LES MARCHÉS SAAS :",
    "\t      L'article 43 des Conditions Générales d'Achat est complété comme suit :",
    "\t     Le Marché peut, à la demande de l’Entreprise, être étendu aux options prévues. Si l’Entreprise",
    "\t\t\t   ANNEXE n°1 : LISTE DES LIVRABLES À FOURNIR PAR LE TITULAIRE",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t   ANNEXE n°2 : BORDEREAU DES PRIX",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t       ANNEXE n° X : RGPD - Modèle d’instructions du RT à l’intention de son Sous Traitant :",
    "\t\t\t\t identification des DCP et leurs traitements",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    "\t\t\t\t\t\t     CONDITIONS\t\t Marché n°\t\t\t     Page 39/43",
    "Relèvent notamment de la catégorie des données « hautement personnelles » les données suivantes :",
    " \t Données bancaires et financières\t\t\t\t      Ex : IBAN, n° de carte de crédit,",
    "\t\t\t\t\t\t\tCatégories",
    "\t  Prestation/Activité sous\t\t\t  de\t\t\t\t\t\t  Opérations",
    " autorisées au titre du Marché.",
    " Les instructions de l’Entreprise sont décrites dans :",
    "     3. INFORMATION DES PERSONNES CONCERNÉES",
    "Au titre de la réglementation Informatique et Libertés (RGPD notamment) Les personnes concernées doivent être",
    "\t\t\t\t\t\t\t  L’Entreprise ☐     Le Titulaire ☐",
    "\t\t     Modalités de réponses aux requêtes par le Titulaire (à remplir si cette option est",
    "\t\t     personnes concernées pourront exercer leurs droits.",
    "     5.RESTITUTION OU SUPPRESSION DES DONNÉES",
    "\t\t\t\t\t\t    CONDITIONS\t Marché n°   Page 43/43",
    "\t\t\t\t\t\t   PARTICULIÈRES",
    "CPA Standard IT EDF - Version 8 du 12 avril 2022",
    ""
]
const matchs = detectPatternsGroups(lines, {
    minLength: 4,
    minOcc: 4,
    minSimilarity: 0.95
})
const detected: string[] = []
matchs.forEach(group => {
    group[0].forEach(idx => detected.push(lines[idx]))
})
console.log(matchs);
console.log(detected);
