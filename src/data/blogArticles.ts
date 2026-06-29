export interface BlogArticle {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  excerpt: string;
  datePublished: string;
  dateModified: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faq: Array<{ question: string; answer: string }>;
}

const dates = { datePublished: '2026-06-29', dateModified: '2026-06-29' };

export const blogArticles: BlogArticle[] = [
  {
    ...dates,
    slug: 'restaurant-centre-ville-beziers',
    title: 'Restaurant au centre-ville de Béziers : une adresse conviviale au 28 Rue Diderot',
    metaTitle: 'Restaurant centre-ville Béziers | Le Petit Bougiote',
    description: 'Découvrez une adresse conviviale au centre-ville de Béziers pour manger un burger, prendre un café ou choisir une formule à emporter.',
    excerpt: 'Quelques repères pratiques pour choisir une adresse simple et conviviale au cœur de Béziers.',
    sections: [
      {
        heading: 'Manger simplement au cœur de Béziers',
        paragraphs: [
          'Chercher un restaurant au centre-ville de Béziers, c’est souvent vouloir réunir plusieurs choses : une adresse facile à rejoindre, une carte compréhensible et un cadre où l’on peut prendre son temps sans compliquer le repas. Le Petit Bougiote s’inscrit dans cette logique de restaurant de quartier. Situé au 28 Rue Diderot, il accueille les personnes qui souhaitent déjeuner, faire une pause ou emporter leur commande.',
          'La situation centrale permet d’intégrer facilement le repas à une journée en ville. On peut venir avant ou après une course, retrouver quelqu’un autour d’un café ou choisir un burger pour une pause plus complète. Cette souplesse correspond bien au rythme du centre-ville, où les envies et le temps disponible ne sont pas toujours les mêmes.',
        ],
      },
      {
        heading: 'Une carte adaptée à différents moments de la journée',
        paragraphs: [
          'Une adresse conviviale ne se résume pas à un seul type de repas. Au Petit Bougiote, les catégories annoncées regroupent notamment des burgers, des cafés, des desserts et des boissons. Cela permet de venir pour manger, mais aussi pour une pause plus légère. La carte en ligne donne un aperçu des familles proposées ; les disponibilités du jour peuvent être confirmées directement auprès du restaurant.',
          'Cette diversité évite d’avoir à choisir entre un restaurant classique et un café. Une même table peut répondre à une envie salée, à une boisson ou à une douceur. Pour les visiteurs du centre-ville comme pour les habitants de Béziers, c’est une manière pratique de garder un point de rendez-vous unique.',
        ],
      },
      {
        heading: 'Sur place ou à emporter selon votre programme',
        paragraphs: [
          'Le repas sur place convient lorsque l’on veut s’installer et profiter du moment. La vente à emporter répond, elle, aux journées plus chargées ou à l’envie de manger ailleurs. Avant de vous déplacer, un appel au 04 58 28 15 22 permet de vérifier les disponibilités et l’organisation du service.',
          'Préparer sa venue est particulièrement utile lorsque l’on dispose d’une pause courte. Consultez le menu, choisissez le mode qui vous convient puis contactez le restaurant si un détail doit être confirmé. Cette démarche simple limite l’attente et facilite l’organisation sans transformer le repas en parcours compliqué.',
        ],
      },
      {
        heading: 'Une adresse rue Diderot facile à identifier',
        paragraphs: [
          'Le Petit Bougiote se trouve au 28 Rue Diderot, 34500 Béziers. Pour éviter les hésitations, la page contact réunit l’adresse, le téléphone et un lien d’itinéraire. Ces informations sont utiles lorsque l’on découvre le quartier ou que l’on partage le rendez-vous avec plusieurs personnes.',
          'Si vous cherchez un restaurant dans le centre-ville de Béziers pour un repas décontracté, un café ou un dessert, vous pouvez consulter la carte avant de venir. L’idée est simple : trouver une adresse locale clairement située et choisir sur place selon votre envie du moment.',
        ],
      },
      {
        heading: 'Quelques repères avant de venir',
        paragraphs: [
          'Pour choisir sereinement, partez d’informations concrètes : l’adresse, la carte, le mode de service et le téléphone. Ces repères valent davantage qu’une liste de promesses générales. Ils permettent de savoir si le restaurant correspond à votre trajet et au temps que vous souhaitez consacrer au repas. La page contact centralise ces éléments pour qu’ils restent faciles à retrouver sur mobile.',
          'Pensez enfin à vérifier les disponibilités si vous avez une envie précise. Une carte peut évoluer au fil du service et des produits proposés. Un échange direct avec Le Petit Bougiote vous évite un déplacement fondé sur une information dépassée. Vous pouvez ainsi arriver rue Diderot en connaissant l’essentiel, tout en gardant la liberté de choisir votre repas une fois sur place.',
        ],
      },
    ],
    faq: [
      { question: 'Où se trouve Le Petit Bougiote ?', answer: 'Le restaurant est situé au 28 Rue Diderot, 34500 Béziers, dans le centre-ville.' },
      { question: 'Peut-on commander à emporter ?', answer: 'La vente à emporter est proposée. Appelez le restaurant pour confirmer les disponibilités et les modalités du moment.' },
      { question: 'Comment préparer sa visite ?', answer: 'Consultez le menu en ligne, puis utilisez la page contact pour appeler ou ouvrir l’itinéraire.' },
    ],
  },
  {
    ...dates,
    slug: 'burger-beziers-fait-maison',
    title: 'Burger à Béziers : pourquoi choisir un burger fait maison ?',
    metaTitle: 'Burger fait maison à Béziers | Le Petit Bougiote',
    description: 'Pourquoi choisir un burger fait maison à Béziers ? Découvrez une approche simple, généreuse et adaptée au déjeuner comme au dîner.',
    excerpt: 'Ce que l’on recherche vraiment derrière l’expression « burger fait maison » à Béziers.',
    sections: [
      {
        heading: 'Le burger, un repas simple qui demande de l’équilibre',
        paragraphs: [
          'Un burger paraît simple : du pain, une garniture et un accompagnement éventuel. Pourtant, le plaisir dépend surtout de l’équilibre entre les éléments. Un burger préparé à la demande permet de conserver des textures agréables et une composition cohérente. À Béziers, cette recherche de simplicité explique l’intérêt pour les burgers faits maison, servis sans prétention mais avec attention.',
          'Choisir une adresse locale, c’est aussi pouvoir poser une question sur la carte et adapter son repas au moment. Certains viennent pour un déjeuner rapide, d’autres pour une soirée détendue ou une commande à emporter. Le burger se prête bien à ces usages parce qu’il reste lisible, convivial et facile à associer à une boisson ou un dessert.',
        ],
      },
      {
        heading: 'Que signifie « fait maison » pour le client ?',
        paragraphs: [
          'Pour la personne qui commande, l’expression évoque d’abord une préparation soignée et un repas qui ne donne pas l’impression d’être standardisé. Elle invite à regarder la fraîcheur perçue, l’assemblage et la façon dont le burger arrive à table. Il ne s’agit pas d’accumuler les ingrédients, mais de proposer une assiette généreuse qui reste agréable du début à la fin.',
          'La carte du Petit Bougiote présente ses catégories et ses choix disponibles. Comme une offre peut évoluer, le moyen le plus fiable de connaître les propositions du jour reste de consulter le menu puis d’appeler le restaurant. Cette transparence est préférable à une longue liste figée qui ne correspondrait plus au service réel.',
        ],
      },
      {
        heading: 'Un choix pratique au déjeuner comme au dîner',
        paragraphs: [
          'À midi, le burger répond à une envie de repas complet sans multiplier les étapes. En fin de journée, il devient facilement un moment convivial à partager. La possibilité de manger sur place ou d’opter pour la vente à emporter permet de s’adapter à son agenda, que l’on travaille dans le centre, que l’on visite Béziers ou que l’on rentre chez soi.',
          'Pour une commande à emporter, mieux vaut anticiper quelques minutes. Vérifiez la carte en ligne, repérez les catégories qui vous intéressent et contactez l’équipe au 04 58 28 15 22 si vous souhaitez confirmer un produit. Vous obtenez ainsi une information actuelle, directement auprès du restaurant.',
        ],
      },
      {
        heading: 'Où trouver un burger dans le centre de Béziers ?',
        paragraphs: [
          'Le Petit Bougiote se situe au 28 Rue Diderot, 34500 Béziers. L’adresse permet d’associer facilement un repas à une sortie en centre-ville. On peut y venir pour un burger, mais également prolonger la pause autour d’un café, d’une boisson ou d’un dessert selon les disponibilités.',
          'Si vous recherchez un burger fait maison à Béziers, commencez par regarder la carte plutôt que de vous fier à une promesse générale. Les catégories, l’accès et le téléphone sont accessibles sur le site. Vous pourrez alors choisir un repas sur place ou organiser une commande à emporter de manière simple.',
        ],
      },
      {
        heading: 'Bien choisir sans chercher un classement absolu',
        paragraphs: [
          'Le burger idéal n’est pas le même pour tout le monde. Le choix dépend de l’appétit, du temps disponible, de l’envie de rester sur place et des accompagnements recherchés. Une carte claire aide donc davantage qu’un classement présenté comme universel. Elle permet de comparer les options réelles et de sélectionner une formule cohérente avec le moment.',
          'À Béziers, une adresse centrale ajoute un avantage pratique : on peut rejoindre facilement le restaurant puis poursuivre sa journée. En consultant les informations du Petit Bougiote avant votre venue, vous savez où aller et comment contacter l’équipe. Il ne reste ensuite qu’à choisir le burger et, selon l’envie, une boisson, un café ou un dessert disponible ce jour-là.',
        ],
      },
    ],
    faq: [
      { question: 'Le Petit Bougiote propose-t-il des burgers à Béziers ?', answer: 'Oui, les burgers font partie des catégories proposées par le restaurant.' },
      { question: 'Peut-on prendre un burger à emporter ?', answer: 'Oui, la vente à emporter est proposée selon l’organisation et les disponibilités du moment.' },
      { question: 'Où consulter les choix disponibles ?', answer: 'La page menu présente la carte. Un appel permet de confirmer les disponibilités du jour.' },
    ],
  },
  {
    ...dates,
    slug: 'vente-a-emporter-beziers',
    title: 'Vente à emporter à Béziers : burgers, boissons et desserts au centre-ville',
    metaTitle: 'Vente à emporter Béziers | Le Petit Bougiote',
    description: 'Organisez votre repas à emporter à Béziers : burgers, boissons et desserts au centre-ville, avec menu, téléphone et accès pratiques.',
    excerpt: 'Une solution pratique pour organiser un repas à emporter dans le centre-ville de Béziers.',
    sections: [
      {
        heading: 'Pourquoi choisir un repas à emporter en centre-ville ?',
        paragraphs: [
          'La vente à emporter est utile lorsque le temps manque, mais aussi lorsque l’on préfère manger chez soi, au travail ou dans un autre lieu. Dans le centre-ville de Béziers, elle permet de récupérer un repas sans changer tout son programme. Le Petit Bougiote propose cette possibilité depuis son adresse du 28 Rue Diderot.',
          'L’avantage tient à la flexibilité. Vous pouvez consulter la carte à l’avance, identifier les catégories qui correspondent à votre envie et contacter le restaurant si nécessaire. Le repas reste un moment agréable, même lorsqu’il doit s’insérer entre deux rendez-vous ou accompagner une soirée tranquille à la maison.',
        ],
      },
      {
        heading: 'Burgers, boissons et desserts : composer selon son envie',
        paragraphs: [
          'Les catégories confirmées du Petit Bougiote comprennent les burgers, les boissons, le café et les desserts. La disponibilité précise peut varier ; le site évite donc de promettre un produit qui ne serait pas proposé le jour de votre commande. La carte en ligne reste le premier repère, et un appel donne la confirmation la plus actuelle.',
          'Cette organisation permet de prévoir un repas salé, d’ajouter une boisson ou de terminer par une douceur. Une commande à emporter peut ainsi répondre à une pause déjeuner comme à une envie plus gourmande. Le choix dépend simplement de la carte du moment et du nombre de personnes concernées.',
        ],
      },
      {
        heading: 'Comment préparer sa commande à emporter ?',
        paragraphs: [
          'Commencez par parcourir le menu et notez les catégories qui vous intéressent. Ensuite, appelez le 04 58 28 15 22 pour confirmer les disponibilités et connaître l’organisation du retrait. Indiquer clairement votre demande facilite l’échange et permet au restaurant de vous renseigner sans ambiguïté.',
          'Pensez aussi au trajet. La page contact propose un lien vers l’itinéraire du 28 Rue Diderot. Si vous venez pour la première fois, ouvrez-le avant de partir. Ces quelques gestes — menu, appel, itinéraire — rendent la récupération plus fluide et évitent de chercher les informations au dernier moment.',
        ],
      },
      {
        heading: 'Une option locale pour les habitants et visiteurs',
        paragraphs: [
          'La vente à emporter ne s’adresse pas seulement aux personnes pressées. Elle peut faciliter un repas en famille, une pause entre collègues ou une journée de découverte de Béziers. Une adresse centrale donne la liberté de continuer sa journée tout en choisissant un restaurant local clairement identifié.',
          'Le Petit Bougiote réunit ses informations pratiques sur le site : carte, téléphone et accès. Si vous cherchez une vente à emporter à Béziers pour des burgers, boissons ou desserts, consultez les choix disponibles puis contactez directement l’établissement. Vous disposerez ainsi d’une réponse adaptée au service du jour.',
        ],
      },
      {
        heading: 'Transporter et déguster son repas dans de bonnes conditions',
        paragraphs: [
          'Une commande à emporter est plus agréable lorsqu’elle est récupérée près du moment où elle sera dégustée. Organisez votre trajet et prévoyez de rejoindre rapidement votre destination. Si plusieurs personnes commandent, regroupez les choix avant l’appel : la demande sera plus claire et la confirmation des produits disponibles plus simple.',
          'À la réception, vérifiez que le nombre d’éléments correspond à votre commande avant de repartir. Ces habitudes très concrètes évitent les oublis et contribuent à une expérience fluide. Elles sont utiles pour un déjeuner au bureau comme pour un repas chez soi. Le restaurant peut vous renseigner directement si vous avez une contrainte particulière liée à l’heure de retrait.',
          'Prévoyez également une solution adaptée pour les boissons et les desserts pendant le trajet. En cas de doute sur un produit, demandez conseil au moment de l’appel. Cette vérification rapide aide à conserver une commande pratique à transporter et agréable à partager une fois arrivé.',
        ],
      },
    ],
    faq: [
      { question: 'Comment commander à emporter ?', answer: 'Consultez la carte puis appelez le 04 58 28 15 22 pour confirmer votre commande et le retrait.' },
      { question: 'Quels produits sont proposés à emporter ?', answer: 'Les catégories incluent notamment burgers, boissons et desserts, selon les disponibilités du jour.' },
      { question: 'Où récupérer la commande ?', answer: 'Le Petit Bougiote se trouve au 28 Rue Diderot, 34500 Béziers.' },
    ],
  },
  {
    ...dates,
    slug: 'cafe-dessert-beziers',
    title: 'Café et dessert à Béziers : une pause simple et gourmande en centre-ville',
    metaTitle: 'Café et dessert à Béziers | Le Petit Bougiote',
    description: 'Envie d’un café ou d’un dessert à Béziers ? Découvrez une adresse conviviale au centre-ville pour une pause simple et gourmande.',
    excerpt: 'Une pause café et dessert au centre-ville, entre rendez-vous, promenade ou moment partagé.',
    sections: [
      {
        heading: 'La pause café, un vrai moment dans la journée',
        paragraphs: [
          'Un café peut marquer le début de la matinée, offrir une respiration dans l’après-midi ou prolonger une conversation après un repas. En centre-ville de Béziers, une adresse facile à rejoindre permet de transformer quelques minutes disponibles en pause agréable. Le Petit Bougiote accueille ces moments au 28 Rue Diderot.',
          'On ne recherche pas toujours un repas complet. Parfois, une boisson chaude et une douceur suffisent. Pouvoir choisir entre plusieurs catégories au même endroit facilite les rendez-vous : chacun peut adapter sa commande à son appétit et au temps dont il dispose, sans imposer un format unique à toute la table.',
        ],
      },
      {
        heading: 'Associer café, boisson et dessert selon l’envie',
        paragraphs: [
          'Le café et les desserts font partie des catégories annoncées par Le Petit Bougiote, aux côtés d’autres boissons. Les propositions précises peuvent évoluer, ce qui est naturel pour une carte vivante. Le menu en ligne permet de repérer les familles disponibles, tandis qu’un appel au restaurant donne une confirmation pour le jour même.',
          'L’intérêt d’une pause gourmande vient aussi de sa liberté. Elle peut être rapide, prise seul entre deux activités, ou durer davantage lorsque l’on retrouve un proche. Un dessert peut accompagner le café ou devenir le centre de la pause. Il n’existe pas de bonne formule universelle : l’essentiel est de choisir selon le moment.',
        ],
      },
      {
        heading: 'Une halte pratique pendant une journée à Béziers',
        paragraphs: [
          'Lorsque l’on passe la journée en ville, il est utile de connaître une adresse où l’on peut s’arrêter sans organiser un long repas. La rue Diderot se rejoint facilement grâce au lien d’itinéraire disponible sur la page contact. L’adresse et le téléphone peuvent également être partagés avec la personne que vous retrouvez.',
          'Avant de venir pour un produit précis, consultez la carte ou appelez le 04 58 28 15 22. Cette vérification est particulièrement pratique pour les desserts, dont la disponibilité peut changer. Vous évitez ainsi les suppositions et choisissez votre pause à partir d’informations à jour.',
        ],
      },
      {
        heading: 'Sur place ou à emporter',
        paragraphs: [
          'S’installer sur place permet de profiter pleinement de la pause. La vente à emporter convient lorsque l’on souhaite continuer sa promenade, rejoindre son lieu de travail ou rentrer chez soi. Selon les produits et l’organisation du moment, l’équipe peut vous indiquer la solution la plus adaptée.',
          'Pour un café ou un dessert à Béziers, Le Petit Bougiote constitue une adresse locale à considérer dans le centre-ville. Consultez le menu, vérifiez l’accès et contactez le restaurant si vous avez une question. La pause reste ainsi ce qu’elle devrait être : simple, gourmande et facile à intégrer à la journée.',
        ],
      },
      {
        heading: 'Faire de la pause un point de rendez-vous',
        paragraphs: [
          'Le café est aussi un prétexte pratique pour se retrouver. Pour éviter les messages dispersés, partagez directement l’adresse complète et le lien de la page contact. Chacun dispose alors du même itinéraire et du même numéro de téléphone. Cette petite préparation est utile lorsque certaines personnes connaissent peu le centre de Béziers.',
          'Si les goûts diffèrent, les catégories de boissons et de desserts laissent plusieurs possibilités sans obliger tout le monde à prendre la même chose. Celui qui a davantage faim peut aussi consulter le reste de la carte. Une adresse polyvalente simplifie ainsi les rendez-vous, qu’ils durent vingt minutes ou se prolongent autour d’une conversation. Il suffit de confirmer les disponibilités lorsque votre choix porte sur une douceur particulière.',
          'Avant de partir, vérifiez simplement l’horaire qui correspond à votre venue et gardez le numéro du restaurant à portée de main. Vous pourrez signaler un retard ou poser une dernière question sans chercher de nouveau les coordonnées.',
        ],
      },
    ],
    faq: [
      { question: 'Peut-on venir seulement pour un café ?', answer: 'Oui, le café fait partie des catégories proposées au Petit Bougiote.' },
      { question: 'Des desserts sont-ils disponibles ?', answer: 'Les desserts figurent parmi les catégories de la carte. Contactez le restaurant pour connaître les disponibilités du jour.' },
      { question: 'Où faire cette pause à Béziers ?', answer: 'Le Petit Bougiote est situé au 28 Rue Diderot, dans le centre-ville de Béziers.' },
    ],
  },
  {
    ...dates,
    slug: 'ou-manger-burger-beziers',
    title: 'Où manger un burger à Béziers sans quitter le centre-ville ?',
    metaTitle: 'Où manger un burger à Béziers centre-ville ?',
    description: 'Où manger un burger à Béziers centre-ville ? Repères pratiques pour choisir une adresse, consulter la carte et organiser votre venue.',
    excerpt: 'Les critères utiles pour trouver un burger sans quitter le centre-ville de Béziers.',
    sections: [
      {
        heading: 'Commencer par l’emplacement et les informations pratiques',
        paragraphs: [
          'Pour savoir où manger un burger à Béziers, le premier critère est souvent plus concret que culinaire : l’adresse doit correspondre à votre programme. Une localisation en centre-ville permet de venir pendant une journée de travail, une sortie ou une promenade. Le Petit Bougiote est situé au 28 Rue Diderot, 34500 Béziers.',
          'Une adresse claire ne suffit pas ; il faut aussi pouvoir vérifier la carte et contacter le restaurant. Le site réunit ces informations avec un menu, un numéro de téléphone et un lien d’itinéraire. Vous pouvez donc préparer votre venue sans chercher les données sur plusieurs plateformes ou vous fier à des informations anciennes.',
        ],
      },
      {
        heading: 'Regarder la carte avant de choisir',
        paragraphs: [
          'Le mot « burger » recouvre des envies très différentes. Certains recherchent un repas rapide, d’autres une assiette généreuse à partager dans une ambiance détendue. Consulter le menu aide à comprendre l’esprit de l’adresse et les autres catégories proposées. Au Petit Bougiote, la carte comprend également cafés, boissons et desserts.',
          'Les disponibilités peuvent changer. Plutôt que d’imaginer un produit ou un prix, vérifiez la carte actuelle et appelez le 04 58 28 15 22 pour une confirmation. Cette démarche simple est particulièrement utile si vous venez à plusieurs, si vous avez peu de temps ou si vous souhaitez emporter votre repas.',
        ],
      },
      {
        heading: 'Choisir entre sur place et vente à emporter',
        paragraphs: [
          'Manger sur place permet de faire une vraie pause et de profiter du cadre. La vente à emporter est plus adaptée à un emploi du temps serré ou à l’envie de déjeuner ailleurs. Une bonne adresse de centre-ville doit pouvoir expliquer clairement les modalités proposées au moment de la commande.',
          'Avant votre déplacement, indiquez par téléphone ce que vous souhaitez et demandez si le retrait est possible dans le créneau qui vous convient. Vous saurez ainsi comment organiser votre passage rue Diderot. Le lien d’itinéraire disponible sur la page contact vous guide ensuite directement vers le restaurant.',
        ],
      },
      {
        heading: 'Une adresse conviviale plutôt qu’un classement artificiel',
        paragraphs: [
          'Trouver le « meilleur » burger dépend des goûts, du moment et de ce que l’on attend du repas. Il est plus utile de chercher une adresse dont l’offre, l’emplacement et l’ambiance correspondent à vos besoins. Si vous voulez un burger dans le centre-ville de Béziers, Le Petit Bougiote propose une solution locale et accessible.',
          'Vous pouvez commencer par parcourir la carte, puis choisir de venir sur place ou de contacter l’équipe pour une commande à emporter. Et si la pause se prolonge, les catégories café, boissons et desserts offrent d’autres possibilités. Le bon choix est celui qui s’accorde simplement à votre journée.',
        ],
      },
      {
        heading: 'Préparer une sortie à plusieurs',
        paragraphs: [
          'Lorsque plusieurs personnes se retrouvent, le choix du lieu devient plus facile si chacun peut consulter les mêmes informations. Envoyez le lien du menu et celui de la page contact avant le rendez-vous. Les participants peuvent repérer les catégories qui les intéressent et rejoindre directement le 28 Rue Diderot sans multiplier les explications.',
          'Si le groupe souhaite commander à emporter, rassemblez les demandes puis appelez le restaurant pour les confirmer. Cette méthode limite les changements de dernière minute et donne à l’équipe une vue claire de la commande. Pour un repas sur place, un appel reste utile si vous avez une question sur l’accueil à l’heure envisagée. Vous organisez ainsi la sortie à partir de faits vérifiés, sans supposer une disponibilité particulière.',
          'Cette préparation laisse davantage de place au moment partagé une fois tout le monde réuni. Elle évite aussi qu’une personne arrive à une autre adresse ou s’appuie sur une ancienne information trouvée ailleurs en ligne.',
        ],
      },
    ],
    faq: [
      { question: 'Où manger un burger dans le centre de Béziers ?', answer: 'Le Petit Bougiote propose des burgers au 28 Rue Diderot, dans le centre-ville de Béziers.' },
      { question: 'Faut-il réserver ?', answer: 'Le site ne promet pas de réservation. Appelez directement le restaurant pour toute question sur l’accueil et les disponibilités.' },
      { question: 'Peut-on consulter la carte avant de venir ?', answer: 'Oui, la page menu présente les catégories et les choix de la carte en ligne.' },
    ],
  },
];

export function getBlogArticle(slug: string | undefined) {
  return blogArticles.find((article) => article.slug === slug);
}
