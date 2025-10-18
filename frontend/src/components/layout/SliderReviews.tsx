import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

export function SliderReviews() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const reviews = [
    {
      name: 'Sarah Mitchell',
      role: 'City Operations Manager',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      text: 'Reduced our processing errors by 60% and improved recycling rates significantly.',
    },
    {
      name: 'David Chen',
      role: 'Fleet Coordinator',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      text: 'Cut fuel costs by 35%. Real-time tracking means our drivers work smarter.',
    },
    {
      name: 'Maria Rodriguez',
      role: 'Recycling Director',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      text: 'Full traceability transformed our operations. Transparency builds community trust.',
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goTo = (index) => setCurrentIndex(index);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % reviews.length);

  return (
    <section className="py-20 bg-ink-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-ink-900 mb-12">
          Trusted by Cities
        </h2>

        <div className="relative">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-accent-400 text-accent-400" />
              ))}
            </div>

            <p className="text-lg text-ink-700 mb-6 min-h-[60px]">
              "{reviews[currentIndex].text}"
            </p>

            <div className="flex items-center gap-3">
              <img
                src={reviews[currentIndex].image}
                alt={reviews[currentIndex].name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-ink-900">{reviews[currentIndex].name}</div>
                <div className="text-sm text-ink-600">{reviews[currentIndex].role}</div>
              </div>
            </div>
          </div>

          <button
            onClick={goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-10 h-10 bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-ink-600" />
          </button>

          <button
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-10 h-10 bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 text-ink-600" />
          </button>

          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${currentIndex === i ? 'w-8 bg-brand-600' : 'w-2 bg-ink-300'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}