import { ArrowRight,  CheckCircle } from 'lucide-react';

export function SimpleHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&auto=format&fit=crop&q=80"
          alt="Smart waste management system"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/95 via-ink-900/80 to-ink-900/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-100 text-brand-800 text-sm font-medium mb-6">
              <CheckCircle className="w-4 h-4 mr-2" />
              AI-Powered Waste Management
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Smart Waste
              <span className="block text-brand-400 mt-2">Management</span>
              <span className="block text-white/90 text-2xl sm:text-3xl lg:text-4xl font-normal mt-4">
                Made Simple
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl">
              Connect communities, drivers, and recyclers in one transparent ecosystem.
              AI-powered platform for efficient waste collection and recycling.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all hover:scale-105 shadow-2xl flex items-center justify-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
              {/* <button className="border-2 border-white/30 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all hover:bg-white/10 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button> */}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">10K+</div>
                <div className="text-white/70 text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">50K+</div>
                <div className="text-white/70 text-sm">Pickups Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">95%</div>
                <div className="text-white/70 text-sm">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Elements */}
          <div className="relative">
            <div className="relative z-10">
              {/* Main Feature Card */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Detection</h3>
                  <p className="text-white/80 text-sm">
                    Smart waste classification and contamination detection for better recycling
                  </p>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="text-white text-sm font-medium">Real-time Tracking</div>
                <div className="text-white/70 text-xs">Live pickup status</div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="text-white text-sm font-medium">Smart Routing</div>
                <div className="text-white/70 text-xs">Optimized collection</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}