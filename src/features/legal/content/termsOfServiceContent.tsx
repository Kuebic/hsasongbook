/**
 * Terms of Service Content
 *
 * The actual ToS text as JSX components.
 * Update TERMS_VERSION when content changes.
 */

export const TERMS_VERSION = '2025-01-29';
export const TERMS_LAST_UPDATED = 'January 29, 2025';

export function TermsOfServiceContent() {
  return (
    <>
      <p className="text-muted-foreground">
        Welcome to HSA Songbook (hsasongbook.com). This is a community resource
        for sharing worship songs, chord charts, and arrangements within the
        Unificationist community. By using this site, you agree to these terms.
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
          <li>Be honest about what you upload</li>
          <li>Only upload content you have the right to share</li>
          <li>Don't steal other people's work</li>
          <li>Be respectful</li>
          <li>We can remove content or ban users who break these rules</li>
        </ul>
      </section>

      {/* 1. What This Site Is */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">1. What This Site Is</h2>

        <p className="text-muted-foreground mb-2">
          HSA Songbook is a free platform where users can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Upload and share song lyrics, chord charts, and arrangements</li>
          <li>Create and share setlists</li>
          <li>
            Browse and use content shared by others for worship purposes
          </li>
          <li>Contribute to groups (like "LA Band" or "Community")</li>
          <li>Favorite arrangements and discover popular versions</li>
        </ul>

        <p className="text-muted-foreground mt-3">
          This site is provided free of charge. There are no ads, fees, or
          premium features. Donations are welcomed but never required.
        </p>
      </section>

      {/* 2. Who Can Use This Site */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          2. Who Can Use This Site
        </h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>You must be at least 13 years old to create an account</li>
          <li>You need a valid email address to register</li>
          <li>Anyone can view public content without an account</li>
          <li>
            You need an account to upload songs, create arrangements, make
            setlists, or favorite content
          </li>
        </ul>
      </section>

      {/* 3. Your Account */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">3. Your Account</h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>You're responsible for keeping your login information secure</li>
          <li>You're responsible for all activity under your account</li>
          <li>
            Use your real name or a recognizable username—this is a community,
            not an anonymous forum
          </li>
          <li>One account per person, please</li>
        </ul>
      </section>

      {/* 4. What You Can Upload */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          4. What You Can Upload
        </h2>

        <p className="font-medium mt-3 mb-2">You may upload:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Original songs and arrangements you created</li>
          <li>
            Traditional hymns and songs in the public domain (generally 70+
            years old)
          </li>
          <li>Content you have explicit permission to share</li>
          <li>
            Your own arrangements of songs, with proper attribution to the
            original
          </li>
        </ul>

        <p className="font-medium mt-4 mb-2">You may NOT upload:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>
            Copyrighted songs without permission from the copyright holder
          </li>
          <li>Content that isn't yours while claiming it is</li>
          <li>Anything illegal, harmful, hateful, or inappropriate</li>
          <li>Spam or advertisements</li>
        </ul>
      </section>

      {/* 5. When You Upload Content */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          5. When You Upload Content
        </h2>

        <p className="text-muted-foreground mb-3">
          By uploading content to HSA Songbook, you agree that:
        </p>

        <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
          <li>
            <strong>You have the right to share it.</strong> Either you created
            it, it's in the public domain, or you have permission from whoever
            owns it.
          </li>
          <li>
            <strong>
              You're granting other users permission to use it for worship.
            </strong>{' '}
            This means other users can view your content, use it in their church
            services, print it out for their worship team, and include it in
            their setlists.
          </li>
          <li>
            <strong>You're NOT giving away ownership.</strong> You still own
            your original work. You're just letting the community use it for
            worship purposes.
          </li>
          <li>
            <strong>
              Others cannot republish your work elsewhere or claim it as their
              own.
            </strong>{' '}
            Using it at church is fine. Uploading it to another website or
            publishing it in a songbook without your permission is not.
          </li>
          <li>
            <strong>
              You allow others to duplicate and modify your arrangements.
            </strong>{' '}
            If someone loves your arrangement but wants to tweak a few chords
            for their setting, that's allowed. Duplicated arrangements will link
            back to your original.
          </li>
        </ol>
      </section>

      {/* 6. The "Community" Group */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          6. The "Community" Group
        </h2>

        <p className="text-muted-foreground mb-3">
          Some traditional songs have unknown origins or have been passed down
          through generations with no clear author. The "Community" group exists
          for these songs. Content in the Community group:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Can be edited and improved by any registered user</li>
          <li>Has no single owner</li>
          <li>Should include source information when known</li>
          <li>Is meant to preserve and document our shared musical heritage</li>
        </ul>
      </section>

      {/* 7. Copyright & DMCA */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">7. Copyright & DMCA</h2>

        <p className="text-muted-foreground">
          <strong>We respect copyright.</strong> We also expect you to.
        </p>

        <p className="text-muted-foreground mt-3">
          If you believe something on this site infringes your copyright, please
          contact us with:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2 mt-2">
          <li>Your contact information</li>
          <li>A description of the copyrighted work</li>
          <li>The URL of the infringing content on our site</li>
          <li>
            A statement that you believe in good faith the use is not authorized
          </li>
          <li>
            A statement that your information is accurate and you are the
            copyright owner (or authorized to act on their behalf)
          </li>
        </ul>

        <p className="text-muted-foreground mt-3">
          Send copyright notices to:{' '}
          <a
            href="mailto:contact@hsasongbook.com"
            className="text-primary hover:underline"
          >
            contact@hsasongbook.com
          </a>
        </p>

        <p className="font-medium mt-4 mb-2">
          What happens when we receive a valid notice:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>We will remove or disable access to the content</li>
          <li>We will notify the user who uploaded it</li>
          <li>Repeat offenders will have their accounts terminated</li>
        </ul>

        <p className="text-muted-foreground mt-3">
          <strong>We are a platform, not a publisher.</strong> We don't review
          every upload before it goes live. We rely on our community to act in
          good faith and will respond promptly to valid copyright concerns.
        </p>
      </section>

      {/* 8. What We Can Do */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">8. What We Can Do</h2>

        <p className="text-muted-foreground mb-2">We reserve the right to:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>Remove any content for any reason, with or without notice</li>
          <li>Suspend or terminate any account that violates these terms</li>
          <li>Modify or discontinue the site at any time</li>
          <li>Update these terms (we'll notify users of significant changes)</li>
        </ul>

        <p className="text-muted-foreground mt-3">
          We don't have to, but we may monitor content and enforce these terms
          at our discretion.
        </p>
      </section>

      {/* 9. What We Don't Do */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">9. What We Don't Do</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            <strong>We don't guarantee the site will always be available.</strong>{' '}
            This is a passion project, not a commercial service.
          </li>
          <li>
            <strong>We don't verify the accuracy of uploaded content.</strong>{' '}
            If someone posts wrong chords, that's on them.
          </li>
          <li>
            <strong>We don't provide legal advice.</strong> If you're unsure
            whether you can upload something, consult a lawyer or err on the
            side of caution.
          </li>
          <li>
            <strong>We don't endorse user content.</strong> Just because
            something is on the site doesn't mean we agree with it or verify its
            quality.
          </li>
        </ul>
      </section>

      {/* 10. Limitation of Liability */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          10. Limitation of Liability
        </h2>

        <p className="text-muted-foreground mb-2">
          To the maximum extent permitted by law:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>
            HSA Songbook is provided "as is" without warranties of any kind
          </li>
          <li>
            We are not liable for any damages arising from your use of the site
          </li>
          <li>We are not liable for content uploaded by users</li>
          <li>We are not liable for copyright infringement by users</li>
        </ul>

        <p className="text-muted-foreground mt-3">
          <strong>In plain English:</strong> This is a free community resource
          run by a volunteer. If something goes wrong, we'll do our best to fix
          it, but we can't be held legally responsible for everything that
          happens on a platform with user-generated content.
        </p>
      </section>

      {/* 11. Disputes */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">11. Disputes</h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>
            These terms are governed by the laws of the State of Minnesota, USA
          </li>
          <li>Any disputes will be resolved in the courts of Minnesota</li>
          <li>
            You agree to attempt informal resolution before filing any legal
            action
          </li>
        </ul>
      </section>

      {/* 12. Changes to These Terms */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          12. Changes to These Terms
        </h2>

        <p className="text-muted-foreground mb-2">
          We may update these terms from time to time. When we do:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
          <li>We'll update the "Last Updated" date at the top</li>
          <li>
            For significant changes, we'll notify users via email or a site
            announcement
          </li>
          <li>
            Continued use of the site after changes means you accept the new
            terms
          </li>
        </ul>
      </section>

      {/* 13. Contact */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">13. Contact</h2>
        <p className="text-muted-foreground">
          Questions about these terms? Contact us at:{' '}
          <a
            href="mailto:contact@hsasongbook.com"
            className="text-primary hover:underline"
          >
            contact@hsasongbook.com
          </a>
        </p>
      </section>

      {/* Quick Reference */}
      <section>
        <h2 className="text-xl font-semibold mt-8 mb-4">
          Quick Reference: Can I Upload This?
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium">
                  Type of Content
                </th>
                <th className="text-left py-2 font-medium">Can I Upload It?</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b">
                <td className="py-2 pr-4">A song I wrote myself</td>
                <td className="py-2 text-green-600">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  My chord arrangement of a public domain hymn
                </td>
                <td className="py-2 text-green-600">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  A song my friend wrote (with their permission)
                </td>
                <td className="py-2 text-green-600">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  A song from the 1950s holy song collection
                </td>
                <td className="py-2 text-green-600">Yes (public domain)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  A popular contemporary Christian song
                </td>
                <td className="py-2 text-red-600">
                  No (unless you have permission)
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  Someone else's arrangement from another website
                </td>
                <td className="py-2 text-red-600">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  A song I heard at camp but don't know who wrote it
                </td>
                <td className="py-2 text-yellow-600">
                  Maybe (use Community group, note the uncertainty)
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  Lyrics I found online with no author listed
                </td>
                <td className="py-2 text-yellow-600">
                  Research first, ask if unsure
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-muted-foreground mt-8 pt-4 border-t">
        <strong>
          By creating an account or using HSA Songbook, you agree to these Terms
          of Use.
        </strong>
      </p>

      <p className="text-muted-foreground mt-2 italic">
        Thank you for being part of this community and helping preserve and
        share our musical heritage.
      </p>
    </>
  );
}
