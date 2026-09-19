import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DepartmentPage } from "@/components/departments/department-page";
import { DEPARTMENTS, getDepartment } from "@/lib/data/departments";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.houseofletty.com";

interface DepartmentRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return DEPARTMENTS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: DepartmentRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const department = await getDepartment(slug);
  if (!department) return {};
  const title = `${department.name} | LETTY`;
  const description = `${department.name} — ${department.tagline}. Discover luxury beauty rituals, couture formulations, and bespoke design at LETTY.`;
  return {
    title,
    description,
    alternates: { canonical: `/departments/${department.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/departments/${department.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function DepartmentRoute({ params }: DepartmentRouteProps) {
  const { slug } = await params;
  const department = await getDepartment(slug);
  if (!department) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: department.name,
        item: `${siteUrl}/departments/${department.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DepartmentPage department={department} />
    </>
  );
}
