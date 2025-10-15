import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsDialogProps {
  children: React.ReactNode;
}

export const TermsDialog = ({ children }: TermsDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Please read our terms and conditions carefully.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <div>
              <p className="text-muted-foreground mb-4">
                <strong>Effective Date:</strong> [Insert Date]<br />
                <strong>Last Updated:</strong> [Insert Date]
              </p>
              <p>
                Welcome to [Your Website Name] ("we," "our," "us"). These Terms of Service ("Terms") govern your use of our website, services, and features (collectively, the "Platform"). By accessing or using the Platform, you agree to these Terms. If you do not agree, you may not use our Platform.
              </p>
            </div>

            <section>
              <h3 className="font-semibold text-base mb-2">1. Eligibility</h3>
              <p>You must be at least 18 years old, or the age of majority in your jurisdiction, to use the Platform. By using the Platform, you represent that you meet these requirements.</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. User Accounts</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You may need to create an account to submit reviews or add businesses.</li>
                <li>You are responsible for keeping your login details secure.</li>
                <li>You agree to provide accurate information when registering and to update it as needed.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. User-Generated Content</h3>
              <p className="mb-2">The Platform allows you to post reviews, ratings, comments, photos, and business listings ("Content"). By submitting Content, you agree that:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You are solely responsible for your Content.</li>
                <li>Your Content must be truthful, based on your genuine experience, and not misleading or defamatory.</li>
                <li>You own your Content, but you grant us a worldwide, non-exclusive, royalty-free license to use, display, reproduce, distribute, and promote it in connection with the Platform.</li>
                <li>You will not post Content that is unlawful, abusive, discriminatory, obscene, infringing, or otherwise harmful.</li>
                <li>We may remove or edit Content at our discretion.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Adding Businesses</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Users may submit businesses to be listed on the Platform.</li>
                <li>You must provide accurate information and may not create fake or misleading business profiles.</li>
                <li>Adding a business does not imply our endorsement or verification of that business.</li>
                <li>Businesses may contact us to correct or remove inaccurate listings.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Prohibited Conduct</h3>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Post false, defamatory, or fraudulent information.</li>
                <li>Submit reviews in exchange for payment or incentives without clear disclosure.</li>
                <li>Impersonate another person or business.</li>
                <li>Upload copyrighted material without permission.</li>
                <li>Use automated tools (bots, scrapers) to access the Platform.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Intellectual Property</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All trademarks, logos, and other content on the Platform (except user Content) belong to us or our licensors.</li>
                <li>You may not copy, distribute, or exploit our content without permission.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Privacy</h3>
              <p>Your use of the Platform is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal data.</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Notice & Takedown Process</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>If you believe Content or a business listing is false, harmful, or infringes your rights, you may notify us at [insert email/contact form].</li>
                <li>We will review and, if appropriate, remove or restrict the Content.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Disclaimers</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>We do not guarantee the accuracy, reliability, or completeness of any reviews or business listings.</li>
                <li>Reviews and ratings reflect the opinions of users, not our own views.</li>
                <li>The Platform is provided "as is" without warranties of any kind.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Limitation of Liability</h3>
              <p className="mb-2">To the fullest extent permitted by law:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>We are not liable for any damages arising from your use of the Platform or reliance on Content.</li>
                <li>Our total liability to you for any claims will not exceed [insert reasonable cap, e.g., $100].</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">11. Termination</h3>
              <p>We may suspend or terminate your account if you violate these Terms or if we believe your use of the Platform poses legal or security risks.</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">12. Governing Law</h3>
              <p>These Terms are governed by the laws of [Insert Country/State]. Any disputes will be handled exclusively in the courts of [Insert Jurisdiction].</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">13. Changes to Terms</h3>
              <p>We may update these Terms from time to time. Continued use of the Platform after changes means you accept the updated Terms.</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};