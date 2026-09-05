export interface UgcVideo {
  id: string;
  /** Public video URL (mp4 / webm / mov / Cloudinary). */
  src: string;
  /** Static poster shown before / after the video plays (optional). */
  poster?: string;
  /** Customer handle shown in the lower badge (e.g. "@_simaipek"). */
  handle: string;
  /** Short caption shown above the handle. */
  caption: string;
  /** Optional credit line (e.g. "London · Makeup"). */
  location?: string;
  /** Featured product slug to link to. */
  productSlug: string;
  /** Official product name displayed on the card. */
  productName: string;
  /** Selected shade shown in video (e.g. "05 Terra"). */
  productShade?: string;
  /** Formatted product price (e.g. "£9.00"). */
  productPrice?: string;
  /** Featured product thumbnail imageKey or URL. */
  productImage?: string;
  /** Whether this video is published and visible on the storefront. */
  isActive?: boolean;
}

export const DEFAULT_UGC_VIDEOS: UgcVideo[] = [
  {
    id: "ugc-1",
    src: "/IMG_6572.MOV",
    poster: "/images/ugc-poster-1.jpg",
    handle: "@_simaipek",
    caption: "05 Terra gives the most natural, sculpted lip contour.",
    location: "London",
    productSlug: "letty-velvet-lip-liner",
    productName: "Letty Velvet Sculpt Lip Liner",
    productShade: "05 Terra",
    productPrice: "£9.00",
    productImage: "/products/lip-liner/05-terra/IMG_6629.PNG",
    isActive: true,
  },
  {
    id: "ugc-2",
    src: "/IMG_5725.MOV",
    poster: "/images/ugc-poster-2.jpg",
    handle: "@elena.r",
    caption: "Soft golden bronze glow with Midas Touch Glass Shine.",
    location: "Paris",
    productSlug: "letty-glass-lip-gloss",
    productName: "Letty Glass Shine Lip Gloss",
    productShade: "06 Midas Touch",
    productPrice: "£12.00",
    productImage: "/products/lip-gloss/06-midas-touch/IMG_6614.PNG",
    isActive: true,
  },
  {
    id: "ugc-3",
    src: "/IMG_6577.MOV",
    poster: "/images/ugc-poster-3.jpg",
    handle: "@yuyuan.10",
    caption: "High-shine hydration in Velvet Nude for my daily ritual.",
    location: "China",
    productSlug: "letty-glass-lip-gloss",
    productName: "Letty Glass Shine Lip Gloss",
    productShade: "04 Velvet Nude",
    productPrice: "£12.00",
    productImage: "/products/lip-gloss/04-velvet-nude/IMG_6606.PNG",
    isActive: true,
  },
  {
    id: "ugc-4",
    src: "/IMG_9502.MOV",
    poster: "/images/ugc-poster-4.jpg",
    handle: "@hadel",
    caption: "Rich, smudge-proof contour with 02 Cocoa Bean Lip Liner.",
    location: "Iraq",
    productSlug: "letty-velvet-lip-liner",
    productName: "Letty Velvet Sculpt Lip Liner",
    productShade: "02 Cocoa Bean",
    productPrice: "£9.00",
    productImage: "/products/lip-liner/02-cocoa-bean/IMG_6626.PNG",
    isActive: true,
  },
];

