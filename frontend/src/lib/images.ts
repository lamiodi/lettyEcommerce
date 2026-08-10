/**
 * Centralized image registry.
 *
 * Every image used on the site is declared here under a semantic key.
 * During development these point to curated Unsplash/Pexels editorial
 * photography. To swap in final AI-generated brand assets later, replace
 * the `src` values in this single file — layouts never change.
 */

export interface ImageAsset {
  src: string;
  alt: string;
}

const u = (id: string, width = 1600): string =>
  `https://images.unsplash.com/${id}?q=80&w=${width}&auto=format&fit=crop`;

const asset = (id: string, alt: string, width?: number): ImageAsset => ({
  src: u(id, width),
  alt,
});

/** Generated brand campaign imagery (department worlds). */
type GenSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9";

const gen = (prompt: string, alt: string, size: GenSize): ImageAsset => ({
  src: `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`,
  alt,
});

export const IMAGES = {
  // ---------- Department worlds (campaign imagery) ----------
  deptMakeupHero: gen(
    "luxury makeup campaign photograph, beautiful model with flawless glowing skin and elegant neutral makeup, gold and ivory tones, high fashion beauty editorial, soft studio lighting, photorealistic, 8k",
    "Makeup & Beauty campaign — model with flawless glowing skin in golden light",
    "landscape_16_9",
  ),
  deptFashionHero: gen(
    "high fashion editorial photograph, elegant model in flowing ivory silk dress, luxury boutique campaign, neutral beige tones, cinematic soft light, full body pose, photorealistic, 8k",
    "Fashion campaign — model in flowing ivory silk, editorial pose",
    "landscape_16_9",
  ),
  deptFragranceHero: gen(
    "atmospheric luxury perfume campaign, elegant glass flacon among silk fabric and warm amber light haze, sensual moody editorial photography, gold and deep amber tones, photorealistic, 8k",
    "Fragrance campaign — perfume flacon in warm amber haze",
    "landscape_16_9",
  ),
  deptEyewearHero: gen(
    "fashion editorial photograph of a model wearing oversized luxury sunglasses, striking pose, warm golden hour light, high fashion campaign, neutral tones, photorealistic, 8k",
    "Eyewear campaign — model in oversized sunglasses, golden hour",
    "landscape_16_9",
  ),
  deptMakeupEditorial: gen(
    "luxury beauty flat lay editorial, couture lipsticks gold cases and makeup brushes on ivory silk, soft shadows, warm neutral palette, high end cosmetics photography, photorealistic",
    "Makeup editorial — couture lipsticks and brushes on ivory silk",
    "landscape_16_9",
  ),
  deptFashionEditorial: gen(
    "editorial fashion photograph, model in tailored neutral tailoring walking in soft evening light, luxury atelier campaign, beige and ivory palette, cinematic, photorealistic",
    "Fashion editorial — tailored neutrals in evening light",
    "landscape_16_9",
  ),
  deptFragranceEditorial: gen(
    "moody perfume still life, amber glass bottles on warm stone with dramatic shadows and orchid petals, sensual luxury fragrance editorial, photorealistic",
    "Fragrance editorial — amber bottles and orchid petals on stone",
    "landscape_16_9",
  ),
  deptEyewearEditorial: gen(
    "luxury sunglasses still life editorial, designer frames arranged on travertine stone with hard sunlight and long shadows, minimal warm palette, photorealistic",
    "Eyewear editorial — designer frames on travertine in hard light",
    "landscape_16_9",
  ),

  // ---------- Department tiles ----------
  tileMakeup: gen(
    "luxury lipstick and gold makeup compact on silk fabric, editorial beauty photography, warm neutral tones, soft light, photorealistic",
    "Makeup tile — lipstick and gold compact on silk",
    "portrait_4_3",
  ),
  tileBody: gen(
    "luxury body care cream jar and body oil bottle in spa setting with warm towel, editorial photography, neutral spa tones, photorealistic",
    "Body care tile — cream jar and oil in a warm spa scene",
    "portrait_4_3",
  ),
  tileSkincare: gen(
    "luxury skincare serum and moisturizer bottles in soft morning light, minimal editorial beauty photography, ivory and blush tones, photorealistic",
    "Skincare tile — serum and moisturizer in morning light",
    "portrait_4_3",
  ),
  tileDresses: gen(
    "elegant model wearing ivory silk slip dress, editorial fashion photography, neutral backdrop, soft light, photorealistic",
    "Dresses tile — ivory silk slip dress on model",
    "portrait_4_3",
  ),
  tileSets: gen(
    "model wearing matching cashmere knit coord set in oatmeal tone, editorial fashion photography, warm minimal backdrop, photorealistic",
    "Sets tile — matching cashmere coord set",
    "portrait_4_3",
  ),
  tileTops: gen(
    "model wearing relaxed silk shirt tucked into tailored waistband, editorial fashion photography, neutral tones, soft light, photorealistic",
    "Tops tile — relaxed silk shirt, editorial styling",
    "portrait_4_3",
  ),
  tileBottoms: gen(
    "model wearing high rise wide leg trousers in ivory wool, editorial fashion photography, studio light, neutral palette, photorealistic",
    "Bottoms tile — wide-leg ivory trousers",
    "portrait_4_3",
  ),
  tileForHer: gen(
    "feminine luxury perfume bottle with rose petals and warm golden light, editorial fragrance photography, romantic soft tones, photorealistic",
    "For Her tile — perfume with rose petals in golden light",
    "portrait_4_3",
  ),
  tileForHim: gen(
    "masculine dark perfume flacon on slate with smoke and dramatic moody light, editorial fragrance photography, photorealistic",
    "For Him tile — dark flacon on slate with smoke",
    "portrait_4_3",
  ),
  tileUnisex: gen(
    "minimal unisex fragrance bottle on neutral stone with clean daylight, editorial photography, ivory and sand tones, photorealistic",
    "Unisex tile — minimal fragrance bottle on stone",
    "portrait_4_3",
  ),

  // ---------- Shop the Look ----------
  lookAtelier: gen(
    "full length editorial fashion photograph, model wearing ivory silk slip dress with oatmeal cashmere cardigan draped over shoulders and small tan leather tote, warm studio light, luxury campaign, photorealistic",
    "The Atelier look — silk slip dress, cashmere wrap and mini tote",
    "portrait_4_3",
  ),

  // ---------- Products: Body ----------
  productBodyCreme: gen(
    "luxury body cream in frosted glass jar with gold lid, product photography on ivory background, soft shadow, warm neutral tones, photorealistic",
    "Velvet Body Crème in frosted glass jar",
    "square",
  ),
  productBodyOil: gen(
    "golden body oil in slim glass bottle with dropper, luxury product photography on warm stone, soft light, photorealistic",
    "Golden Hour Body Oil in slim glass bottle",
    "square",
  ),

  // ---------- Products: Eyewear ----------
  productShadesNoir: gen(
    "oversized black acetate luxury sunglasses, product photography on ivory background, soft shadow, high fashion eyewear, photorealistic",
    "Noir Oversized sunglasses in black acetate",
    "square",
  ),
  productShadesAviator: gen(
    "gold frame aviator sunglasses with gradient amber lenses, luxury product photography on ivory background, soft shadow, photorealistic",
    "Riviera gold aviator sunglasses",
    "square",
  ),
  productShadesCatEye: gen(
    "tortoiseshell cat-eye luxury sunglasses, product photography on ivory background, soft shadow, high fashion eyewear, photorealistic",
    "Tortoise cat-eye sunglasses",
    "square",
  ),
  productShadesIvory: gen(
    "ivory white square frame designer sunglasses, luxury product photography on neutral background, soft shadow, photorealistic",
    "Ivory square-frame sunglasses",
    "square",
  ),
  productShadesRound: gen(
    "round thin gold wire sunglasses with dark green lenses, luxury product photography on ivory background, soft shadow, photorealistic",
    "Midnight round wire-frame sunglasses",
    "square",
  ),

  // ---------- Products: Fashion additions ----------
  productKnitSet: gen(
    "matching oatmeal cashmere knit sweater and trousers coord set on model, luxury product photography, neutral studio backdrop, photorealistic",
    "Cashmere knit coord set in oatmeal",
    "square",
  ),
  productWideTrousers: gen(
    "high rise wide leg ivory wool trousers on model, luxury fashion product photography, neutral studio backdrop, photorealistic",
    "High-rise wide-leg trousers in ivory wool",
    "square",
  ),

  // ---------- Homepage ----------
  heroEditorial: asset(
    "photo-1506863530036-1efeddceb993",
    "Editorial beauty portrait with warm golden light and flawless skin",
    2400,
  ),
  campaignBanner: asset(
    "photo-1487412947147-5cebf100ffc2",
    "Cinematic editorial campaign portrait of a woman in soft studio light",
    2400,
  ),
  brandStory: asset(
    "photo-1526045478516-99145907023c",
    "LETTY atelier — artisan blending botanical ingredients",
  ),
  brandStorySecondary: asset(
    "photo-1570172619644-dfd03ed5d881",
    "Spa ritual with natural skincare textures",
  ),
  newsletterBackground: asset(
    "photo-1515377905703-c4788e51af15",
    "Soft neutral still life with linen and ceramics",
    2000,
  ),

  // ---------- Collections ----------
  collectionHair: asset(
    "photo-1522338242992-e1a54906a8da",
    "Silky brunette hair catching the light",
  ),
  collectionFragrance: asset(
    "photo-1541643600914-78b084683601",
    "Minimal glass perfume bottle on warm stone",
  ),
  collectionSkincare: asset(
    "photo-1571781926291-c477ebfd024b",
    "Pink skincare bottles arranged in a clean studio scene",
  ),
  collectionMakeup: asset(
    "photo-1512496015851-a90fb38ba796",
    "Luxury makeup brushes in soft light",
  ),
  collectionFashion: asset(
    "photo-1445205170230-053b83016050",
    "Elegant woman in a tailored coat, editorial fashion pose",
  ),
  collectionBody: asset(
    "photo-1519415943484-9fa1873496d4",
    "Serene spa interior with warm neutral tones",
  ),

  // ---------- Editorial services grid (template-inspired) ----------
  editorialHairRitual: asset(
    "photo-1562322140-8baeececf3df",
    "Stylist finishing glossy waves in a luxury salon",
  ),
  editorialFragranceWardrobe: asset(
    "photo-1631729371254-42c2892f0e6e",
    "Amber perfume bottle with dramatic shadows",
  ),
  editorialSkinCeremony: asset(
    "photo-1616683693504-3ea7e9ad6fec",
    "Woman applying skincare with serene expression",
  ),
  editorialMakeupAtelier: asset(
    "photo-1605497788044-5a32c7078486",
    "Makeup artist applying editorial makeup look",
  ),

  // ---------- Products: Hair ----------
  productShampoo: asset(
    "photo-1556228720-195a672e8a03",
    "Amber pump bottle of silk repair shampoo",
  ),
  productHairOil: asset(
    "photo-1526947425960-945c6e72858f",
    "Golden argan hair oil in a glass dropper bottle",
  ),
  productStylingCreme: asset(
    "photo-1595476108010-b4d1f102b1b1",
    "Styling crème jar with soft whipped texture",
  ),
  productHairMask: asset(
    "photo-1580618672591-eb180b1a973f",
    "Rich midnight repair hair mask in a dark jar",
  ),
  productHairMist: asset(
    "photo-1594035910387-fea47794261f",
    "Rose hair mist in a blush glass bottle",
  ),

  // ---------- Products: Fragrance ----------
  productParfumGold: asset(
    "photo-1592945403244-b3fbafd7f539",
    "Golden hour eau de parfum in a faceted glass bottle",
  ),
  productParfumNoir: asset(
    "photo-1552046122-03184de85e08",
    "Black noir absolu parfum bottle in moody light",
  ),
  productParfumBlanc: asset(
    "photo-1583209814683-c023dd293cc6",
    "White blanc de peau fragrance bottle, minimal styling",
  ),
  productTravelSet: asset(
    "photo-1615397349754-cfa2066a298e",
    "Fragrance travel set of miniature bottles in a gift box",
  ),

  // ---------- Products: Skincare ----------
  productSerum: asset(
    "photo-1598440947619-2c35fc9aa908",
    "Vitamin C serum in a glass dropper bottle",
  ),
  productMoisturizer: asset(
    "photo-1620916566398-39f1143ab7be",
    "Velvet cloud moisturizer in a frosted glass jar",
  ),
  productCleanser: asset(
    "photo-1556228578-8c89e6adf883",
    "Rose quartz gentle cleanser with pump",
  ),
  productNightCream: asset(
    "photo-1608248543803-ba4f8c70ae0b",
    "Overnight renewal cream in a ceramic jar",
  ),
  productEyeCream: asset(
    "photo-1615634260167-c8cdede054de",
    "Eye awakening concentrate in a slim tube",
  ),

  // ---------- Products: Makeup ----------
  productLipstick: asset(
    "photo-1586495777744-4413f21062fa",
    "Satin matte lipstick in deep rouge, gold case",
  ),
  productLipstickAlt: asset(
    "photo-1596704017254-9b121068fb31",
    "Lipstick swatches in warm red tones",
  ),
  productBrowPencil: asset(
    "photo-1522335789203-aabd1fc54bc9",
    "Precision brow pencil beside sculpted brows",
  ),
  productFoundation: asset(
    "photo-1512496015851-a90fb38ba796",
    "Silk finish foundation bottle with pump",
  ),
  productMascara: asset(
    "photo-1596462502278-27bfdc403348",
    "Lash sculpt mascara with wand resting on palette",
  ),
  productHighlighter: asset(
    "photo-1617897903246-719242758050",
    "Glow drops highlighter in a glass bottle",
  ),

  // ---------- Products: Fashion ----------
  productSilkDress: asset(
    "photo-1595777457583-95e059d581b8",
    "Ivory silk slip dress on a model, editorial pose",
  ),
  productCardigan: asset(
    "photo-1434389677669-e08b4cac3105",
    "Cashmere wrap cardigan in soft oatmeal tone",
  ),
  productBlazer: asset(
    "photo-1509631179647-0177331693ae",
    "Tailored wool blazer worn with minimal styling",
  ),
  productSkirt: asset(
    "photo-1583496661160-fb5886a13d44",
    "Pleated satin midi skirt catching the light",
  ),
  productTote: asset(
    "photo-1584917865442-de89df76afd3",
    "Structured leather mini tote in tan",
  ),

  // ---------- Instagram feed ----------
  instagram1: asset(
    "photo-1516975080664-ed2fc6a32937",
    "Beauty portrait with dewy skin and natural makeup",
  ),
  instagram2: asset(
    "photo-1522337660859-02fbefca4702",
    "Salon stylist working on glossy blowout",
  ),
  instagram3: asset(
    "photo-1594744803329-e58b31de8bf5",
    "Close-up beauty portrait with warm tones",
  ),
  instagram4: asset(
    "photo-1519823551278-64ac92734fb1",
    "Editorial fashion look in neutral palette",
  ),
  instagram5: asset(
    "photo-1531746020798-e6953c6e8e04",
    "Studio portrait with soft directional light",
  ),

  // ---------- Content pages ----------
  aboutHero: asset(
    "photo-1469334031218-e382a71b716b",
    "Editorial fashion portrait in golden evening light",
    2200,
  ),
  storyHero: asset(
    "photo-1529139574466-a303027c1d8b",
    "Timeless editorial portrait, neutral tones",
    2200,
  ),
  storyAtelier: asset(
    "photo-1556760544-74068565f05c",
    "Hands blending botanical oils in the LETTY atelier",
  ),
  contactHero: asset(
    "photo-1490481651871-ab68de25d43d",
    "Luxury boutique interior with warm light",
    2200,
  ),

  // ---------- Testimonial avatars ----------
  avatar1: asset("photo-1531123897727-8f129e1688ce", "Portrait of Amara O.", 200),
  avatar2: asset("photo-1544005313-94ddf0286df2", "Portrait of Elena R.", 200),
  avatar3: asset("photo-1508214751196-bcfd4ca60f91", "Portrait of Sofia M.", 200),
  avatar4: asset("photo-1494790108377-be9c29b29330", "Portrait of Grace T.", 200),
} as const satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof IMAGES;

/** Resolve a semantic image key to its asset. */
export function getImage(key: ImageKey): ImageAsset {
  return IMAGES[key];
}
