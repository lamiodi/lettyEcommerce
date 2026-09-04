import type { Review } from "@/types";

/**
 * Review pool. Keyed by productId for best sellers; the repository
 * falls back to a generic slice for other products.
 */
export const reviews: Review[] = [
  // Letty Lip Liner
  { id: "r-lll-1", productId: "p-letty-lip-liner", rating: 5, title: "Cafe Creme is the ultimate nude liner", body: "Glides like butter without tugging. Outlined in the morning and it survived coffee and lunch with zero feathering or transfer.", author: "Sienna W.", verified: true, date: "2026-08-28" },
  { id: "r-lll-2", productId: "p-letty-lip-liner", rating: 5, title: "Truly smudge-proof & ultra pigmented", body: "The pigment payoff is unbelievable for £9. Crimson is the most striking red contour I've ever used. Pairing it with the gloss is essential.", author: "Amara K.", verified: true, date: "2026-08-15" },
  { id: "r-lll-3", productId: "p-letty-lip-liner", rating: 5, title: "Outperforms my £24 designer liner", body: "Creamy, doesn't drag, and makes overlining look seamless. Love the beauty hack on the box — filling in before gloss lasts all night.", author: "Chloe M.", verified: true, date: "2026-08-04" },

  // Letty Lip Gloss
  { id: "r-llg-1", productId: "p-letty-lip-gloss", rating: 5, title: "Non-sticky glass perfection", body: "The faux-filler shine is completely real! It feels like a hydrating cushion, not sticky at all, and the heart-top packaging is so chic.", author: "Zara T.", verified: true, date: "2026-08-30" },
  { id: "r-llg-2", productId: "p-letty-lip-gloss", rating: 5, title: "Berry Glow is my holy grail", body: "The doe foot applicator is huge and hugs the lips perfectly in one pass. Leaves lips looking juicy, hydrated, and dimensional.", author: "Evelyn B.", verified: true, date: "2026-08-22" },
  { id: "r-llg-3", productId: "p-letty-lip-gloss", rating: 5, title: "Midas Touch in the centre = 3D lips", body: "Followed the pro tip and tapped Midas Touch over Velvet Nude. The reflective light catch is stunning in photos and in person.", author: "Kemi O.", verified: true, date: "2026-08-11" },

  { id: "r-gh-1", productId: "p-golden-hour", rating: 5, title: "My signature now", body: "Three compliments before noon on the first wear. The amber drydown is unreal — warm but never heavy.", author: "Amara O.", verified: true, date: "2026-06-18" },
  { id: "r-gh-2", productId: "p-golden-hour", rating: 5, title: "Sunset in a bottle", body: "It opens bright with neroli and melts into the softest vanilla. Lasts 10+ hours on skin.", author: "Elena R.", verified: true, date: "2026-06-02" },
  { id: "r-gh-3", productId: "p-golden-hour", rating: 4, title: "Beautiful, wish it were bigger", body: "The 50 ml goes fast because I reach for it daily. Ordering the 100 ml next.", author: "Sofia M.", verified: true, date: "2026-05-21" },
  // Vitamin C Serum
  { id: "r-vc-1", productId: "p-vitc-serum", rating: 5, title: "Two weeks, visible glow", body: "My dark spots have visibly faded and my skin looks lit from within. No irritation at all.", author: "Grace T.", verified: true, date: "2026-06-25" },
  { id: "r-vc-2", productId: "p-vitc-serum", rating: 5, title: "Worth every cent", body: "I've tried every vitamin C on the market. This is the first that doesn't oxidize in the bottle.", author: "Chidinma A.", verified: true, date: "2026-06-10" },
  { id: "r-vc-3", productId: "p-vitc-serum", rating: 4, title: "Layers beautifully", body: "Sits perfectly under moisturizer and makeup. Slight tackiness for a minute, then gone.", author: "Yasmin K.", verified: false, date: "2026-05-30" },
  // Lipstick
  { id: "r-lip-1", productId: "p-lipstick", rating: 5, title: "Rouge Éternel is perfect", body: "The most flattering red I've ever owned. One swipe and it survived a full dinner.", author: "Nadia B.", verified: true, date: "2026-06-20" },
  { id: "r-lip-2", productId: "p-lipstick", rating: 5, title: "Doesn't feel like matte", body: "Cushiony, weightless, zero cracking. The refillable case is gorgeous.", author: "Imane Z.", verified: true, date: "2026-06-05" },
  { id: "r-lip-3", productId: "p-lipstick", rating: 4, title: "Nude Soie is my everyday", body: "A true my-lips-but-better shade. Reapplying once after lunch, which is fine.", author: "Tara L.", verified: true, date: "2026-05-14" },
  // Shampoo
  { id: "r-sha-1", productId: "p-silk-shampoo", rating: 5, title: "Salon hair at home", body: "My stylist asked what I'd been using. Hair air-dries smooth now — unheard of for me.", author: "Funke D.", verified: true, date: "2026-06-22" },
  { id: "r-sha-2", productId: "p-silk-shampoo", rating: 5, title: "Gentle on my color", body: "Eight weeks post-color and no fading. The white tea scent is subtle and expensive-smelling.", author: "Mariam S.", verified: true, date: "2026-06-01" },
  { id: "r-sha-3", productId: "p-silk-shampoo", rating: 4, title: "Lovely, use sparingly", body: "A little goes a long way. Took me a week to stop using too much.", author: "Claire V.", verified: false, date: "2026-05-18" },
  // Silk dress
  { id: "r-drs-1", productId: "p-silk-dress", rating: 5, title: "Wore it to a wedding", body: "The bias cut is unbelievably flattering. Draped perfectly and photographed even better.", author: "Ada N.", verified: true, date: "2026-06-27" },
  { id: "r-drs-2", productId: "p-silk-dress", rating: 5, title: "Investment piece", body: "The silk quality rivals pieces triple the price. Size up if between sizes.", author: "Julia P.", verified: true, date: "2026-06-08" },
  // Moisturizer
  { id: "r-moi-1", productId: "p-moisturizer", rating: 5, title: "Winter skin saver", body: "My skin stayed plump through a cold snap. No pilling under sunscreen either.", author: "Renata F.", verified: true, date: "2026-06-15" },
  { id: "r-moi-2", productId: "p-moisturizer", rating: 4, title: "Rich but not greasy", body: "Perfect for night; I use half a pump for daytime. Jar feels luxurious.", author: "Kemi A.", verified: true, date: "2026-05-28" },
];

/** Generic fallback reviews for products without dedicated ones. */
export const genericReviews: Review[] = [
  { id: "r-g-1", productId: "*", rating: 5, title: "Exceeded expectations", body: "The quality, the packaging, the scent — everything feels considered. Will repurchase.", author: "Verified Buyer", verified: true, date: "2026-06-12" },
  { id: "r-g-2", productId: "*", rating: 4, title: "Beautiful product", body: "Does exactly what it promises and the experience of using it feels like a ritual.", author: "Verified Buyer", verified: true, date: "2026-05-25" },
];
