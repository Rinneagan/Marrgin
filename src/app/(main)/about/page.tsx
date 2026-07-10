import { Feather, Wind, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="py-24 px-8 max-w-[800px] mx-auto min-h-screen">
      <div className="text-center mb-24">
        <h1 className="font-serif text-6xl mb-6">The Manifesto</h1>
        <p className="text-xl text-secondary max-w-lg mx-auto font-poem italic">
          "A quiet corner of the internet for words that matter."
        </p>
      </div>

      <div className="space-y-24">
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Feather className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">No Algorithms. Just Poetry.</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              The modern internet is a loud, chaotic machine designed to steal your attention. Algorithms reward controversy, speed, and volume. 
              <br/><br/>
              Marrgin was built as a sanctuary. There are no algorithms here determining what you should feel. We believe poetry requires silence to be heard. We surface poetry chronologically, and by curation, allowing you to discover verses at your own pace.
            </p>
          </div>
        </section>

        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Wind className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">The Living Canvas</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Poetry is not static. It breathes. We designed Marrgin to be a living canvas for words. From the undulating particle rings that react to your presence, to the Zen Mode that breathes with the rhythm of the poem, every pixel of this platform was engineered to amplify the emotional weight of the text.
            </p>
          </div>
        </section>

        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Shield className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">A Safe Harbor</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Your words are yours. Marrgin is built on a foundation of privacy and ownership. The Secret Vault allows you to lock away verses meant only for specific eyes, protected by your own passphrase. No scrapers, no noise. Just your thoughts, kept safe.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-32 text-center border-t border-gray-200 dark:border-gray-800 pt-16">
        <h3 className="font-serif text-2xl mb-4">Welcome to Marrgin.</h3>
        <p className="text-secondary">Take a deep breath. Start reading.</p>
      </div>
    </div>
  );
}
