import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const languageJSON = {
  "privacy-policy": {
    "info-we-collect-list": {
      "personal": "व्यक्तिगत जानकारी: नाम, ईमेल पता, फ़ोन नंबर, पता, या कोई अन्य जानकारी जो संपर्क फ़ॉर्म, पंजीकरण, दान, या सदस्यता के दौरान स्वेच्छा से दी जाती है।",
      "non-personal": "गैर-व्यक्तिगत जानकारी: ब्राउज़र प्रकार, IP पता, देखे गए पृष्ठ, साइट पर बिताया गया समय, और अन्य विश्लेषणात्मक जानकारी।"
    },
    "how-we-use-list": {
      "support": "प्रश्नों का उत्तर देने और सहायता प्रदान करने के लिए",
      "process": "सदस्यता, दान, और कार्यक्रम पंजीकरण को संसाधित करने के लिए",
      "updates": "हमारी पहलों, कार्यक्रमों और अवसरों की जानकारी साझा करने के लिए",
      "improve": "हमारी वेबसाइट और सेवाओं को बेहतर बनाने के लिए",
      "compliance": "सामुदायिक सुरक्षा और कानूनी अनुपालन सुनिश्चित करने के लिए"
    },
    "your-rights-list": {
      "access": "हमारे पास मौजूद आपकी व्यक्तिगत जानकारी को देखने का अधिकार",
      "correction": "गलत या अधूरी जानकारी को सुधारने या हटाने का अनुरोध करने का अधिकार",
      "withdraw": "किसी भी समय सहमति वापस लेने का अधिकार"
    },
    "contact-details": {
      "name": "रंगरेज समाज",
      "email": "ईमेल: support@rangrezsamaj.org",
      "phone": "फ़ोन: +91-9414573204",
      "website": "वेबसाइट: https://rangrezsamaj.org"
    }
  },
};

// Helper to flatten nested object
function flatten(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, flatten(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

async function main() {
  const flattened = flatten(languageJSON);

  const upserts = Object.entries(flattened).map(([key, hi]) =>
    prisma.languageContent.upsert({
      where: { key },
      update: { hi },
      create: { key, hi }
    })
  );

  await Promise.all(upserts);

  console.log(`✅ Seeded ${upserts.length} language entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
