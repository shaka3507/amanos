import { SignUpForm } from "@/components/auth/sign-up-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-2 px-2 border-b">
        <div className="container max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-medium mb-8 text-center">Sign up for amanos</h1>
          <div className="bg-sage-200 rounded-2xl p-8">
            <SignUpForm />
          </div>
        </div>
      </main>

      <footer className="py-6 px-8 text-sm text-muted-foreground border-t">
        <p>© 2025 amanos. All rights reserved.</p>
      </footer>
    </div>
  )
}

