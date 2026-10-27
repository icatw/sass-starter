import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { ModuleScaffold } from '@/components/shared/module-scaffold'
import { findPage, navPages } from '@/lib/navigation'

interface ModulePageProps {
  params: Promise<{ slug: string[] }>
}

export function generateStaticParams() {
  return navPages
    .filter((page) => page.href !== '/' && page.href !== '/billing')
    .map((page) => ({ slug: page.href.slice(1).split('/') }))
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const { slug } = await params
  const page = findPage(`/${slug.join('/')}`)
  return { title: page?.title ?? 'Not found' }
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { slug } = await params
  const page = findPage(`/${slug.join('/')}`)
  if (!page) notFound()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title={page.title} description={page.description} />
      <ModuleScaffold page={page} />
    </div>
  )
}
