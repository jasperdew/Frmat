import FormEmbed from '@/components/FormEmbed'

interface EmbedPageProps {
  params: Promise<{
    formId: string
  }>
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { formId } = await params
  
  return (
    <div className="min-h-screen bg-transparent">
      <FormEmbed 
        formId={formId}
        height="100vh"
        width="100%"
      />
    </div>
  )
} 