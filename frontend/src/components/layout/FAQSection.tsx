import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "What is Smart Waste Platform?",
      answer: "An AI-driven ecosystem connecting households, drivers, recyclers, and councils for transparent waste management."
    },
    {
      question: "How do pickup requests work?",
      answer: "Submit photos of waste, our AI detects contamination and assigns priority, then drivers receive optimized routes."
    },
    {
      question: "What do drivers and recyclers get?",
      answer: "Drivers get GPS tracking and prioritized routes. Recyclers track all received and processed waste for full traceability."
    },
    {
      question: "How do councils benefit?",
      answer: "Access real-time dashboards with collection data, contamination rates, and metrics for better decision-making."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-ink-900 mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-ink-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-ink-50 transition-colors"
              >
                <span className="font-semibold text-ink-900 pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <Minus className="w-5 h-5 text-brand-600 flex-shrink-0" />
                ) : (
                  <Plus className="w-5 h-5 text-ink-400 flex-shrink-0" />
                )}
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-40' : 'max-h-0'
                  }`}
              >
                <p className="px-5 pb-5 text-ink-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}