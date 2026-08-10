import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DepartmentPage } from "@/components/departments/department-page";
import { DEPARTMENTS, getDepartment } from "@/lib/data/departments";

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
  return {
    title: department.name,
    description: `${department.name} — ${department.tagline}`,
    alternates: { canonical: `/departments/${department.slug}` },
  };
}

export default async function DepartmentRoute({ params }: DepartmentRouteProps) {
  const { slug } = await params;
  const department = await getDepartment(slug);
  if (!department) notFound();

  return <DepartmentPage department={department} />;
}
