"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl text-center">
        {/* Logo / Brand */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-primary mb-2">
            Antra<span className="text-secondary">AI</span>
          </h1>
          <p className="text-muted text-lg">
            Your Personal AI Tutor for Maharashtra SSC Board
          </p>
        </div>

        {/* Hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="text-2xl font-semibold mb-4">
            Learn at Your Own Pace
          </h2>
          <p className="text-muted mb-6 leading-relaxed">
            Personalized AI tutoring that adapts to your learning level.
            Get help with Science and Mathematics, track your progress,
            and ace your SSC board exams.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 text-foreground font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              I Have an Account
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureCard
            icon="📚"
            title="Textbook Grounded"
            description="Answers based strictly on Maharashtra SSC textbooks"
          />
          <FeatureCard
            icon="🎯"
            title="Adaptive Learning"
            description="Questions adjust to your level - grow at your pace"
          />
          <FeatureCard
            icon="📊"
            title="Track Progress"
            description="Visual mastery map showing exactly where you stand"
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-left">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-muted text-xs leading-relaxed">{description}</p>
    </div>
  );
}
