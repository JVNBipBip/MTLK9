/**
 * The footer's link columns. Labels are owner-editable from the Website
 * editor's side list (footer.links.<column>.<n>); fields.test.ts checks the
 * registry still matches this list.
 */
export const footerLinks = {
  training: [
    { label: { en: "Day Training", fr: "Entraînement de jour" }, href: "/day-training" },
    { label: { en: "Daycare", fr: "Garderie" }, href: "/daycare" },
    { label: { en: "Grooming · MTL Canine Spa", fr: "Toilettage · MTL Canine Spa" }, href: "/grooming" },
    { label: { en: "Trainer Apprenticeships", fr: "Apprentissage pour entraîneurs" }, href: "/apprenticeships" },
    { label: { en: "Save 30% on Your Training", fr: "Économisez 30 % sur l’entraînement" }, href: "/training-offer" },
    { label: { en: "Consultation", fr: "Consultation" }, href: "/services/consultation" },
    { label: { en: "Reactivity Training", fr: "Réactivité" }, href: "/services/reactivity" },
    { label: { en: "Aggressive Dog Training", fr: "Chien agressif" }, href: "/services/aggression" },
    { label: { en: "Separation Anxiety", fr: "Anxiété de séparation" }, href: "/services/separation-anxiety" },
    { label: { en: "Private Classes", fr: "Cours privés" }, href: "/services/private-classes" },
    { label: { en: "Obedience Training", fr: "Obéissance" }, href: "/services/obedience" },
    { label: { en: "Puppy Training", fr: "Chiots" }, href: "/services/puppy-training" },
    { label: { en: "In-Home Training", fr: "À domicile" }, href: "/services/in-home" },
    { label: { en: "West Island Dog Training", fr: "Dressage Ouest-de-l'Île" }, href: "/dog-training-west-island" },
  ],
  company: [
    { label: { en: "About Us", fr: "À propos" }, href: "/about" },
    { label: { en: "Results", fr: "Résultats" }, href: "/results" },
    { label: { en: "FAQ", fr: "FAQ" }, href: "/faq" },
    { label: { en: "Contact", fr: "Contact" }, href: "/booking" },
  ],
  resources: [
    { label: { en: "Contact Us for a Free Call", fr: "Appel découverte gratuit" }, href: "/booking" },
    { label: { en: "Book an Evaluation", fr: "Réserver une évaluation" }, href: "/booking" },
    { label: { en: "Google Reviews", fr: "Avis Google" }, href: "https://maps.app.goo.gl/GoTny9wRbvZ1Y81fA" },
  ],
}
