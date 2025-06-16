import { CTASection } from "@/components/ui/cta-with-rectangle"

export function CTADemo() {
  return (
    <CTASection
      badge={{
        text: "Get started"
      }}
      title="Start building with CreatorCopilot"
      description="Transform your content creation with AI-powered tools and unlock your creative potential"
      action={{
        text: "Get Started",
        href: "/dashboard",
        variant: "glow"
      }}
    />
  )
}