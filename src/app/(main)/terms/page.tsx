import type { Metadata } from "next";
import { BookOpen, ShieldCheck, Feather, AlertCircle, RefreshCw, Scale, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms & Conditions for Marrgin: editorial standards, author copyright ownership, community comment guidelines, and governing law.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms & Conditions | Marrgin",
    description: "The compact between writer, reader, and publication.",
    url: "https://marrgin.com/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="py-24 px-8 max-w-[800px] mx-auto min-h-screen">
      <div className="text-center mb-24">
        <h1 className="font-serif text-6xl mb-6">Terms & Conditions</h1>
        <p className="text-xl text-secondary max-w-lg mx-auto font-poem italic">
          &ldquo;The compact between writer, reader, and publication.&rdquo;
        </p>
        <p className="text-xs text-neutral-400 font-mono mt-4 uppercase tracking-widest">
          Effective Date: September 2026 · Accra, Ghana
        </p>
      </div>

      <div className="space-y-24">
        {/* The Publication & Charter */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <BookOpen className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">The Publication & Charter</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Marrgin is an independent publication observing Ghana through poetry, essays, investigative journalism, and data stories. By visiting, reading, or submitting writing to Marrgin, you agree to these Terms and our Privacy Policy. All editorial discretion, curation, and final publishing decisions reside with the editor-in-chief.
            </p>
          </div>
        </section>

        {/* Intellectual Property & Author Ownership */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Feather className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Author Ownership & Permissions</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Your words are yours. Authors retain full copyright ownership of their original poems, essays, and writing created on Marrgin. By publishing a piece on Marrgin, you grant Marrgin a non-exclusive, worldwide license to display, index, format, and archive the work on our platform. You retain the right to unpublish, edit, or archive your work at any time through your author workspace.
            </p>
          </div>
        </section>

        {/* Community Standards & Comments */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <ShieldCheck className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Community Standards & Comments</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Marrgin provides a space for thoughtful commentary through pseudonymous marginalia. Commenters must engage respectfully. We do not tolerate hate speech, defamation, harassment, commercial solicitation, malicious code, automated scraping, or coordinated spam.
            </p>
          </div>
        </section>

        {/* Moderation & Unpublishing */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <AlertCircle className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Editorial Moderation & Removal</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              To protect the integrity of the platform, the editor reserves the right to moderate, hide, or permanently remove comments or content that violate our community standards or legal requirements. Rate limiting and bot safeguards are applied automatically across public forms.
            </p>
          </div>
        </section>

        {/* Factual Accuracy & Corrections */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <RefreshCw className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Factual Precision & Corrections</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Marrgin holds its investigative reporting and data stories to strict evidentiary standards. If a factual error is discovered in a published dispatch, Marrgin promptly issues a transparent correction or updates the methodology notice attached to the piece.
            </p>
          </div>
        </section>

        {/* Limitation of Responsibility */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Globe className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Service Continuity & Disclaimer</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              Marrgin is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. While we make every effort to preserve the sanctuary and security of the publication, Marrgin is not liable for temporary service interruptions or accidental data loss beyond our reasonable control.
            </p>
          </div>
        </section>

        {/* Governing Law */}
        <section className="flex flex-col md:flex-row gap-12 items-start">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-2">
            <Scale className="text-accent" size={28} />
          </div>
          <div>
            <h2 className="font-serif text-4xl mb-6">Governing Law</h2>
            <p className="font-poem text-xl leading-loose text-gray-700 dark:text-gray-300">
              These Terms & Conditions are governed by and construed in accordance with the laws of the Republic of Ghana. Any disputes arising in connection with Marrgin shall be resolved subject to the jurisdiction of Ghanaian courts.
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
