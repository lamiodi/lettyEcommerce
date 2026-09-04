import { CommunityShowcase } from "@/components/departments/community-showcase";
import { DepartmentGrid } from "@/components/departments/department-grid";
import { DepartmentHero } from "@/components/departments/department-hero";
import { DepartmentRail } from "@/components/departments/department-rail";
import { DepartmentTiles } from "@/components/departments/department-tiles";
import { EditorialBreak } from "@/components/departments/editorial-break";
import { FragranceMoods } from "@/components/departments/fragrance-moods";
import { ShopTheLook } from "@/components/departments/shop-the-look";
import { UgcVideos } from "@/components/departments/ugc-videos";
import { getBrands } from "@/lib/data/catalog";
import {
  filterRailProducts,
  getDepartmentProducts,
  type Department,
  type DepartmentSection,
} from "@/lib/data/departments";
import { getProductsBySlugs } from "@/lib/data/products";

interface DepartmentPageProps {
  department: Department;
}

/**
 * The single department template every world renders through — campaign
 * hero, then the configured sections in order. Keeping all four worlds on
 * one renderer is what makes the site feel professionally designed: the
 * layout language repeats, only photography and mood change.
 */
export async function DepartmentPage({ department }: DepartmentPageProps) {
  const [pool, brands] = await Promise.all([
    getDepartmentProducts(department),
    getBrands(),
  ]);
  const brandNames = Object.fromEntries(brands.map((b) => [b.slug, b.name]));

  return (
    <>
      <DepartmentHero
        name={department.name}
        tagline={department.tagline}
        ctaLabel={department.ctaLabel}
        ctaHref={department.ctaHref}
        imageKey={department.heroImageKey}
      />

      {department.sections.map((section, i) => (
        <SectionRenderer
          key={`${section.kind}-${i}`}
          section={section}
          pool={pool}
          brandNames={brandNames}
        />
      ))}
    </>
  );
}

async function SectionRenderer({
  section,
  pool,
  brandNames,
}: {
  section: DepartmentSection;
  pool: Awaited<ReturnType<typeof getDepartmentProducts>>;
  brandNames: Record<string, string>;
}) {
  switch (section.kind) {
    case "rail":
      return (
        <DepartmentRail
          title={section.title}
          products={filterRailProducts(pool, section.filter)}
          brandNames={brandNames}
          ctaHref={section.ctaHref}
          tabs={
            section.tabs
              ? section.tabs.map((t) => ({
                  label: t.label,
                  products: filterRailProducts(pool, t.filter),
                  ctaHref: t.ctaHref,
                }))
              : undefined
          }
        />
      );
    case "tiles":
      return <DepartmentTiles tiles={section.tiles} />;
    case "editorial":
      return <EditorialBreak imageKey={section.imageKey} quote={section.quote} />;
    case "moods":
      return <FragranceMoods title={section.title} products={pool} />;
    case "look": {
      const products = await getProductsBySlugs(section.productSlugs);
      return (
        <ShopTheLook title={section.title} imageKey={section.imageKey} products={products} />
      );
    }
    case "grid":
      return (
        <DepartmentGrid
          title={section.title}
          subtitle={section.subtitle}
          products={pool}
          brandNames={brandNames}
          ctaHref={section.ctaHref}
          ctaLabel={section.ctaLabel}
          limit={section.limit}
          hideBestSellerBadge={section.hideBestSellerBadge}
        />
      );
    case "community":
      return (
        <CommunityShowcase
          title={section.title}
          topCard={section.topCard}
          bottomCard={section.bottomCard}
        />
      );
    case "ugc":
      return (
        <UgcVideos
          title={section.title}
          eyebrow={section.eyebrow}
          description={section.description}
          hashtag={section.hashtag}
          videos={section.videos}
        />
      );
    default:
      return null;
  }
}
