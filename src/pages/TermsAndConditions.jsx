import { Mail, MapPin, Phone, Globe, Building2 } from "lucide-react";

import LegalPage from "../components/LegalPage";

/**
 * The terms are reproduced word for word as supplied — only the layout around
 * them is ours. See LegalPage for the shape of a section.
 */
const SECTIONS = [
  {
    id: "introduction",
    title: "Introduction",
    blocks: [
      "Welcome to Grow Farms. These Terms and Conditions govern the use of our website and the information and services provided through it. By accessing our website or submitting an enquiry or booking application, you agree to these Terms and Conditions, subject to applicable laws.",
    ],
  },
  {
    id: "nature-of-booking",
    title: "Nature of Booking",
    blocks: [
      {
        clauses: [
          [
            "2.1.",
            "Any application submitted for the provisional booking of agricultural land or an NA plot in a project developed by Grow Farms, its Special Purpose Company (SPC), or its subsidiary shall be subject to company approval and the applicable booking terms.",
          ],
          [
            "2.2.",
            "Provisional booking shall be confirmed only after the applicant pays the stipulated booking amount, including the applicable advance payment and statutory taxes, as communicated by the company.",
          ],
          [
            "2.3.",
            "If the applicant fails to pay the stipulated amount within the specified time, the company reserves the right to reject or cancel the provisional booking application, subject to applicable laws and the agreed booking terms.",
          ],
          [
            "2.4.",
            "Submission of a booking application does not, by itself, constitute a transfer of ownership or confer any legal right over the land or plot. Such rights shall be governed by the executed agreements and applicable laws.",
          ],
        ],
      },
    ],
  },
  {
    id: "registration-charges",
    title: "Registration and Other Charges",
    blocks: [
      {
        clauses: [
          [
            "3.1.",
            "Registration charges, stamp duty, and other incidental expenses applicable at the time of registration shall be borne by the applicant, unless otherwise agreed in writing.",
          ],
          [
            "3.2.",
            "Applicable statutory taxes, government charges, and other legally payable fees shall be paid by the applicant as required under applicable laws.",
          ],
          [
            "3.3.",
            "Any additional charges applicable to the transaction shall be communicated to the applicant as per the applicable agreement and legal requirements.",
          ],
        ],
      },
    ],
  },
  {
    id: "mode-of-payment",
    title: "Mode of Payment",
    blocks: [
      {
        clauses: [
          [
            "4.1.",
            "Payments shall be made through authorized payment methods communicated by Grow Farms, such as demand drafts, cheques, NEFT, RTGS, or other approved banking channels.",
          ],
          [
            "4.2.",
            "Payments must be made only to the company or its officially authorized account. Grow Farms shall not be responsible for payments made to unauthorized agents, brokers, individuals, or third parties.",
          ],
          [
            "4.3.",
            "Applicants should obtain and retain an official payment receipt for every payment made.",
          ],
          [
            "4.4.",
            "Applicants are advised to verify the company's payment instructions before making any payment.",
          ],
        ],
      },
    ],
  },
  {
    id: "cancellation-refund",
    title: "Cancellation and Refund Policy",
    blocks: [
      {
        clauses: [
          [
            "5.1.",
            "If a provisional booking is cancelled or rejected, cancellation charges may apply as specified in the booking application or the executed agreement, subject to applicable laws.",
          ],
          [
            "5.2.",
            "As stated in the company's booking terms, cancellation charges may be up to 10% of the total booking amount or another applicable amount specified in the signed agreement. The applicable deduction shall be determined in accordance with the agreed terms and applicable law.",
          ],
          [
            "5.3.",
            "Eligible refunds shall be processed within the period specified in the applicable agreement. The company's booking document states that refunds are made within 90 days after completion of the required cancellation formalities.",
          ],
          [
            "5.4.",
            "Applicants should submit the necessary cancellation request and supporting documents to initiate the refund process.",
          ],
        ],
      },
    ],
  },
  {
    id: "documents-required",
    title: "Documents Required for Registration",
    blocks: [
      "Applicants may be required to provide the following documents, as applicable:",
      {
        list: [
          "Aadhaar Card",
          "PAN Card",
          "Farmer Certificate, where applicable",
          "Passport-size photograph",
          "Witness identity documents and photographs",
          "Any other documents required by the company or the relevant registration authority",
        ],
      },
    ],
  },
  {
    id: "applicant-responsibilities",
    title: "Applicant's Responsibilities",
    blocks: [
      {
        clauses: [
          [
            "7.1.",
            "Applicants must provide accurate, complete, and valid information and documents during the booking and registration process.",
          ],
          [
            "7.2.",
            "Applicants are responsible for reviewing the booking details, payment terms, applicable charges, and relevant agreements before making a payment.",
          ],
          [
            "7.3.",
            "Applicants should obtain official receipts and retain copies of all booking and payment documents.",
          ],
        ],
      },
    ],
  },
  {
    id: "land-plot-information",
    title: "Land and Plot Information",
    blocks: [
      {
        clauses: [
          [
            "8.1.",
            "Information displayed on the website regarding projects, agricultural land, or NA plots is intended to provide general information and may be updated from time to time.",
          ],
          [
            "8.2.",
            "Actual land details, permitted use, ownership, title, approvals, boundaries, and other legal matters must be verified through the relevant official records and transaction documents.",
          ],
          [
            "8.3.",
            "Any purchase or booking shall be subject to the applicable agreements, approvals, and laws. Nothing on the website should be treated as a substitute for the executed legal documents.",
          ],
        ],
      },
    ],
  },
  {
    id: "website-information",
    title: "Website Information",
    blocks: [
      "Grow Farms makes reasonable efforts to maintain accurate and up-to-date information on its website. However, project details, descriptions, availability, and other information may change. Users should confirm relevant details directly with the company before making any booking or payment.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    blocks: [
      "To the extent permitted by applicable law, Grow Farms shall not be liable for losses arising from inaccurate information supplied by users, payments made to unauthorized parties, or interruptions and technical issues affecting website access.",
      "Nothing in these Terms and Conditions excludes or limits any rights or liabilities that cannot legally be excluded or limited under applicable law.",
    ],
  },
  {
    id: "amendments",
    title: "Amendments",
    blocks: [
      "Grow Farms reserves the right to update these Terms and Conditions from time to time. Updated terms will be published on this website with the revised effective date. Changes shall apply subject to applicable law and any existing contractual obligations.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law and Jurisdiction",
    blocks: [
      "These Terms and Conditions shall be governed by the applicable laws of India. Any disputes shall be addressed by the competent courts or authorities having jurisdiction, subject to applicable law and the terms of the relevant agreement.",
    ],
  },
  {
    id: "contact-us",
    title: "Contact Us",
    blocks: [
      "For questions regarding these Terms and Conditions, bookings, payments, or cancellations, please contact:",
      {
        details: [
          { icon: Building2, label: "Company Name:", value: "Grow Farms" },
          {
            icon: MapPin,
            label: "Address:",
            value:
              "307, Growfarms, 3rd Floor, The Landmark, Sector 7, Kharghar, Navi Mumbai, Maharashtra – 410210, India",
          },
          {
            icon: Mail,
            label: "Email:",
            value: "growfarmsinfo@gmail.com",
            href: "mailto:growfarmsinfo@gmail.com",
          },
          {
            icon: Phone,
            label: "Phone:",
            value: "+91 7021 556 009",
            href: "tel:+917021556009",
          },
          {
            icon: Globe,
            label: "Website:",
            value: "https://growfarms.co/",
            href: "https://growfarms.co/",
          },
        ],
      },
    ],
  },
];

const TermsAndConditions = () => (
  <LegalPage title="Terms and Conditions" subtitle="Grow Farms" sections={SECTIONS} />
);

export default TermsAndConditions;
