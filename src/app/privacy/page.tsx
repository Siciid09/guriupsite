import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | ArdayCaawiye",
  description:
    "Privacy Policy for the ArdayCaawiye educational mobile application.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 5, 2026";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        {/* Header */}
        <div className="mb-10 border-b border-gray-200 pb-8">
          <div className="mb-4 inline-flex rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
            ArdayCaawiye
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>

          <p className="mt-4 text-gray-600">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="space-y-10 leading-7 text-gray-700">
          {/* Introduction */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              1. Introduction
            </h2>

            <p>
              ArdayCaawiye is an educational application designed to help
              students access learning materials, past examinations, quizzes,
              lessons, educational videos, and other study resources.
            </p>

            <p className="mt-3">
              This Privacy Policy explains how ArdayCaawiye collects, uses,
              stores, and protects information when you use our mobile
              application and related services.
            </p>
          </section>

          {/* Information collected */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              2. Information We Collect
            </h2>

            <p>
              Depending on the features you use, ArdayCaawiye may collect
              limited information necessary to provide and improve the
              application.
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Account information:</strong> such as your name or
                email address if you create an account.
              </li>

              <li>
                <strong>Educational activity:</strong> such as quiz progress,
                completed lessons, examination activity, and learning progress.
              </li>

              <li>
                <strong>Device and technical information:</strong> such as app
                version, device type, operating system, crash information, and
                general diagnostic data.
              </li>

              <li>
                <strong>User-submitted information:</strong> information you
                voluntarily provide through supported features of the app.
              </li>
            </ul>
          </section>

          {/* How data used */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              3. How We Use Information
            </h2>

            <p>Information may be used to:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Provide and maintain ArdayCaawiye services.</li>
              <li>Save learning progress and app preferences.</li>
              <li>Provide quizzes, exams, lessons, and educational content.</li>
              <li>Improve application performance and reliability.</li>
              <li>Detect and fix technical problems.</li>
              <li>Provide support when users contact us.</li>
              <li>Protect the security and integrity of our services.</li>
            </ul>
          </section>

          {/* Permissions */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              4. Device Permissions
            </h2>

            <p>
              ArdayCaawiye may request certain device permissions when required
              by a specific feature. Permissions are only requested when
              necessary for that feature to function.
            </p>

            <p className="mt-3">
              You can manage application permissions through your device
              settings.
            </p>
          </section>

          {/* Third-party */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              5. Third-Party Services
            </h2>

            <p>
              ArdayCaawiye may use trusted third-party technology providers for
              services such as authentication, database hosting, file storage,
              crash reporting, analytics, notifications, or application
              infrastructure.
            </p>

            <p className="mt-3">
              These providers may process limited information according to
              their own privacy policies and applicable data-protection
              requirements.
            </p>
          </section>

          {/* Data sharing */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              6. Sharing of Information
            </h2>

            <p>
              We do not sell users&apos; personal information.
            </p>

            <p className="mt-3">
              Information may only be shared with service providers where
              necessary to operate the application, comply with legal
              obligations, protect users, prevent fraud, or maintain the
              security of our services.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              7. Data Security
            </h2>

            <p>
              We take reasonable technical and organizational measures to
              protect information against unauthorized access, disclosure,
              alteration, loss, or misuse.
            </p>

            <p className="mt-3">
              However, no internet-based or electronic storage system can
              guarantee absolute security.
            </p>
          </section>

          {/* Retention */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              8. Data Retention
            </h2>

            <p>
              We retain personal information only for as long as reasonably
              necessary to provide the application's services, meet legal
              requirements, resolve disputes, and maintain security.
            </p>
          </section>

          {/* Deletion */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              9. Account and Data Deletion
            </h2>

            <p>
              Users may request deletion of their account and associated
              personal information by contacting ArdayCaawiye using the contact
              information provided below.
            </p>

            <p className="mt-3">
              Certain information may be retained when required for legitimate
              legal, security, fraud-prevention, or regulatory purposes.
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              10. Children's Privacy
            </h2>

            <p>
              ArdayCaawiye is an educational platform that may be used by
              students, including younger users. We aim to collect only the
              information necessary to provide educational functionality and
              to handle such information responsibly.
            </p>

            <p className="mt-3">
              We do not knowingly use personal information from children for
              behavioral advertising or sell their personal information.
            </p>

            <p className="mt-3">
              Parents or guardians who believe that a child has provided
              personal information that should be reviewed or deleted may
              contact us using the details below.
            </p>
          </section>

          {/* External links */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              11. External Links and Educational Content
            </h2>

            <p>
              ArdayCaawiye may provide links to external educational resources
              or third-party websites. We are not responsible for the privacy
              practices or content of third-party websites and services.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              12. Changes to This Privacy Policy
            </h2>

            <p>
              We may update this Privacy Policy when our services, technology,
              or legal requirements change. Updates will be published on this
              page and the &quot;Last updated&quot; date will be changed
              accordingly.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              13. Contact Us
            </h2>

            <p>
              If you have questions, concerns, or requests regarding this
              Privacy Policy or your information, contact:
            </p>

            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-gray-900">ArdayCaawiye</p>

              <p className="mt-2">
                Email:{" "}
                <a
                  href="mailto:support@ardaycaawiye.com"
                  className="font-medium text-green-700 hover:underline"
                >
                  support@ardaycaawiye.com
                </a>
              </p>

              <p className="mt-1">
                Website:{" "}
                <a
                  href="https://ardaycaawiye.com"
                  className="font-medium text-green-700 hover:underline"
                >
                  ardaycaawiye.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-14 border-t border-gray-200 pt-7 text-sm text-gray-500">
          © {new Date().getFullYear()} ArdayCaawiye. All rights reserved.
        </footer>
      </div>
    </main>
  );
}