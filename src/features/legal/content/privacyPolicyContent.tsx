/**
 * Privacy Policy Content
 *
 * The actual policy text as JSX components.
 * Update PRIVACY_POLICY_VERSION when content changes.
 */

export const PRIVACY_POLICY_VERSION = '2025-01-29';
export const PRIVACY_POLICY_LAST_UPDATED = 'January 29, 2025';

export function PrivacyPolicyContent() {
  return (
    <>
      <p className="text-muted-foreground">
        This privacy policy explains what information HSA Songbook
        (hsasongbook.com) collects, how we use it, and what choices you have.
        We've tried to keep this simple and readable.
      </p>

      <p className="text-sm text-muted-foreground italic">
        <strong>Important:</strong> This website is an independent passion
        project. It is not officially endorsed by, affiliated with, or sponsored
        by any church organization.
      </p>

      {/* The Short Version */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">The Short Version</h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>We collect only what we need (your email and username)</li>
          <li>We don't sell your data to anyone</li>
          <li>We don't use analytics or tracking tools</li>
          <li>
            We only email you for account stuff (password resets) or major
            policy updates
          </li>
          <li>You can delete your account anytime</li>
        </ul>
      </section>

      {/* 1. Information We Collect */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          1. Information We Collect
        </h2>

        <h3 className="text-lg font-medium mt-4 mb-2">
          Information you provide directly:
        </h3>

        <p className="font-medium mt-3 mb-1">When you create an account:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Email address (required)</li>
          <li>Username (required)</li>
        </ul>

        <p className="font-medium mt-3 mb-1">
          In the future, we may allow you to optionally add:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Display name</li>
          <li>Profile picture</li>
          <li>Bio</li>
          <li>Church location</li>
          <li>Social media links</li>
        </ul>

        <p className="text-muted-foreground mt-3">
          You're never required to provide optional information. Your account
          works fine without it.
        </p>

        <p className="font-medium mt-3 mb-1">When you use the site:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Songs, arrangements, and lyrics you upload</li>
          <li>Setlists you create</li>
          <li>Favorites you mark</li>
          <li>Groups you join or create</li>
        </ul>

        <h3 className="text-lg font-medium mt-4 mb-2">
          Information collected automatically:
        </h3>

        <p className="text-muted-foreground">
          <strong>Session cookies:</strong> When you log in, we store a small
          piece of data in your browser to keep you logged in. This is a
          "session cookie." It's deleted when you log out or after a period of
          inactivity. We don't use cookies for tracking or advertising.
        </p>

        <p className="text-muted-foreground mt-3">
          <strong>That's it.</strong> We don't use Google Analytics or any other
          analytics tools. We're not tracking your behavior around the site.
        </p>
      </section>

      {/* 2. How We Use Your Information */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          2. How We Use Your Information
        </h2>

        <p className="text-muted-foreground mb-2">
          We use your information to:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Create and manage your account</li>
          <li>Let you log in</li>
          <li>
            Display your username on content you upload (so others know who
            contributed it)
          </li>
          <li>Send you password reset emails when you request them</li>
          <li>
            Notify you of significant changes to our Terms of Use or Privacy
            Policy
          </li>
          <li>Respond if you contact us</li>
        </ul>

        <p className="font-medium mt-4 mb-2">We do NOT:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Sell your information to anyone</li>
          <li>Send marketing emails or newsletters</li>
          <li>
            Share your email address publicly (only your username is visible to
            other users)
          </li>
          <li>Track your browsing behavior</li>
          <li>Build advertising profiles</li>
        </ul>
      </section>

      {/* 3. Third-Party Services */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          3. Third-Party Services
        </h2>

        <p className="text-muted-foreground mb-4">
          We use a few services to run this site. Here's who they are and what
          they can access:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium">Service</th>
                <th className="text-left py-2 pr-4 font-medium">
                  What they do
                </th>
                <th className="text-left py-2 font-medium">
                  What they can access
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">Vercel</td>
                <td className="py-2 pr-4">Hosts the website</td>
                <td className="py-2">
                  Server logs (IP addresses, page requests)
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">Resend</td>
                <td className="py-2 pr-4">
                  Sends emails (password resets, etc.)
                </td>
                <td className="py-2">
                  Your email address when we send you something
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Ko-fi</td>
                <td className="py-2 pr-4">Donation platform (external link)</td>
                <td className="py-2">
                  Nothing from us — if you donate, that's between you and Ko-fi
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground mt-4">
          Each of these services has their own privacy policy. We encourage you
          to review them if you're curious:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2 mt-2">
          <li>
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Vercel Privacy Policy
            </a>
          </li>
          <li>
            <a
              href="https://resend.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Resend Privacy Policy
            </a>
          </li>
          <li>
            <a
              href="https://ko-fi.com/home/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Ko-fi Privacy Policy
            </a>
          </li>
        </ul>
      </section>

      {/* 4. Where Your Data Lives */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          4. Where Your Data Lives
        </h2>
        <p className="text-muted-foreground">
          Our site is hosted on Vercel's servers in the United States. By using
          HSA Songbook, you consent to your data being transferred to and stored
          in the US.
        </p>
      </section>

      {/* 5. Data Retention */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">5. Data Retention</h2>

        <p className="text-muted-foreground">
          <strong>Account information:</strong> We keep your email and username
          for as long as you have an account.
        </p>

        <p className="text-muted-foreground mt-3">
          <strong>Content you upload:</strong> Songs, arrangements, and setlists
          remain on the site until you delete them or delete your account (see
          below).
        </p>

        <p className="text-muted-foreground mt-3">
          <strong>Emails:</strong> We don't retain copies of transactional
          emails (like password resets) beyond what's necessary to send them.
        </p>
      </section>

      {/* 6. Your Choices & Rights */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          6. Your Choices & Rights
        </h2>

        <h3 className="text-lg font-medium mt-4 mb-2">Access your data</h3>
        <p className="text-muted-foreground">
          You can view your account information, uploaded content, and setlists
          anytime by logging into your account.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Update your data</h3>
        <p className="text-muted-foreground">
          You can update your email, username, or any optional profile
          information through your account settings.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Delete your data</h3>
        <p className="text-muted-foreground">
          You can delete individual songs, arrangements, or setlists at any
          time.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Delete your account</h3>
        <p className="text-muted-foreground">
          You can delete your entire account at any time. When you do, you'll
          have two options:
        </p>

        <p className="font-medium mt-3 mb-1">
          Option A: Delete my account but keep my contributions
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Your account is deleted</li>
          <li>Your uploaded content remains on the site</li>
          <li>
            Your contributions will be attributed to "Deleted User" or shown
            without a linked profile
          </li>
          <li>This helps preserve the community resource</li>
        </ul>

        <p className="font-medium mt-3 mb-1">
          Option B: Delete my account and all my content
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Your account is deleted</li>
          <li>All songs and arrangements you uploaded are deleted</li>
          <li>All setlists you created are deleted</li>
        </ul>

        <p className="text-muted-foreground mt-3">
          <strong>Please note:</strong> Even with Option B, the following may
          remain:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>
            Contributions you made to "Community" group songs (these are
            collaborative by nature)
          </li>
          <li>
            Duplicated arrangements that others created based on your work
            (these belong to the users who created them, though links back to
            your original will be removed)
          </li>
        </ul>

        <h3 className="text-lg font-medium mt-4 mb-2">Data portability</h3>
        <p className="text-muted-foreground">
          If you want a copy of your data, contact us and we'll provide what we
          have.
        </p>
      </section>

      {/* 7. Children's Privacy */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          7. Children's Privacy
        </h2>
        <p className="text-muted-foreground">
          HSA Songbook is intended for worship leaders and musicians who are at
          least 13 years old. We do not knowingly collect information from
          children under 13. If you believe a child under 13 has created an
          account, please contact us and we will delete it.
        </p>
      </section>

      {/* 8. Security */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">8. Security</h2>

        <p className="text-muted-foreground mb-2">
          We take reasonable steps to protect your information:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Passwords are hashed (we can't see them)</li>
          <li>We use HTTPS encryption</li>
          <li>We limit access to user data</li>
        </ul>

        <p className="text-muted-foreground mt-3">
          That said, no website is 100% secure. Please use a strong, unique
          password for your account.
        </p>
      </section>

      {/* 9. Changes to This Policy */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          9. Changes to This Policy
        </h2>

        <p className="text-muted-foreground mb-2">
          We may update this privacy policy from time to time. When we do:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>We'll update the "Last Updated" date at the top</li>
          <li>For significant changes, we'll notify you via email</li>
          <li>
            Continued use of the site after changes means you accept the new
            policy
          </li>
        </ul>
      </section>

      {/* 10. Contact Us */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p className="text-muted-foreground">
          Questions about this privacy policy or your data? Contact us at:
        </p>
        <p className="mt-2">
          <strong>Email:</strong>{' '}
          <a
            href="mailto:contact@hsasongbook.com"
            className="text-primary hover:underline"
          >
            contact@hsasongbook.com
          </a>
        </p>
      </section>

      {/* Quick Summary */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">Quick Summary</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium">Question</th>
                <th className="text-left py-2 font-medium">Answer</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b">
                <td className="py-2 pr-4">What do you collect?</td>
                <td className="py-2">
                  Email, username, and content you upload
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Do you sell my data?</td>
                <td className="py-2">No, never</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Do you use analytics/tracking?</td>
                <td className="py-2">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Will you spam me?</td>
                <td className="py-2">
                  No — only password resets and major policy updates
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Can I delete my account?</td>
                <td className="py-2">Yes, anytime</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Can I delete my content?</td>
                <td className="py-2">Yes, anytime</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Who hosts the site?</td>
                <td className="py-2">Vercel (US)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Who sends emails?</td>
                <td className="py-2">Resend</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-muted-foreground mt-8 pt-4 border-t">
        <strong>
          By creating an account or using HSA Songbook, you agree to this
          Privacy Policy.
        </strong>
      </p>
    </>
  );
}
