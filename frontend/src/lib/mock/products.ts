import type { Product } from "@/types";
import { mwahProduct } from "../mwah";

/**
 * Product catalog for LETTY.
 * Featuring the official Letty Beauty Lip Liner & Lip Gloss collections and
 * the Lash Book kit, priced in British Pounds (£) and structured
 * with complete editorial PDP details.
 */
export const products: Product[] = [
  mwahProduct,
  {
    id: "dfbbfac9-8858-4f6e-958f-0548c0317226",
    slug: "letty-velvet-lip-liner",
    name: "Velvet Sculpt Lip Liner",
    tagline: "Smudge-Proof Contour & Ultra-Pigmented Definition",
    brandSlug: "letty",
    categorySlug: "makeup-beauty",
    subcategorySlug: "lip-liner",
    basePriceUsd: 9, // £9.00 GBP
    rating: 0,
    reviewCount: 0,
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
      name: "Glass Shine Lip Gloss",
      slug: "letty-glass-lip-gloss",
      shade: "Velvet Nude",
      priceGbp: 12,
      image: "/products/lip-gloss/04-velvet-nude/IMG_6606.PNG",
    },

    media: [
      {
        id: "m-liner-1",
        imageKey: "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
        alt: "Velvet Sculpt Lip Liner, 01 Cafe Creme with swatch",
        position: 0,
      },
      {
        id: "m-liner-2",
        imageKey: "/products/lip-liner/01-cafe-creme/IMG_6625_angle.jpg",
        alt: "Velvet Sculpt Lip Liner, 01 Cafe Creme angled flatlay packshot",
        position: 1,
      },
    ],

    variants: [
      {
        id: "62c2dea2-4b35-4527-b924-93f3bd27193e",
        sku: "LET-LL-01",
        color: "01 Cafe Creme",
        colorHex: "#C49E85",
        stockQuantity: 25,
        image: "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
        images: [
          "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
          "/products/lip-liner/01-cafe-creme/IMG_6625_angle.jpg",
        ],
      },
      {
        id: "9892d0a7-8c98-4a43-8951-68f790318c49",
        sku: "LET-LL-02",
        color: "02 Cocoa Bean",
        colorHex: "#5C3828",
        stockQuantity: 20,
        image: "/products/lip-liner/02-cocoa-bean/IMG_6626 (1).PNG",
        images: [
          "/products/lip-liner/02-cocoa-bean/IMG_6626 (1).PNG",
          "/products/lip-liner/02-cocoa-bean/IMG_6626_angle.jpg",
        ],
      },
      {
        id: "821f4bff-fa64-41bc-a8aa-8ccd7778f565",
        sku: "LET-LL-03",
        color: "03 Honeycomb",
        colorHex: "#B87B56",
        stockQuantity: 18,
        image: "/products/lip-liner/03-honeycomb/IMG_6627.PNG",
        images: [
          "/products/lip-liner/03-honeycomb/IMG_6627.PNG",
          "/products/lip-liner/03-honeycomb/IMG_6627_angle.jpg",
        ],
      },
      {
        id: "fca49ea1-18b8-4b81-b47c-291065247c00",
        sku: "LET-LL-04",
        color: "04 Crimson",
        colorHex: "#8E2026",
        stockQuantity: 30,
        image: "/products/lip-liner/04-crimson/IMG_6628.PNG",
        images: [
          "/products/lip-liner/04-crimson/IMG_6628.PNG",
          "/products/lip-liner/04-crimson/IMG_6628_angle.jpg",
        ],
      },
      {
        id: "c0d6da29-a6d2-474d-902a-bca25bf4761f",
        sku: "LET-LL-05",
        color: "05 Terra",
        colorHex: "#A7584A",
        stockQuantity: 22,
        image: "/products/lip-liner/05-terra/IMG_6629.PNG",
        images: [
          "/products/lip-liner/05-terra/IMG_6629.PNG",
        ],
      },
      {
        id: "fba47939-9315-403c-87e9-d9aab512f4e5",
        sku: "LET-LL-06",
        color: "06 Chestnut",
        colorHex: "#4A2E2B",
        stockQuantity: 15,
        image: "/products/lip-liner/06-chestnut/IMG_6631.PNG",
        images: [
          "/products/lip-liner/06-chestnut/IMG_6631.PNG",
        ],
      },
      {
        id: "59300809-09c5-4492-8bc6-efe73dd0a7b7",
        sku: "LET-LL-07",
        color: "07 Nightfall",
        colorHex: "#8B4D57",
        stockQuantity: 14,
        image: "/products/lip-liner/07-nightfall/IMG_6632.PNG",
        images: [
          "/products/lip-liner/07-nightfall/IMG_6632.PNG",
        ],
      },
    ],
  },

  {
    id: "736e71ce-e171-426b-b5d8-38760af8ee94",
    slug: "letty-glass-lip-gloss",
    name: "Glass Shine Lip Gloss",
    tagline: "High-Shine Hydration & Luscious Fuller Lips",
    brandSlug: "letty",
    categorySlug: "makeup-beauty",
    subcategorySlug: "lip-gloss",
    basePriceUsd: 12, // £12.00 GBP — matches the live catalog price used at checkout
    rating: 0,
    reviewCount: 0,
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
        text: "Layer over Velvet Sculpt Lip Liner for high-definition 3D volume and a luscious faux-filler effect.",
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
        "Line and softly shade outer lips with your matching Lip Liner.",
        "Generously sweep Glass Shine Lip Gloss from centre outward.",
        "Enjoy hours of non-sticky, reflective glass-like fullness.",
      ],
    },

    ingredients:
      "POLYBUTENE, OCTYLDODECANOL, HYDROGENATED POLYISOBUTENE, DIISOSTEARYL MALATE, TRIDECYL TRIMELLITATE, BIS-DIGLYCERYL POLYACYLADIPATE-2, SILICA DIMETHYL SILYLATE, BUTYROSPERMUM PARKII (SHEA) BUTTER, TOCOPHERYL ACETATE (VITAMIN E), PHENOXYETHANOL, ETHYLHEXYLGLYCERIN, AROMA (FLAVOR). MAY CONTAIN (+/-): CI 77891 (TITANIUM DIOXIDE), CI 77491, CI 77492, CI 77499 (IRON OXIDES), CI 15850 (RED 7 LAKE), CI 45410 (RED 28 LAKE), CI 19140 (YELLOW 5 LAKE).",

    pairWith: {
      name: "Velvet Sculpt Lip Liner",
      slug: "letty-velvet-lip-liner",
      shade: "01 Cafe Creme",
      priceGbp: 9,
      image: "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
    },

    media: [
      {
        id: "m-gloss-1",
        imageKey: "/products/lip-gloss/01-berry-glow/IMG_6590.PNG",
        alt: "Glass Shine Lip Gloss, Berry Glow bottle and swatch",
        position: 0,
      },
      {
        id: "m-gloss-2",
        imageKey: "/products/lip-gloss/01-berry-glow/IMG_6591.PNG",
        alt: "Before and After Glass Shine Lip Gloss, unretouched glass finish",
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
        alt: "Glass Shine Lip Gloss full collection swatches",
        position: 4,
      },
      {
        id: "m-gloss-6",
        imageKey: "/products/lip-gloss/01-berry-glow/IMG_6595.PNG",
        alt: "Lip Pairings shade guide",
        position: 5,
      },
    ],

    variants: [
      {
        id: "6550186c-1890-474b-b61b-b0e4f46a01c5",
        sku: "LET-LG-01",
        color: "01 Berry Glow",
        colorHex: "#9E385D",
        stockQuantity: 28,
        image: "/products/lip-gloss/01-berry-glow/IMG_6590.PNG",
        images: [
          "/products/lip-gloss/01-berry-glow/IMG_6590.PNG",
          "/products/lip-gloss/01-berry-glow/IMG_6591.PNG",
          "/products/lip-gloss/01-berry-glow/IMG_6592.PNG",
          "/products/lip-gloss/01-berry-glow/IMG_6594.PNG",
          "/products/lip-gloss/01-berry-glow/IMG_6593.PNG",
          "/products/lip-gloss/01-berry-glow/IMG_6595.PNG",
        ],
      },
      {
        id: "3537f802-76ca-437a-9266-38674a841360",
        sku: "LET-LG-02",
        color: "02 Rich Mocha",
        colorHex: "#5A382E",
        stockQuantity: 30,
        image: "/products/lip-gloss/02-rich-mocha/IMG_6597.PNG",
        images: [
          "/products/lip-gloss/02-rich-mocha/IMG_6597.PNG",
          "/products/lip-gloss/02-rich-mocha/IMG_6598.PNG",
          "/products/lip-gloss/02-rich-mocha/IMG_6599.PNG",
          "/products/lip-gloss/02-rich-mocha/IMG_6601.PNG",
          "/products/lip-gloss/02-rich-mocha/IMG_6600.PNG",
          "/products/lip-gloss/02-rich-mocha/IMG_6602.PNG",
        ],
      },
      {
        id: "28ee75c1-0e7e-46e8-b275-22ce50872b8e",
        sku: "LET-LG-03",
        color: "03 Plum Wine",
        colorHex: "#5E253B",
        stockQuantity: 20,
        image: "/products/lip-gloss/03-plum-wine/IMG_6603.PNG",
        images: [
          "/products/lip-gloss/03-plum-wine/IMG_6603.PNG",
          "/products/lip-gloss/03-plum-wine/IMG_6604.PNG",
          "/products/lip-gloss/03-plum-wine/IMG_6605.PNG",
          "/products/lip-gloss/03-plum-wine/IMG_6601.PNG",
          "/products/lip-gloss/03-plum-wine/IMG_6600.PNG",
          "/products/lip-gloss/03-plum-wine/IMG_6602.PNG",
        ],
      },
      {
        id: "cc82f7e5-f895-4d4b-8085-f987b79c74a8",
        sku: "LET-LG-04",
        color: "04 Velvet Nude",
        colorHex: "#B07D6D",
        stockQuantity: 35,
        image: "/products/lip-gloss/04-velvet-nude/IMG_6606.PNG",
        images: [
          "/products/lip-gloss/04-velvet-nude/IMG_6606.PNG",
          "/products/lip-gloss/04-velvet-nude/IMG_6607.PNG",
          "/products/lip-gloss/04-velvet-nude/IMG_6608.PNG",
          "/products/lip-gloss/04-velvet-nude/IMG_6601 (1).PNG",
          "/products/lip-gloss/04-velvet-nude/IMG_6600 (1).PNG",
          "/products/lip-gloss/04-velvet-nude/IMG_6602 (1).PNG",
        ],
      },
      {
        id: "5dda598b-d731-4437-b1a7-c765f4526454",
        sku: "LET-LG-05",
        color: "05 Classic Red",
        colorHex: "#B31B25",
        stockQuantity: 25,
        image: "/products/lip-gloss/05-classic-red/IMG_6611.PNG",
        images: [
          "/products/lip-gloss/05-classic-red/IMG_6611.PNG",
          "/products/lip-gloss/05-classic-red/IMG_6612.PNG",
          "/products/lip-gloss/05-classic-red/IMG_6613.PNG",
          "/products/lip-gloss/05-classic-red/IMG_6601.PNG",
          "/products/lip-gloss/05-classic-red/IMG_6600.PNG",
          "/products/lip-gloss/05-classic-red/IMG_6602.PNG",
        ],
      },
      {
        id: "4583ca46-d414-4cf5-9bf9-b0e768d9b442",
        sku: "LET-LG-06",
        color: "06 Midas Touch",
        colorHex: "#D4A373",
        stockQuantity: 24,
        image: "/products/lip-gloss/06-midas-touch/IMG_6614.PNG",
        images: [
          "/products/lip-gloss/06-midas-touch/IMG_6614.PNG",
          "/products/lip-gloss/06-midas-touch/IMG_6615.PNG",
          "/products/lip-gloss/06-midas-touch/IMG_6616.PNG",
          "/products/lip-gloss/06-midas-touch/IMG_6601 (1).PNG",
          "/products/lip-gloss/06-midas-touch/IMG_6600 (1).PNG",
          "/products/lip-gloss/06-midas-touch/IMG_6602 (1).PNG",
        ],
      },
      {
        id: "69d7c0a8-7dcd-4094-996c-3a333c96d214",
        sku: "LET-LG-07",
        color: "07 Soft Peach",
        colorHex: "#E89A88",
        stockQuantity: 19,
        image: "/products/lip-gloss/07-soft-peach/IMG_6617.PNG",
        images: [
          "/products/lip-gloss/07-soft-peach/IMG_6617.PNG",
          "/products/lip-gloss/07-soft-peach/IMG_6618.PNG",
          "/products/lip-gloss/07-soft-peach/IMG_6619.PNG",
          "/products/lip-gloss/07-soft-peach/IMG_6601.PNG",
          "/products/lip-gloss/07-soft-peach/IMG_6600.PNG",
          "/products/lip-gloss/07-soft-peach/IMG_6602.PNG",
        ],
      },
      {
        id: "5975aac5-f96f-4016-b75a-6c57f5c1cb0f",
        sku: "LET-LG-08",
        color: "08 Warm Coral",
        colorHex: "#E26D5C",
        stockQuantity: 22,
        image: "/products/lip-gloss/08-warm-coral/IMG_6621.PNG",
        images: [
          "/products/lip-gloss/08-warm-coral/IMG_6621.PNG",
          "/products/lip-gloss/08-warm-coral/IMG_6622.PNG",
          "/products/lip-gloss/08-warm-coral/IMG_6623.PNG",
          "/products/lip-gloss/08-warm-coral/IMG_6601.PNG",
          "/products/lip-gloss/08-warm-coral/IMG_6600.PNG",
          "/products/lip-gloss/08-warm-coral/IMG_6602.PNG",
        ],
      },
    ],
  },

  {
    id: "e5a1c8f3-2b47-4d69-8a30-9f1e7c4d2b58",
    slug: "letty-lash-book-kit",
    name: "Lash Book Kit",
    tagline: "544 Cluster Lashes · Four Volumes · One Book",
    brandSlug: "letty",
    categorySlug: "makeup-beauty",
    subcategorySlug: "lashes",
    basePriceUsd: 12, // £12 GBP
    rating: 0,
    reviewCount: 0,
    isNew: true,
    isVegan: false,
    isPreorder: false,
    collectionSlugs: ["the-edit"],
    relatedSlugs: ["letty-velvet-lip-liner", "letty-glass-lip-gloss"],

    description:
      "The complete DIY lash extension ritual, bound in one travel-ready book. Inside: 544 reusable cluster lashes across four volumes, 60D, 100D, 120D and 150D, in mixed 10–16mm lengths, with a strong-hold lash glue and a mild remover alongside. Weightless clusters with a stable, long-lasting curl: everything you need to apply and remove at home, saving you time and money.",

    details: [
      "544 reusable cluster lashes in four volumes: 60D, 100D, 120D, 150D",
      "Mixed 10–16mm lengths for a custom, seamless gradient",
      "Strong-hold lash glue and mild remover included",
      "Weightless clusters with a stable, long-lasting curl",
      "Everything for application and removal in one book",
    ],

    whatItIs:
      "A DIY cluster lash kit, 544 reusable lashes in four volumes with glue and remover, all bound in one slim book.",

    whatItDoes:
      "Each weightless cluster holds a stable, uniform curl, so the look you build in the mirror is the look you keep.\n\nFour volumes let you dial the drama, from soft, natural definition to full, lashed-up volume, and because every cluster is reusable, one book carries you through wear after wear. Glue and remover are included, so there is nothing else to buy.",

    whatElseToKnow: [
      "Weightless wear that feels like nothing on the eye",
      "Stable curl that holds its lift all day",
      "Reusable clusters, clean gently and re-wear",
      "Long-lasting hold from the included strong glue",
      "Mild remover dissolves glue without tugging",
      "Slim book format, made for touch-ups on the go",
    ],

    howToUseSteps: [
      {
        title: "Glue",
        text: "Apply lash glue to the cluster band using the brush, then wait 30 seconds for the tack to set.",
      },
      {
        title: "Attach",
        text: "Place the lash clusters along the lash line and press gently to secure.",
      },
      {
        title: "Remove",
        text: "Saturate the clusters with the mild eyelash glue remover to dissolve the glue, then gently peel the lashes away.",
      },
    ],

    proTip:
      "For the most natural result, start with the shorter 10mm clusters in the inner corner and graduate to 16mm toward the outer corner, the mixed lengths are there to build a seamless gradient.",

    media: [
      {
        id: "m-lash-1",
        imageKey: "/products/lash-book/lash-book-02.jpg",
        alt: "The Lash Book, travel-ready lash palette holding 544 cluster lashes, glue and remover",
        position: 0,
      },
      {
        id: "m-lash-2",
        imageKey: "/products/lash-book/lash-book-01.jpg",
        alt: "Lash Book Kit, DIY cluster lashes in 60D, 100D, 120D and 150D, mixed 10–16mm lengths",
        position: 1,
      },
      {
        id: "m-lash-3",
        imageKey: "/products/lash-book/lash-book-03.jpg",
        alt: "Lash Book Kit, kit detail",
        position: 2,
      },
    ],

    variants: [
      {
        id: "c7f2d9a6-4e18-4b53-9c82-1d6a8f3e5b07",
        sku: "LET-LB-01",
        stockQuantity: 40,
        image: "/products/lash-book/lash-book-02.jpg",
        images: [
          "/products/lash-book/lash-book-02.jpg",
          "/products/lash-book/lash-book-01.jpg",
          "/products/lash-book/lash-book-03.jpg",
        ],
      },
    ],
  },
];
