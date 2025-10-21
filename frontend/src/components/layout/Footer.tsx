export function Footer() {
  return (
    <footer className="border-t border-ink-200 mt-16 bg-white dark:bg-ink-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-ink-700 dark:text-ink-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          © {new Date().getFullYear()} Waste Vortex. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-ink-900 dark:hover:text-white">Privacy</a>
          <a href="#" className="hover:text-ink-900 dark:hover:text-white">Terms</a>
          <a href="#" className="hover:text-ink-900 dark:hover:text-white">Contact</a>
        </div>
      </div>
    </footer>
  );
}


