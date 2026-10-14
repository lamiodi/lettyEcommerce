import { permanentRedirect } from "next/navigation";

// Preserve existing campaign links now that the kit is available normally.
export default function PreorderPage() {
  permanentRedirect("/products/letty-lash-book-kit");
}
