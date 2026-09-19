import type { Metadata } from "next";
import { Shield, Lock, Feather, BarChart3, Database, Sparkles, Scale, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Marrgin's privacy policy: our approach to data minimization, anonymous visitor pseudonyms, reader solitude, and data protection under Ghana Act 843.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Marrgin",
    description: "Our approach to data minimization, anonymous visitor pseudonyms, and reader solitude.",
    url: "https://marrgin.com/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="py-24 px-8 max-w-[800px] mx-auto min-h-screen">
      <div className="text-center mb-24">
        <h1 className="font-serif text-6xl mb-6">Privacy Policy</h1>
        <p className="text-xl text-secondary max-w-lg mx-auto font-poem italic">
          &ldquo;Documenting transparently. Respecting solitude.&rdquo;
        </p>
        <p className="text-xs text-neutral-400 font-mono mt-4 uppercase tracking-widest">
          Effective Date: September 2026 · Accra, Ghana
        </p>
      </div>

      <div className="space-y-24">
        {/* Foundational Principle */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Shield className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Our Foundational Principle</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Marrgin is an independent publication dedicated to Ghanaian environmental journalism, poetry, essays, and evidence. We are not an advertising platform, an NGO portal, or a data brokerage. We do not sell, rent, monetize, or trade reader information. We collect only the minimum data strictly required to deliver our editorial work.
            </p>
          </div>
        </section>

        {/* Account & Authentication */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Lock className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Account & Authentication</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Creating an account on Marrgin is optional. When you register, authentication is handled securely through Google Firebase Authentication using your email and an encrypted password hash. Registered accounts enable personal authoring, private writing drafts, personal bookmark collections, and reading playlists. If you choose not to register, you can freely read public dispatches without an account.
            </p>
          </div>
        </section>

        {/* Comments & Literary Pseudonyms */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Feather className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Comments & Literary Pseudonyms</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Marrgin welcomes thoughtful discourse. To enable public commenting without demanding intrusive sign-ups or tracking your identity across the web, Marrgin generates a random visitor continuity token stored in your browser. When you submit a comment, our server computes a one-way SHA-256 cryptographic hash of that token to assign a literary pen name. Comments are stored strictly as sanitized plain text in Google Cloud Firestore.
            </p>
          </div>
        </section>

        {/* Visitor Analytics */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <BarChart3 className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">First-Party Visitor Analytics</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              We do not use third-party analytics trackers, behavioral profiling scripts, or advertising networks. We maintain an aggregate, first-party visit counter and piece reading counts directly in Firestore. We do not track individual user browsing trails across other websites.
            </p>
          </div>
        </section>

        {/* Cookies & Storage */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Database className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Cookies & Local Storage</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Marrgin does not deploy third-party tracking or advertising cookies. We rely strictly on standard browser local storage for functional purposes: maintaining your anonymous pseudonym token, reading preferences (such as Zen Mode and theme selection), and session storage for visit counting. In our Secret Vault, verses are encrypted client-side with your chosen passphrase; we never hold or store your vault passphrases on our servers.
            </p>
          </div>
        </section>

        {/* Third-Party & AI Integrations */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Sparkles className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Editorial AI Integrations</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Where AI tools are used within Marrgin—such as Hugging Face FLUX cover visualization and Google Gemini synthesis for specific investigative chapters like &ldquo;Beyond the Rain&rdquo;—all requests execute strictly server-side through authenticated API routes. No reader identity, personal information, or private drafts are provided to AI model providers.
            </p>
          </div>
        </section>

        {/* Data Protection & Ghanaian Law */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Scale className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Data Protection Rights (Act 843)</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Marrgin operates from Accra, Ghana, and complies with the Republic of Ghana Data Protection Act, 2012 (Act 843) and international data minimization standards. You have the right to request access to any personal information associated with your account, correct inaccurate data, or request permanent deletion of your account and writing.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Mail className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Editorial Contact</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300 mb-4">
              For inquiries regarding privacy, data rights, or editorial corrections, contact the founder and editor directly:
            </p>
            <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">
              Ebenezer Essel · Founder & Editor-in-Chief<br />
              Email: <a href="mailto:ebenezer.k.b.essel@gmail.com" className="text-amber-800 dark:text-amber-400 hover:underline">ebenezer.k.b.essel@gmail.com</a> / <a href="mailto:admin@marrgin.com" className="text-amber-800 dark:text-amber-400 hover:underline">admin@marrgin.com</a><br />
              Location: Accra, Ghana
            </p>
          </div>
        </section>
      </div>

      <div className="mt-32 text-center border-t border-gray-200 dark:border-gray-800 pt-16">
        <h3 className="font-serif text-2xl mb-4">Marrgin</h3>
        <p className="text-secondary text-sm font-sans">Different modes. One coherent publication.</p>
      </div>
    </div>
  );
}
