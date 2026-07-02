import { Accordion } from "../shyft";
import { SwiftBreakdown } from "./SwiftBreakdown";

export function InfoSections() {
  return (
    <>
      <section className="info-section" id="what-is-swift">
        <div className="info-section__inner">
          <h2>What is a SWIFT / BIC code?</h2>
          <p>
            A SWIFT code — also called a BIC (Bank Identifier Code) — identifies a specific bank
            during international transactions. It's how banks around the world know exactly where
            to send your money. Every code is 8 or 11 characters long and breaks down like this:
          </p>
          <div className="info-section__example">
            <SwiftBreakdown swift="CITIUS33XXX" />
          </div>
          <div className="info-grid">
            <div className="info-grid__item">
              <h3>Bank code</h3>
              <p>4 letters that look like a shortened version of the bank's name.</p>
            </div>
            <div className="info-grid__item">
              <h3>Country code</h3>
              <p>2 letters saying which country the bank is in — US, GB, DE and so on.</p>
            </div>
            <div className="info-grid__item">
              <h3>Location code</h3>
              <p>2 characters pointing to the bank's head office location.</p>
            </div>
            <div className="info-grid__item">
              <h3>Branch code</h3>
              <p>3 optional characters for a specific branch. "XXX" means the head office.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="info-section info-section--alt" id="swift-vs-iban">
        <div className="info-section__inner">
          <h2>SWIFT vs IBAN — what's the difference?</h2>
          <p>
            Both are used for international payments, but they answer different questions: a SWIFT
            code identifies <strong>the bank</strong>, while an IBAN identifies{" "}
            <strong>the individual account</strong> at that bank. For many international transfers
            — especially to Europe — you'll need both.
          </p>
        </div>
      </section>

      <section className="info-section" id="faq">
        <div className="info-section__inner">
          <h2>Frequently asked questions</h2>
          <Accordion title="Where do I find my SWIFT code?">
            <p>
              It's usually on your bank statement, in your online banking app, or on your bank's
              website. You can also verify a code someone gave you using the lookup above.
            </p>
          </Accordion>
          <Accordion title="Are SWIFT and BIC the same thing?">
            <p>
              Yes — SWIFT code and BIC (Bank Identifier Code) are two names for the same 8–11
              character identifier. Some banks call it a SWIFT BIC or SWIFT ID.
            </p>
          </Accordion>
          <Accordion title="What happens if I use the wrong SWIFT code?">
            <p>
              The payment can be delayed, rejected, or in the worst case routed to the wrong bank.
              Banks often charge fees for failed transfers, so it's worth verifying the code before
              you send anything.
            </p>
          </Accordion>
          <Accordion title="Does a valid IBAN mean the account exists?">
            <p>
              No. Validation confirms the country format and checksum are correct, which catches
              typos — but it can't confirm the account is open or belongs to the right person.
              Always double-check with the recipient.
            </p>
          </Accordion>
          <Accordion title="Do US bank accounts have IBANs?">
            <p>
              No — the United States doesn't use IBANs. For transfers to the US you'll typically
              need the bank's SWIFT code plus the account number and an ABA routing number.
            </p>
          </Accordion>
        </div>
      </section>
    </>
  );
}
