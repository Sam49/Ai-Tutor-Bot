"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, MessageSquare, Clock, BookOpen, Users, Zap, CheckCircle, ArrowRight, Sparkles } from "lucide-react"
import { HeroSection } from "@/components/ui/hero-section"

interface LandingPageProps {
  onShowAuth: () => void
}

export function LandingPage({ onShowAuth }: LandingPageProps) {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Tutoring",
      description: "Get instant help from our advanced AI tutor trained on academic subjects",
    },
    {
      icon: MessageSquare,
      title: "Interactive Chat",
      description: "Ask questions naturally and receive detailed, personalized explanations",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Study anytime, anywhere with round-the-clock AI assistance",
    },
    {
      icon: BookOpen,
      title: "All Subjects",
      description: "Math, Science, History, English, and more - we cover it all",
    },
    {
      icon: Users,
      title: "Session History",
      description: "Review past conversations and track your learning progress",
    },
    {
      icon: Zap,
      title: "Instant Responses",
      description: "No waiting - get immediate answers to your academic questions",
    },
  ]

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "English Literature",
    "Computer Science",
    "Economics",
    "Psychology",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Tutor
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onShowAuth}>
              Login
            </Button>
            <Button
              onClick={onShowAuth}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection
        title="Powered by Advanced AI"
        subtitle={{
          regular: "Your Personal ",
          gradient: "AI Tutor",
        }}
        description="Get instant, personalized help with any academic subject. Ask questions, solve problems, and learn at your own pace with our AI-powered tutoring platform."
        ctaText="Start Learning Now"
        onCtaClick={onShowAuth}
        bottomImage={{
          light: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
          dark: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2370&auto=format&fit=crop",
        }}
        gridOptions={{
          angle: 65,
          opacity: 0.4,
          cellSize: 50,
        }}
      />

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose AI Tutor?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience the future of personalized learning with our cutting-edge AI technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Subjects Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">All Subjects Covered</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            From basic concepts to advanced topics, get help with any subject
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {subjects.map((subject, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-sm px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
            >
              {subject}
            </Badge>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Learning?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of students who are already getting better grades with AI Tutor. Start your personalized
              learning journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={onShowAuth}
                className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Instant access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>24/7 support</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Tutor
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-300">© 2025 AI Tutor Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
