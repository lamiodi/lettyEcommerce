import type { Product } from "@/types";

/**
 * Product catalog for LETTY.
 * Featuring the official Letty Beauty Lip Liner & Lip Gloss collections,
 * priced in British Pounds (£) and structured with complete editorial PDP details.
 */
export const products: Product[] = [
  {
    id: "p-letty-lip-liner",
    slug: "letty-velvet-lip-liner",
    name: "Letty Velvet Sculpt Lip Liner",
    tagline: "Smudge-Proof Contour & Ultra-Pigmented Definition",
    brandSlug: "letty",
    categorySlug: "makeup",
    subcategorySlug: "lip-liner",
    basePriceUsd: 9, // £9.00 GBP
    rating: 4.9,
    reviewCount: 48,
    isNew: true,
    isBestSeller: true,
    isVegan: true,
    collectionSlugs: ["the-edit", "golden-hour"],
    relatedSlugs: ["letty-glass-lip-gloss"],

    description:
      "An easy-to-use, long-lasting lip liner designed to effortlessly define, shape and enhance your lips with a smudge-proof & transfer-proof finish. The creamy, easy-glide formula delivers rich colour without dragging or tugging, while the long-lasting, smudge- and transfer-proof finish helps keep your lip look perfectly in place.",

    details: [
      "Ultra-pigmented colour payoff in a single swipe",
      "Smudge-proof and transfer-proof all-day wear",
      "Smooth, creamy glide without dragging or tugging",
      "Retractable precision tip for effortless overlining",
      "Enriched with Shea Butter and Vitamin E",
      "Net Wt. 0.3g / 0.01 oz.",
      "Cruelty-free and formulated without parabens",
    ],

    whatItIs:
      "An easy-to-use, long-lasting lip liner designed to effortlessly define, shape and enhance your lips with a smudge-proof & transfer-proof finish.",

    whatItDoes:
      "This highly pigmented lip liner glides on smoothly to precisely contour and define lips, creating a flawless lip shape that stays put for all-day wear.\n\nThe creamy, easy-glide formula delivers rich colour without dragging or tugging, while the long-lasting, smudge- and transfer-proof finish helps keep your lip look perfectly in place.",

    whatElseToKnow: [
      "Smudge-proof & transfer-proof finish",
      "Long-lasting wear that stays locked for hours",
      "Ultra-pigmented colour in a velvety matte finish",
      "Smooth, easy-glide application with zero feathering",
      "Precise lip definition to naturally contour or reshape",
      "Easy to overline & create a sculpted pout",
      "Comfortable, weightless feel on the lips",
      "Helps prevent feathering & bleeding of glosses or lipsticks",
      "Defines and enhances the natural appearance of lips",
      "Helps create a fuller-looking, dimensional pout",
    ],

    howToUseSteps: [
      {
        title: "Line & Define",
        text: "Start at the cupid’s bow and trace along the natural lip line, working outward toward the corners.",
      },
      {
        title: "Overline",
        text: "For a fuller-looking pout, slightly extend the liner just beyond your natural lip line, focusing on the centre of the lips.",
      },
      {
        title: "Fill",
        text: "Use the liner to fill in the entire lip for intense, long-lasting colour or layer underneath your favourite lipstick or lip gloss.",
      },
    ],

    proTip:
      "For a perfectly defined, long-lasting lip, line the perimeter first, then softly blend the liner inward before applying your lip colour on top.",

    beautyHack: {
      title: "Get the Perfect Long-Lasting Lip",
      steps: [
        "Start with clean, dry lips.",
        "Outline your natural lip shape with the liner.",
        "Slightly overline the centre of the lips if desired.",
        "Fill in the lips for added intensity and longevity.",
        "Layer your favourite lip colour or gloss on top.",
      ],
    },

    ingredients:
      "PARAFFINUM LIQUIDUM, POLYBUTENE, PENTAERYTHRITYL TETRAISOSTEARATE, DIISOSTEARYL MALATE, HYDROGENATED STYRENE/ISOPRENE COPOLYMER, SILICA DIMETHYL SILYLATE, BUTYROSPERMUM PARKII (SHEA BUTTER), TOCOPHEROL, CI 45410, CI 19140, CI 77491, CI 77891, CI 77492, CI 77499, PHENOXYETHANOL.",

    pairWith: {
      name: "Letty Glass Shine Lip Gloss",
      slug: "letty-glass-lip-gloss",
      shade: "Velvet Nude",
      priceGbp: 12,
      image: "/products/lip-gloss/04-velvet-nude/IMG_6606.PNG",
    },

    media: [
      {
        id: "m-liner-1",
        imageKey: "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
        alt: "Letty Velvet Sculpt Lip Liner — 01 Cafe Creme with swatch",
        position: 0,
      },
      {
        id: "m-liner-2",
        imageKey: "/IMG_6386.PNG",
        alt: "Letty Lip Liner Crimson in aesthetic vanity flatlay with lip glosses",
        position: 1,
      },
      {
        id: "m-liner-3",
        imageKey: "/IMG_6270.PNG",
        alt: "Letty Beauty editorial campaign — flawless pout with lip liner and lip gloss",
        position: 2,
      },
      {
        id: "m-liner-4",
        imageKey: "/products/lip-liner/02-cocoa-bean/IMG_6626 (1).PNG",
        alt: "Letty Velvet Sculpt Lip Liner — 02 Cocoa Bean",
        position: 3,
      },
      {
        id: "m-liner-5",
        imageKey: "/products/lip-liner/04-crimson/IMG_6628.PNG",
        alt: "Letty Velvet Sculpt Lip Liner — 04 Crimson",
        position: 4,
      },
      {
        id: "m-liner-6",
        imageKey: "/products/lip-liner/05-terra/IMG_6629.PNG",
        alt: "Letty Velvet Sculpt Lip Liner — 05 Terra",
        position: 5,
      },
      {
        id: "m-liner-7",
        imageKey: "/products/lip-liner/07-nightfall/IMG_6632.PNG",
        alt: "Letty Velvet Sculpt Lip Liner — 07 Nightfall",
        position: 6,
      },
    ],

    variants: [
      {
        id: "v-liner-01",
        sku: "LET-LL-01",
        color: "01 Cafe Creme",
        colorHex: "#C49E85",
        stockQuantity: 25,
        image: "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
      },
      {
        id: "v-liner-02",
        sku: "LET-LL-02",
        color: "02 Cocoa Bean",
        colorHex: "#5C3828",
        stockQuantity: 20,
        image: "/products/lip-liner/02-cocoa-bean/IMG_6626 (1).PNG",
      },
      {
        id: "v-liner-03",
        sku: "LET-LL-03",
        color: "03 Honeycomb",
        colorHex: "#B87B56",
        stockQuantity: 18,
        image: "/products/lip-liner/03-honeycomb/IMG_6627.PNG",
      },
      {
        id: "v-liner-04",
        sku: "LET-LL-04",
        color: "04 Crimson",
        colorHex: "#8E2026",
        stockQuantity: 30,
        image: "/products/lip-liner/04-crimson/IMG_6628.PNG",
      },
      {
        id: "v-liner-05",
        sku: "LET-LL-05",
        color: "05 Terra",
        colorHex: "#A7584A",
        stockQuantity: 22,
        image: "/products/lip-liner/05-terra/IMG_6629.PNG",
      },
      {
        id: "v-liner-06",
        sku: "LET-LL-06",
        color: "06 Chestnut",
        colorHex: "#4A2E2B",
        stockQuantity: 15,
        image: "/products/lip-liner/06-chestnut/IMG_6631.PNG",
      },
      {
        id: "v-liner-07",
        sku: "LET-LL-07",
        color: "07 Nightfall",
        colorHex: "#3B1F2B",
        stockQuantity: 14,
        image: "/products/lip-liner/07-nightfall/IMG_6632.PNG",
      },
    ],
  },

  {
    id: "p-letty-lip-gloss",
    slug: "letty-glass-lip-gloss",
    name: "Letty Glass Shine Lip Gloss",
    tagline: "High-Shine Hydration & Luscious Fuller Lips",
    brandSlug: "letty",
    categorySlug: "makeup",
    subcategorySlug: "lip-gloss",
    basePriceUsd: 12, // £12.00 GBP
    rating: 5.0,
    reviewCount: 62,
    isNew: true,
    isBestSeller: true,
    isVegan: true,
    collectionSlugs: ["the-edit", "golden-hour"],
    relatedSlugs: ["letty-velvet-lip-liner"],

    description:
      "A high-shine, ultra-comfortable lip gloss that delivers a glossy, juicy finish while leaving lips looking fuller, smoother and beautifully hydrated. Non-sticky, cushiony texture with reflective glass shine and buildable color.",

    details: [
      "Glass-like reflective shine without any stickiness",
      "Doe-foot precision applicator designed to hold maximum formula",
      "Instant faux-filler smoothing and plumping appearance",
      "Formulated with Shea Butter and Vitamin E for deep hydration",
      "Delicious subtle sweet vanilla aroma",
      "Net Vol. 5ml / 0.17 fl. oz.",
      "Cruelty-free and vegan formula",
    ],

    whatItIs:
      "A high-shine, ultra-comfortable lip gloss that delivers a glossy, juicy finish while leaving lips looking fuller, smoother and beautifully hydrated.",

    whatItDoes:
      "This non-sticky lip gloss glides effortlessly onto the lips, providing instant shine and buildable colour for a luscious, glass-like finish.\n\nThe lightweight, cushiony formula keeps lips feeling soft and comfortable while creating a smooth, reflective shine that catches the light from every angle.",

    whatElseToKnow: [
      "High-shine, luminous glass finish",
      "Non-sticky & ultra-comfortable lightweight feel",
      "Cushiony texture that melts onto lips",
      "Buildable colour from translucent glaze to rich tint",
      "Instantly enhances the appearance of lips",
      "Helps lips look visibly smoother, plumper & fuller",
      "Deeply hydrating feel that prevents dryness",
      "Can be worn alone or layered over lip liner & lipstick",
      "Plush juicy doe foot with pointed precision tips",
    ],

    howToUseSteps: [
      {
        title: "Glide & Shine",
        text: "Using the precision doe-foot applicator, swipe across bare lips for an instant high-gloss, hydrated finish.",
      },
      {
        title: "Layer & Plump",
        text: "Layer over Letty Velvet Sculpt Lip Liner for high-definition 3D volume and a luscious faux-filler effect.",
      },
      {
        title: "Centre Highlight",
        text: "Tap a tiny drop of 'Midas Touch' to the centre of lips to catch light from every angle.",
      },
    ],

    proTip:
      "Apply a dot of Midas Touch to the centre of the cupid's bow and lower lip for an amplified reflective 3D pout effect.",

    beautyHack: {
      title: "The Signature Faux-Filler Glaze",
      steps: [
        "Exfoliate and start with smooth, hydrated lips.",
        "Line and softly shade outer lips with your matching Letty Lip Liner.",
        "Generously sweep Letty Glass Shine Lip Gloss from centre outward.",
        "Enjoy hours of non-sticky, reflective glass-like fullness.",
      ],
    },

    ingredients:
      "POLYBUTENE, OCTYLDODECANOL, HYDROGENATED POLYISOBUTENE, DIISOSTEARYL MALATE, TRIDECYL TRIMELLITATE, BIS-DIGLYCERYL POLYACYLADIPATE-2, SILICA DIMETHYL SILYLATE, BUTYROSPERMUM PARKII (SHEA) BUTTER, TOCOPHERYL ACETATE (VITAMIN E), PHENOXYETHANOL, ETHYLHEXYLGLYCERIN, AROMA (FLAVOR). MAY CONTAIN (+/-): CI 77891 (TITANIUM DIOXIDE), CI 77491, CI 77492, CI 77499 (IRON OXIDES), CI 15850 (RED 7 LAKE), CI 45410 (RED 28 LAKE), CI 19140 (YELLOW 5 LAKE).",

    pairWith: {
      name: "Letty Velvet Sculpt Lip Liner",
      slug: "letty-velvet-lip-liner",
      shade: "01 Cafe Creme",
      priceGbp: 9,
      image: "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
    },

    media: [
      {
        id: "m-gloss-1",
        imageKey: "/products/lip-gloss/01-berry-glow/IMG_6590.PNG",
        alt: "Letty Glass Shine Lip Gloss — Berry Glow bottle and swatch",
        position: 0,
      },
      {
        id: "m-gloss-2",
        imageKey: "/products/lip-gloss/01-berry-glow/IMG_6591.PNG",
        alt: "Before and After Letty Glass Shine Lip Gloss — unretouched glass finish",
        position: 1,
      },
      {
        id: "m-gloss-3",
        imageKey: "/products/lip-gloss/01-berry-glow/IMG_6592.PNG",
        alt: "Berry Glow shade on diverse skin complexions",
        position: 2,
      },
      {
        id: "m-gloss-4",
        imageKey: "/products/lip-gloss/01-berry-glow/IMG_6594.PNG",
        alt: "Juicy doe foot applicator with hold-max formula and pointed precision tip",
        position: 3,
      },
      {
        id: "m-gloss-5",
        imageKey: "/products/lip-gloss/01-berry-glow/IMG_6593.PNG",
        alt: "Letty Glass Shine Lip Gloss full collection swatches",
        position: 4,
      },
      {
        id: "m-gloss-6",
        imageKey: "/products/lip-gloss/01-berry-glow/IMG_6595.PNG",
        alt: "Letty Beauty Lip Pairings shade guide",
        position: 5,
      },
      {
        id: "m-gloss-7",
        imageKey: "/products/lip-gloss/02-rich-mocha/IMG_6597.PNG",
        alt: "Letty Glass Shine Lip Gloss — Rich Mocha",
        position: 6,
      },
      {
        id: "m-gloss-8",
        imageKey: "/products/lip-gloss/04-velvet-nude/IMG_6606.PNG",
        alt: "Letty Glass Shine Lip Gloss — Velvet Nude",
        position: 7,
      },
    ],

    variants: [
      {
        id: "v-gloss-01",
        sku: "LET-LG-01",
        color: "01 Berry Glow",
        colorHex: "#9E385D",
        stockQuantity: 28,
        image: "/products/lip-gloss/01-berry-glow/IMG_6590.PNG",
      },
      {
        id: "v-gloss-02",
        sku: "LET-LG-02",
        color: "02 Rich Mocha",
        colorHex: "#5A382E",
        stockQuantity: 30,
        image: "/products/lip-gloss/02-rich-mocha/IMG_6597.PNG",
      },
      {
        id: "v-gloss-03",
        sku: "LET-LG-03",
        color: "03 Plum Wine",
        colorHex: "#5E253B",
        stockQuantity: 20,
        image: "/products/lip-gloss/03-plum-wine/IMG_6603.PNG",
      },
      {
        id: "v-gloss-04",
        sku: "LET-LG-04",
        color: "04 Velvet Nude",
        colorHex: "#B07D6D",
        stockQuantity: 35,
        image: "/products/lip-gloss/04-velvet-nude/IMG_6606.PNG",
      },
      {
        id: "v-gloss-05",
        sku: "LET-LG-05",
        color: "05 Classic Red",
        colorHex: "#B31B25",
        stockQuantity: 25,
        image: "/products/lip-gloss/05-classic-red/IMG_6611.PNG",
      },
      {
        id: "v-gloss-06",
        sku: "LET-LG-06",
        color: "06 Midas Touch",
        colorHex: "#D4A373",
        stockQuantity: 24,
        image: "/products/lip-gloss/06-midas-touch/IMG_6614.PNG",
      },
      {
        id: "v-gloss-07",
        sku: "LET-LG-07",
        color: "07 Soft Peach",
        colorHex: "#E89A88",
        stockQuantity: 19,
        image: "/products/lip-gloss/07-soft-peach/IMG_6617.PNG",
      },
      {
        id: "v-gloss-08",
        sku: "LET-LG-08",
        color: "08 Warm Coral",
        colorHex: "#E26D5C",
        stockQuantity: 22,
        image: "/products/lip-gloss/08-warm-coral/IMG_6621.PNG",
      },
    ],
  },
];
