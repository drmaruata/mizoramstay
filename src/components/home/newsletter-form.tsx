'use client'

export function NewsletterForm() {
  return (
    <form
      className="mt-3 flex overflow-hidden rounded-full bg-white p-1"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        aria-label="Email address"
        placeholder="Your email address"
        className="w-full bg-transparent px-3 text-[12px] text-black outline-none placeholder:text-[#8a9a94]"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-[#0d3d2e] px-4 py-1.5 text-[12px] font-semibold text-white"
      >
        Subscribe
      </button>
    </form>
  )
}
