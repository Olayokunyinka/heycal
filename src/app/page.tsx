import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, Zap, ArrowRight, UserPlus, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white selection:bg-[#efe7ff] selection:text-[#6426d9]">
      {/* Navigation */}
      <header className="px-6 h-16 flex items-center sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <Link className="flex items-center gap-2 group" href="/">
          <Image src="/heycal-mark.png" alt="" width={36} height={36} className="size-9 object-contain transition-transform group-hover:scale-105" />
          <span className="text-[22px] font-normal text-[#5f6368] tracking-tight">Heycal</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-8">
          <Link className="text-sm font-medium text-[#5f6368] hover:text-[#6426d9] transition-colors" href="/sign-in">
            Sign In
          </Link>
          <Button asChild variant="outline" className="rounded-full px-6 border-gray-200 text-[#6426d9] hover:bg-[#f8f9fa]">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        {/* Hero Section */}
        <section className="relative w-full pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden">
          {/* Abstract Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-[0.03]">
            <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#6426d9] blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#34a853] blur-3xl" />
          </div>

          <div className="container px-4 md:px-6 mx-auto relative reveal-up">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-6 max-w-4xl">
                <h1 className="text-5xl md:text-8xl font-normal tracking-tight text-[#1f1f1f] leading-[1.1]">
                  Scheduling <span className="text-[#6426d9]">made simple</span>
                </h1>
                <p className="mx-auto max-w-[640px] text-[#5f6368] text-xl md:text-2xl font-light leading-relaxed">
                  Heycal helps you schedule meetings without the back-and-forth emails.
                  Connect your calendar and let people book time with you.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 reveal-up" style={{ animationDelay: '0.2s' }}>
                <Button asChild size="lg" className="rounded-full bg-[#6426d9] hover:bg-[#4b1cac] px-10 h-14 text-lg shadow-lg hover:shadow-xl transition-all">
                  <Link href="/dashboard">Try Heycal for free</Link>
                </Button>
                <Button variant="ghost" size="lg" className="rounded-full px-10 h-14 text-lg text-[#5f6368] hover:bg-gray-50 group">
                  Learn how it works <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Product Preview Section */}
        <section className="w-full pb-20 md:pb-32 reveal-up" style={{ animationDelay: '0.4s' }}>
          <div className="container px-4 mx-auto max-w-6xl">
            <div className="relative p-2 md:p-4 rounded-[32px] bg-gradient-to-br from-[#f8f9fa] to-[#efe7ff] border border-gray-100 shadow-2xl">
              <div className="rounded-[24px] overflow-hidden bg-white border border-gray-200 shadow-inner min-h-[300px] md:min-h-[500px] relative flex flex-col">
                {/* Fake Header */}
                <div className="h-14 border-b border-gray-100 bg-[#f8f9fa] flex items-center px-4 gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 h-7 bg-white rounded-md border border-gray-200 max-w-[400px] mx-auto" />
                </div>
                {/* Fake Dashboard Content */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                  <div className="space-y-6">
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                    <div className="h-32 w-full bg-[#f1eaff] rounded-2xl border border-[#decfff]" />
                    <div className="h-32 w-full bg-gray-50 rounded-2xl border border-gray-100" />
                  </div>
                  <div className="space-y-6">
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                    <div className="h-[280px] w-full bg-gray-50 rounded-2xl border border-gray-100 flex flex-col p-4 gap-3">
                        <div className="h-10 w-full bg-white rounded-lg border border-gray-200" />
                        <div className="h-10 w-full bg-white rounded-lg border border-gray-200" />
                        <div className="h-10 w-full bg-white rounded-lg border border-gray-200" />
                    </div>
                  </div>
                </div>
                {/* Visual Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur px-8 py-4 rounded-full border border-gray-200 shadow-xl flex items-center gap-3">
                        <CheckCircle2 className="text-[#6426d9] h-6 w-6" />
                        <span className="text-xl font-medium text-[#1f1f1f]">Professional & Minimal</span>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="w-full py-20 md:py-32 bg-[#f8f9fa] border-y border-gray-100">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16 space-y-4 reveal-up">
              <h2 className="text-3xl md:text-5xl font-normal text-[#1f1f1f]">Everything you need to meet better</h2>
              <p className="text-[#5f6368] text-lg font-light max-w-2xl mx-auto">
                Heycal handles the complex logic so you can focus on the conversation.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { 
                  icon: Clock, 
                  title: "Real-time Availability", 
                  desc: "Syncs instantly with your Google Calendar to prevent double bookings." 
                },
                { 
                  icon: ShieldCheck, 
                  title: "Secure & Private", 
                  desc: "Your data is encrypted and handled with the highest security standards." 
                },
                { 
                  icon: Zap, 
                  title: "Lightning Fast", 
                  desc: "Optimized for speed. Your booking page loads in milliseconds." 
                }
              ].map((feature, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-8 bg-white rounded-3xl border border-gray-200 transition-all hover:shadow-xl hover:-translate-y-1 reveal-up" style={{ animationDelay: `${0.1 * idx}s` }}>
                  <div className="h-16 w-16 rounded-2xl bg-[#efe7ff] flex items-center justify-center text-[#6426d9] mb-6">
                    <feature.icon size={32} />
                  </div>
                  <h3 className="text-xl font-medium text-[#1f1f1f] mb-3">{feature.title}</h3>
                  <p className="text-[#5f6368] leading-relaxed font-light">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Storytelling Steps */}
        <section className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
              <div className="space-y-12 reveal-up">
                <div className="space-y-4">
                  <span className="text-[#6426d9] font-medium tracking-widest uppercase text-sm">How it works</span>
                  <h2 className="text-4xl md:text-5xl font-normal text-[#1f1f1f]">Three simple steps to <br/>perfect scheduling</h2>
                </div>
                
                <div className="space-y-8">
                  {[
                    { icon: UserPlus, step: "01", title: "Create your event types", desc: "Define your meeting name, duration, and personalized URL." },
                    { icon: ArrowRight, step: "02", title: "Share your unique link", desc: "Send it via email, text, or embed it directly on your website." },
                    { icon: CheckCircle2, step: "03", title: "Wait for the bookings", desc: "Guests pick a time, and it's added automatically to your calendar." }
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-6 group">
                      <div className="h-12 w-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-[#6426d9] font-bold shrink-0 transition-colors group-hover:border-[#6426d9] group-hover:bg-[#6426d9] group-hover:text-white">
                        {step.step}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xl font-medium text-[#1f1f1f]">{step.title}</h4>
                        <p className="text-[#5f6368] font-light leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative reveal-up" style={{ animationDelay: '0.3s' }}>
                <div className="bg-[#f1eaff] rounded-[40px] p-8 aspect-square flex items-center justify-center">
                    <div className="w-full h-full rounded-[32px] bg-white border border-gray-200 shadow-xl flex flex-col p-6 overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-3/4 bg-gray-100 rounded" />
                                <div className="h-3 w-1/2 bg-gray-50 rounded" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-12 w-full bg-gray-50 rounded-xl border border-gray-100 flex items-center px-4">
                                    <div className="h-2 w-24 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Floating Badge */}
                    <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 animate-bounce transition-all hover:scale-110">
                        <div className="flex flex-col items-center gap-2">
                            <Zap className="text-[#fbbc04] h-8 w-8" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Instant</span>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-24 md:py-40 bg-[#6426d9] reveal-fade">
          <div className="container px-4 md:px-6 mx-auto text-center space-y-10">
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-7xl font-normal text-white leading-tight">Ready to reclaim your time?</h2>
              <p className="text-white/80 text-xl md:text-2xl font-light">
                Join thousands of professionals using Heycal for seamless scheduling.
              </p>
            </div>
            <div className="flex justify-center">
              <Button asChild size="lg" className="rounded-full bg-white text-[#6426d9] hover:bg-gray-50 px-12 h-16 text-xl shadow-2xl hover:scale-105 transition-all">
                <Link href="/dashboard">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-4 sm:flex-row py-12 w-full shrink-0 items-center px-10 border-t border-gray-100 bg-[#f8f9fa]">
        <div className="flex items-center gap-2 mr-auto">
          <Image src="/heycal-mark.png" alt="" width={24} height={24} className="size-6 object-contain" />
          <p className="text-sm text-[#5f6368]">© 2026 Heycal. Part of the Scheduling Network.</p>
        </div>
        <nav className="sm:ml-auto flex gap-10">
          <Link className="text-sm text-[#5f6368] hover:text-[#6426d9] hover:underline underline-offset-4" href="#">
            Products
          </Link>
          <Link className="text-sm text-[#5f6368] hover:text-[#6426d9] hover:underline underline-offset-4" href="#">
            Security
          </Link>
          <Link className="text-sm text-[#5f6368] hover:text-[#6426d9] hover:underline underline-offset-4" href="#">
            Terms
          </Link>
          <Link className="text-sm text-[#5f6368] hover:text-[#6426d9] hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
