import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { ModuleScaffold } from '@/components/shared/module-scaffold'
import { findPage, navPages } from '@/lib/navigation'
import { getI18n } from '@/lib/i18n/server'

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
  const { messages } = await getI18n()
  const page = findPage(`/${slug.join('/')}`)
  return { title: page ? messages.nav.items[page.key].title : messages.notFound.title }
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { slug } = await params
  const page = findPage(`/${slug.join('/')}`)
  if (!page) notFound()

  const { messages } = await getI18n()
  const copy = messages.nav.items[page.key]

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title={copy.title} description={copy.description} />
      <ModuleScaffold href={page.href} title={copy.title} planned={copy.planned} />
    </div>
  )
}
