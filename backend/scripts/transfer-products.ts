import "dotenv/config";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

const CLOUDINARY_CLOUD_NAME = "jtsxpm1l";

/**
 * Generate a Cloudinary CDN URL with auto format (WebP/AVIF) and auto quality compression.
 */
function toCloudinaryUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/v1/letty${cleanPath}`;
}

async function transfer() {
  console.log("Connecting to PostgreSQL to transfer product data...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to PostgreSQL successfully.");

  try {
    await client.query("BEGIN");

    // 1. Ensure Brand exists
    const brandRes = await client.query(
      `
      INSERT INTO brands (slug, name, description, logo_url, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING id;
      `,
      [
        "letty",
        "LETTY",
        "LETTY Beauty — Luxury cosmetic definition, high-pigment sculpting and glass-like finishes.",
        "/brand/logo.svg",
      ]
    );
    const brandId = brandRes.rows[0].id;
    console.log("✓ Brand registered:", brandId);

    // 2. Ensure Categories exist (parent: makeup, children: lip-liner, lip-gloss)
    const makeupRes = await client.query(
      `
      INSERT INTO categories (slug, name, description, is_active, position)
      VALUES ($1, $2, $3, true, 1)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
      `,
      ["makeup", "Makeup & Beauty", "Editorial luxury cosmetics and precision beauty."]
    );
    const makeupId = makeupRes.rows[0].id;

    const lipLinerCatRes = await client.query(
      `
      INSERT INTO categories (slug, name, description, is_active, position, parent_id)
      VALUES ($1, $2, $3, true, 1, $4)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id
      RETURNING id;
      `,
      ["lip-liner", "Lip Liner", "Ultra-pigmented velvet lip liners.", makeupId]
    );
    const lipLinerCatId = lipLinerCatRes.rows[0].id;

    const lipGlossCatRes = await client.query(
      `
      INSERT INTO categories (slug, name, description, is_active, position, parent_id)
      VALUES ($1, $2, $3, true, 2, $4)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id
      RETURNING id;
      `,
      ["lip-gloss", "Lip Gloss", "Glass shine non-sticky hydrating lip glosses.", makeupId]
    );
    const lipGlossCatId = lipGlossCatRes.rows[0].id;
    console.log("✓ Categories registered: Makeup, Lip Liner, Lip Gloss");

    // 3. Ensure Collections exist
    const collEditRes = await client.query(
      `
      INSERT INTO collections (slug, name, description, is_active, position)
      VALUES ($1, $2, $3, true, 1)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
      `,
      ["the-edit", "The Edit", "Curated signature essentials for modern luxury."]
    );
    const collEditId = collEditRes.rows[0].id;

    const collGoldenRes = await client.query(
      `
      INSERT INTO collections (slug, name, description, is_active, position)
      VALUES ($1, $2, $3, true, 2)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
      `,
      ["golden-hour", "Golden Hour", "Sun-drenched, radiant tones and luminous finishes."]
    );
    const collGoldenId = collGoldenRes.rows[0].id;
    console.log("✓ Collections registered: The Edit, Golden Hour");

    // -------------------------------------------------------------
    // 4. PRODUCT 1: LETTY VELVET SCULPT LIP LINER
    // -------------------------------------------------------------
    console.log("Transferring Product 1: Letty Velvet Sculpt Lip Liner...");
    const linerDetails = [
      "Ultra-pigmented colour payoff in a single swipe",
      "Smudge-proof and transfer-proof all-day wear",
      "Smooth, creamy glide without dragging or tugging",
      "Retractable precision tip for effortless overlining",
      "Enriched with Shea Butter and Vitamin E",
      "Net Wt. 0.3g / 0.01 oz.",
      "Cruelty-free and formulated without parabens",
    ];

    const linerWhatElseToKnow = [
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
    ];

    const linerHowToUseSteps = [
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
    ];

    const linerBeautyHack = {
      title: "Get the Perfect Long-Lasting Lip",
      steps: [
        "Start with clean, dry lips.",
        "Outline your natural lip shape with the liner.",
        "Slightly overline the centre of the lips if desired.",
        "Fill in the lips for added intensity and longevity.",
        "Layer your favourite lip colour or gloss on top.",
      ],
    };

    const linerPairWith = {
      name: "Letty Glass Shine Lip Gloss",
      slug: "letty-glass-lip-gloss",
      shade: "Velvet Nude",
      priceGbp: 12,
      image: toCloudinaryUrl("/products/lip-gloss/04-velvet-nude/IMG_6606.PNG"),
    };

    const linerRes = await client.query(
      `
      INSERT INTO products (
        slug, name, brand_id, category_id, description, short_description,
        base_price_usd, base_price_ngn, compare_at_price_usd,
        is_active, is_featured, is_new, is_bestseller,
        tagline, details, what_it_is, what_it_does, what_else_to_know,
        how_to_use_steps, pro_tip, beauty_hack, ingredients, pair_with,
        rating, review_count, is_vegan,
        meta_title, meta_description, og_image
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9,
        true, true, true, true,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22,
        $23, $24, $25
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        tagline = EXCLUDED.tagline,
        details = EXCLUDED.details,
        what_it_is = EXCLUDED.what_it_is,
        what_it_does = EXCLUDED.what_it_does,
        what_else_to_know = EXCLUDED.what_else_to_know,
        how_to_use_steps = EXCLUDED.how_to_use_steps,
        pro_tip = EXCLUDED.pro_tip,
        beauty_hack = EXCLUDED.beauty_hack,
        ingredients = EXCLUDED.ingredients,
        pair_with = EXCLUDED.pair_with,
        rating = EXCLUDED.rating,
        review_count = EXCLUDED.review_count,
        is_vegan = EXCLUDED.is_vegan,
        base_price_usd = EXCLUDED.base_price_usd,
        base_price_ngn = EXCLUDED.base_price_ngn
      RETURNING id;
      `,
      [
        "letty-velvet-lip-liner",
        "Letty Velvet Sculpt Lip Liner",
        brandId,
        lipLinerCatId,
        "An easy-to-use, long-lasting lip liner designed to effortlessly define, shape and enhance your lips with a smudge-proof & transfer-proof finish. The creamy, easy-glide formula delivers rich colour without dragging or tugging, while the long-lasting, smudge- and transfer-proof finish helps keep your lip look perfectly in place.",
        "Smudge-proof contour & ultra-pigmented definition",
        9.0,
        14400.0,
        12.0,
        "Smudge-Proof Contour & Ultra-Pigmented Definition",
        JSON.stringify(linerDetails),
        "An easy-to-use, long-lasting lip liner designed to effortlessly define, shape and enhance your lips with a smudge-proof & transfer-proof finish.",
        "This highly pigmented lip liner glides on smoothly to precisely contour and define lips, creating a flawless lip shape that stays put for all-day wear.\n\nThe creamy, easy-glide formula delivers rich colour without dragging or tugging, while the long-lasting, smudge- and transfer-proof finish helps keep your lip look perfectly in place.",
        JSON.stringify(linerWhatElseToKnow),
        JSON.stringify(linerHowToUseSteps),
        "For a perfectly defined, long-lasting lip, line the perimeter first, then softly blend the liner inward before applying your lip colour on top.",
        JSON.stringify(linerBeautyHack),
        "PARAFFINUM LIQUIDUM, POLYBUTENE, PENTAERYTHRITYL TETRAISOSTEARATE, DIISOSTEARYL MALATE, HYDROGENATED STYRENE/ISOPRENE COPOLYMER, SILICA DIMETHYL SILYLATE, BUTYROSPERMUM PARKII (SHEA BUTTER), TOCOPHEROL, CI 45410, CI 19140, CI 77491, CI 77891, CI 77492, CI 77499, PHENOXYETHANOL.",
        JSON.stringify(linerPairWith),
        4.9,
        48,
        true,
        "Letty Velvet Sculpt Lip Liner | Smudge-Proof Definition",
        "Shop Letty Velvet Sculpt Lip Liner. Ultra-pigmented definition, velvety glide, and 12-hour transfer-proof wear.",
        toCloudinaryUrl("/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG"),
      ]
    );
    const linerId = linerRes.rows[0].id;

    // Attach to collections
    await client.query(
      `
      INSERT INTO collection_products (collection_id, product_id, position)
      VALUES ($1, $2, 1), ($3, $2, 1)
      ON CONFLICT (collection_id, product_id) DO NOTHING;
      `,
      [collEditId, linerId, collGoldenId]
    );

    // Lip liner variants (7 shades)
    const linerVariants = [
      {
        sku: "LET-LL-01",
        color: "01 Cafe Creme",
        colorHex: "#C49E85",
        stock: 25,
        image: "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
        images: [
          "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
          "/IMG_6386.PNG",
          "/IMG_6270.PNG",
          "/IMG_6549.PNG",
        ],
      },
      {
        sku: "LET-LL-02",
        color: "02 Cocoa Bean",
        colorHex: "#5C3828",
        stock: 20,
        image: "/products/lip-liner/02-cocoa-bean/IMG_6626 (1).PNG",
        images: [
          "/products/lip-liner/02-cocoa-bean/IMG_6626 (1).PNG",
          "/IMG_6386.PNG",
          "/IMG_6270.PNG",
          "/IMG_6549.PNG",
        ],
      },
      {
        sku: "LET-LL-03",
        color: "03 Honeycomb",
        colorHex: "#B87B56",
        stock: 18,
        image: "/products/lip-liner/03-honeycomb/IMG_6627.PNG",
        images: [
          "/products/lip-liner/03-honeycomb/IMG_6627.PNG",
          "/IMG_6386.PNG",
          "/IMG_6270.PNG",
          "/IMG_6549.PNG",
        ],
      },
      {
        sku: "LET-LL-04",
        color: "04 Crimson",
        colorHex: "#8E2026",
        stock: 30,
        image: "/products/lip-liner/04-crimson/IMG_6628.PNG",
        images: [
          "/products/lip-liner/04-crimson/IMG_6628.PNG",
          "/IMG_6386.PNG",
          "/IMG_6270.PNG",
          "/IMG_6549.PNG",
        ],
      },
      {
        sku: "LET-LL-05",
        color: "05 Terra",
        colorHex: "#A7584A",
        stock: 22,
        image: "/products/lip-liner/05-terra/IMG_6629.PNG",
        images: [
          "/products/lip-liner/05-terra/IMG_6629.PNG",
          "/IMG_6386.PNG",
          "/IMG_6270.PNG",
          "/IMG_6549.PNG",
        ],
      },
      {
        sku: "LET-LL-06",
        color: "06 Chestnut",
        colorHex: "#4A2E2B",
        stock: 15,
        image: "/products/lip-liner/06-chestnut/IMG_6631.PNG",
        images: [
          "/products/lip-liner/06-chestnut/IMG_6631.PNG",
          "/IMG_6386.PNG",
          "/IMG_6270.PNG",
          "/IMG_6549.PNG",
        ],
      },
      {
        sku: "LET-LL-07",
        color: "07 Nightfall",
        colorHex: "#3B1F2B",
        stock: 14,
        image: "/products/lip-liner/07-nightfall/IMG_6632.PNG",
        images: [
          "/products/lip-liner/07-nightfall/IMG_6632.PNG",
          "/IMG_6386.PNG",
          "/IMG_6270.PNG",
          "/IMG_6549.PNG",
        ],
      },
    ];

    for (const [i, v] of linerVariants.entries()) {
      const cldImage = toCloudinaryUrl(v.image);
      const cldImages = v.images.map(toCloudinaryUrl);

      const varRes = await client.query(
        `
        INSERT INTO product_variants (
          product_id, sku, price_override_usd, price_override_ngn,
          stock_quantity, is_active, position,
          color, color_hex, image_url, images
        )
        VALUES ($1, $2, 9.00, 14400.00, $3, true, $4, $5, $6, $7, $8)
        ON CONFLICT (sku) DO UPDATE SET
          color = EXCLUDED.color,
          color_hex = EXCLUDED.color_hex,
          image_url = EXCLUDED.image_url,
          images = EXCLUDED.images,
          stock_quantity = EXCLUDED.stock_quantity
        RETURNING id;
        `,
        [linerId, v.sku, v.stock, i, v.color, v.colorHex, cldImage, JSON.stringify(cldImages)]
      );
      const varId = varRes.rows[0].id;

      await client.query(
        `
        INSERT INTO variant_options (variant_id, option_name, option_value)
        VALUES ($1, 'Color', $2)
        ON CONFLICT (variant_id, option_name) DO UPDATE SET option_value = EXCLUDED.option_value;
        `,
        [varId, v.color]
      );
    }

    // Media for liner
    const linerMedia = [
      {
        url: toCloudinaryUrl("/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG"),
        alt: "Letty Velvet Sculpt Lip Liner — 01 Cafe Creme with swatch",
        position: 0,
        primary: true,
      },
      {
        url: toCloudinaryUrl("/IMG_6386.PNG"),
        alt: "Letty Lip Liner in aesthetic vanity flatlay with lip glosses",
        position: 1,
        primary: false,
      },
      {
        url: toCloudinaryUrl("/IMG_6270.PNG"),
        alt: "Letty Beauty editorial campaign — flawless pout with lip liner and lip gloss",
        position: 2,
        primary: false,
      },
      {
        url: toCloudinaryUrl("/IMG_6549.PNG"),
        alt: "Letty Beauty backstage beauty lineup",
        position: 3,
        primary: false,
      },
    ];

    await client.query("DELETE FROM product_media WHERE product_id = $1", [linerId]);
    for (const m of linerMedia) {
      await client.query(
        `
        INSERT INTO product_media (product_id, url, alt_text, position, is_primary, type)
        VALUES ($1, $2, $3, $4, $5, 'image');
        `,
        [linerId, m.url, m.alt, m.position, m.primary]
      );
    }
    console.log("✓ Lip Liner & 7 variants + media stored in database!");

    // -------------------------------------------------------------
    // 5. PRODUCT 2: LETTY GLASS SHINE LIP GLOSS
    // -------------------------------------------------------------
    console.log("Transferring Product 2: Letty Glass Shine Lip Gloss...");
    const glossDetails = [
      "Glass-like reflective shine without any stickiness",
      "Doe-foot precision applicator designed to hold maximum formula",
      "Instant faux-filler smoothing and plumping appearance",
      "Formulated with Shea Butter and Vitamin E for deep hydration",
      "Delicious subtle sweet vanilla aroma",
      "Net Vol. 5ml / 0.17 fl. oz.",
      "Cruelty-free and vegan formula",
    ];

    const glossWhatElseToKnow = [
      "High-shine, luminous glass finish",
      "Non-sticky & ultra-comfortable lightweight feel",
      "Cushiony texture that melts onto lips",
      "Buildable colour from translucent glaze to rich tint",
      "Instantly enhances the appearance of lips",
      "Helps lips look visibly smoother, plumper & fuller",
      "Deeply hydrating feel that prevents dryness",
      "Can be worn alone or layered over lip liner & lipstick",
      "Plush juicy doe foot with pointed precision tips",
    ];

    const glossHowToUseSteps = [
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
    ];

    const glossBeautyHack = {
      title: "The Signature Faux-Filler Glaze",
      steps: [
        "Exfoliate and start with smooth, hydrated lips.",
        "Line and softly shade outer lips with your matching Letty Lip Liner.",
        "Generously sweep Letty Glass Shine Lip Gloss from centre outward.",
        "Enjoy hours of non-sticky, reflective glass-like fullness.",
      ],
    };

    const glossPairWith = {
      name: "Letty Velvet Sculpt Lip Liner",
      slug: "letty-velvet-lip-liner",
      shade: "01 Cafe Creme",
      priceGbp: 9,
      image: toCloudinaryUrl("/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG"),
    };

    const glossRes = await client.query(
      `
      INSERT INTO products (
        slug, name, brand_id, category_id, description, short_description,
        base_price_usd, base_price_ngn, compare_at_price_usd,
        is_active, is_featured, is_new, is_bestseller,
        tagline, details, what_it_is, what_it_does, what_else_to_know,
        how_to_use_steps, pro_tip, beauty_hack, ingredients, pair_with,
        rating, review_count, is_vegan,
        meta_title, meta_description, og_image
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9,
        true, true, true, true,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22,
        $23, $24, $25
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        tagline = EXCLUDED.tagline,
        details = EXCLUDED.details,
        what_it_is = EXCLUDED.what_it_is,
        what_it_does = EXCLUDED.what_it_does,
        what_else_to_know = EXCLUDED.what_else_to_know,
        how_to_use_steps = EXCLUDED.how_to_use_steps,
        pro_tip = EXCLUDED.pro_tip,
        beauty_hack = EXCLUDED.beauty_hack,
        ingredients = EXCLUDED.ingredients,
        pair_with = EXCLUDED.pair_with,
        rating = EXCLUDED.rating,
        review_count = EXCLUDED.review_count,
        is_vegan = EXCLUDED.is_vegan,
        base_price_usd = EXCLUDED.base_price_usd,
        base_price_ngn = EXCLUDED.base_price_ngn
      RETURNING id;
      `,
      [
        "letty-glass-lip-gloss",
        "Letty Glass Shine Lip Gloss",
        brandId,
        lipGlossCatId,
        "A high-shine, ultra-comfortable lip gloss that delivers a glossy, juicy finish while leaving lips looking fuller, smoother and beautifully hydrated. Non-sticky, cushiony texture with reflective glass shine and buildable color.",
        "High-shine hydration & luscious fuller lips",
        12.0,
        19200.0,
        15.0,
        "High-Shine Hydration & Luscious Fuller Lips",
        JSON.stringify(glossDetails),
        "A high-shine, ultra-comfortable lip gloss that delivers a glossy, juicy finish while leaving lips looking fuller, smoother and beautifully hydrated.",
        "This non-sticky lip gloss glides effortlessly onto the lips, providing instant shine and buildable colour for a luscious, glass-like finish.\n\nThe lightweight, cushiony formula keeps lips feeling soft and comfortable while creating a smooth, reflective shine that catches the light from every angle.",
        JSON.stringify(glossWhatElseToKnow),
        JSON.stringify(glossHowToUseSteps),
        "Apply a dot of Midas Touch to the centre of the cupid's bow and lower lip for an amplified reflective 3D pout effect.",
        JSON.stringify(glossBeautyHack),
        "POLYBUTENE, OCTYLDODECANOL, HYDROGENATED POLYISOBUTENE, DIISOSTEARYL MALATE, TRIDECYL TRIMELLITATE, BIS-DIGLYCERYL POLYACYLADIPATE-2, SILICA DIMETHYL SILYLATE, BUTYROSPERMUM PARKII (SHEA) BUTTER, TOCOPHERYL ACETATE (VITAMIN E), PHENOXYETHANOL, ETHYLHEXYLGLYCERIN, AROMA (FLAVOR). MAY CONTAIN (+/-): CI 77891 (TITANIUM DIOXIDE), CI 77491, CI 77492, CI 77499 (IRON OXIDES), CI 15850 (RED 7 LAKE), CI 45410 (RED 28 LAKE), CI 19140 (YELLOW 5 LAKE).",
        JSON.stringify(glossPairWith),
        5.0,
        62,
        true,
        "Letty Glass Shine Lip Gloss | Reflective High-Shine Glaze",
        "Shop Letty Glass Shine Lip Gloss. Non-sticky, cushiony formula enriched with Shea Butter & Vitamin E for a glass-like reflective shine.",
        toCloudinaryUrl("/products/lip-gloss/01-berry-glow/IMG_6590.PNG"),
      ]
    );
    const glossId = glossRes.rows[0].id;

    // Attach to collections
    await client.query(
      `
      INSERT INTO collection_products (collection_id, product_id, position)
      VALUES ($1, $2, 2), ($3, $2, 2)
      ON CONFLICT (collection_id, product_id) DO NOTHING;
      `,
      [collEditId, glossId, collGoldenId]
    );

    // Lip gloss variants (8 shades)
    const glossVariants = [
      {
        sku: "LET-LG-01",
        color: "01 Berry Glow",
        colorHex: "#9E385D",
        stock: 28,
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
        sku: "LET-LG-02",
        color: "02 Rich Mocha",
        colorHex: "#5A382E",
        stock: 30,
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
        sku: "LET-LG-03",
        color: "03 Plum Wine",
        colorHex: "#5E253B",
        stock: 20,
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
        sku: "LET-LG-04",
        color: "04 Velvet Nude",
        colorHex: "#B07D6D",
        stock: 35,
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
        sku: "LET-LG-05",
        color: "05 Classic Red",
        colorHex: "#B31B25",
        stock: 25,
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
        sku: "LET-LG-06",
        color: "06 Midas Touch",
        colorHex: "#D4A373",
        stock: 24,
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
        sku: "LET-LG-07",
        color: "07 Soft Peach",
        colorHex: "#E89A88",
        stock: 19,
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
        sku: "LET-LG-08",
        color: "08 Warm Coral",
        colorHex: "#E26D5C",
        stock: 22,
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
    ];

    for (const [i, v] of glossVariants.entries()) {
      const cldImage = toCloudinaryUrl(v.image);
      const cldImages = v.images.map(toCloudinaryUrl);

      const varRes = await client.query(
        `
        INSERT INTO product_variants (
          product_id, sku, price_override_usd, price_override_ngn,
          stock_quantity, is_active, position,
          color, color_hex, image_url, images
        )
        VALUES ($1, $2, 12.00, 19200.00, $3, true, $4, $5, $6, $7, $8)
        ON CONFLICT (sku) DO UPDATE SET
          color = EXCLUDED.color,
          color_hex = EXCLUDED.color_hex,
          image_url = EXCLUDED.image_url,
          images = EXCLUDED.images,
          stock_quantity = EXCLUDED.stock_quantity
        RETURNING id;
        `,
        [glossId, v.sku, v.stock, i, v.color, v.colorHex, cldImage, JSON.stringify(cldImages)]
      );
      const varId = varRes.rows[0].id;

      await client.query(
        `
        INSERT INTO variant_options (variant_id, option_name, option_value)
        VALUES ($1, 'Color', $2)
        ON CONFLICT (variant_id, option_name) DO UPDATE SET option_value = EXCLUDED.option_value;
        `,
        [varId, v.color]
      );
    }

    // Media for gloss
    const glossMedia = [
      {
        url: toCloudinaryUrl("/products/lip-gloss/01-berry-glow/IMG_6590.PNG"),
        alt: "Letty Glass Shine Lip Gloss — Berry Glow bottle and swatch",
        position: 0,
        primary: true,
      },
      {
        url: toCloudinaryUrl("/products/lip-gloss/01-berry-glow/IMG_6591.PNG"),
        alt: "Before and After Letty Glass Shine Lip Gloss — unretouched glass finish",
        position: 1,
        primary: false,
      },
      {
        url: toCloudinaryUrl("/products/lip-gloss/01-berry-glow/IMG_6592.PNG"),
        alt: "Berry Glow shade on diverse skin complexions",
        position: 2,
        primary: false,
      },
      {
        url: toCloudinaryUrl("/products/lip-gloss/01-berry-glow/IMG_6594.PNG"),
        alt: "Juicy doe foot applicator with hold-max formula and pointed precision tip",
        position: 3,
        primary: false,
      },
      {
        url: toCloudinaryUrl("/products/lip-gloss/01-berry-glow/IMG_6593.PNG"),
        alt: "Letty Glass Shine Lip Gloss full collection swatches",
        position: 4,
        primary: false,
      },
      {
        url: toCloudinaryUrl("/products/lip-gloss/01-berry-glow/IMG_6595.PNG"),
        alt: "Letty Beauty Lip Pairings shade guide",
        position: 5,
        primary: false,
      },
    ];

    await client.query("DELETE FROM product_media WHERE product_id = $1", [glossId]);
    for (const m of glossMedia) {
      await client.query(
        `
        INSERT INTO product_media (product_id, url, alt_text, position, is_primary, type)
        VALUES ($1, $2, $3, $4, $5, 'image');
        `,
        [glossId, m.url, m.alt, m.position, m.primary]
      );
    }
    console.log("✓ Lip Gloss & 8 variants + media stored in database!");

    await client.query("COMMIT");
    console.log("\n🎉 ALL PRODUCTS AND RICH DATA TRANSFERRED TO DATABASE SUCCESSFULLY!");
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Transfer failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

transfer();
