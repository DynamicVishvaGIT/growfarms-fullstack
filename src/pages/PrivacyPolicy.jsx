import { Mail, MapPin, Phone, Globe, Building2 } from "lucide-react";

import LegalPage from "../components/LegalPage";

/**
 * The policy text is reproduced word for word as supplied — only the layout
 * around it is ours. See LegalPage for the shape of a section.
 */
const SECTIONS = [
  {
    id: "introduction",
    title: "Introduction",
    blocks: [
      <>
        Welcome to Grow Farms (
        <a href="https://growfarms.co/" className="legal-link">
          https://growfarms.co/
        </a>
        ). We respect your privacy and are committed to protecting the personal
        information you share with us through our website.
      </>,
      "This Privacy Policy explains how we collect, use, store, and protect your personal information when you visit our website or contact us through our online forms.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    blocks: [
      "We may collect the following types of information:",
      {
        list: [
          [
            "Personal Information:",
            "Name, email address, phone number, and other details submitted through contact or enquiry forms.",
          ],
          [
            "Communication Information:",
            "Information you provide when contacting us for business enquiries or support.",
          ],
          [
            "Technical Information:",
            "IP address, browser type, device information, and website usage data, where collected.",
          ],
          [
            "Other Information:",
            "Any additional details you voluntarily provide through our website.",
          ],
        ],
      },
    ],
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    blocks: [
      "We may use the information collected for the following purposes:",
      {
        list: [
          "To respond to enquiries and requests.",
          "To provide information about our products and services.",
          "To communicate with users regarding their requests.",
          "To improve our website, content, and user experience.",
          "To maintain website security and prevent unauthorized activities.",
          "To comply with applicable legal and regulatory requirements.",
        ],
      },
    ],
  },
  {
    id: "sharing",
    title: "Sharing of Information",
    blocks: [
      "We do not sell or rent your personal information to third parties.",
      "We may share information with authorized service providers, such as website hosting, technical support, and communication service providers, where necessary to operate our website and provide our services.",
      "We may also disclose information when required by applicable law or a lawful request from relevant authorities.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies and Tracking Technologies",
    blocks: [
      "Our website may use cookies or similar technologies to improve functionality, understand website usage, and enhance the user experience.",
      "You can manage or disable cookies through your browser settings. Please note that disabling certain cookies may affect some website features.",
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    blocks: [
      "We take reasonable technical and organizational measures to protect personal information against unauthorized access, alteration, disclosure, or destruction.",
      "However, no method of transmitting or storing information electronically can be guaranteed to be completely secure.",
    ],
  },
  {
    id: "data-retention",
    title: "Data Retention",
    blocks: [
      "We retain personal information only for as long as necessary to fulfill the purposes described in this policy or to meet applicable legal and regulatory requirements.",
      "When information is no longer required, we take reasonable steps to delete or securely dispose of it.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Privacy Rights",
    blocks: [
      "Subject to applicable laws, you may request access to, correction of, or deletion of your personal information.",
      "You may also request that we stop sending promotional communications, where applicable.",
      "To submit a privacy-related request, please contact us using the details provided in the Contact Us section below.",
    ],
  },
  {
    id: "third-party-links",
    title: "Third-Party Links",
    blocks: [
      "Our website may contain links to third-party websites. We are not responsible for the privacy practices, content, or security of those external websites.",
      "We encourage users to review the privacy policies of any third-party websites they visit.",
    ],
  },
  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    blocks: [
      "We do not knowingly collect personal information from children in circumstances where parental or guardian consent is required by law without obtaining the necessary consent. If we become aware of improper collection, we will take reasonable steps to address it.",
    ],
  },
  {
    id: "changes",
    title: "Changes to This Privacy Policy",
    blocks: [
      "We reserve the right to update this Privacy Policy from time to time. Any changes will be published on this page along with the revised effective date.",
      "We encourage users to review this page periodically.",
    ],
  },
  {
    id: "contact-us",
    title: "Contact Us",
    blocks: [
      "If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your personal information, please contact us using the details below.",
      {
        details: [
          { icon: Building2, label: "Company Name:", value: "Grow Farms" },
          {
            icon: MapPin,
            label: "Address:",
            value:
              "305, The Landmark, Next to Hotel Three Star, Sector 7, Kharghar, Navi Mumbai, Maharashtra – 410210, India",
          },
          {
            icon: Mail,
            label: "Email:",
            value: "info@growfarms.co",
            href: "mailto:info@growfarms.co",
          },
          {
            icon: Phone,
            label: "Phone:",
            value: "+91 8955441144",
            href: "tel:+918955441144",
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

const PrivacyPolicy = () => <LegalPage title="Privacy Policy" sections={SECTIONS} />;

export default PrivacyPolicy;
