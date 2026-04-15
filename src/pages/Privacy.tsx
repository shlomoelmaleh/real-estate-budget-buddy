import { useOptionalLanguage } from "@/contexts/LanguageContext";
import { useOptionalPartner } from "@/contexts/PartnerContext";

const LAST_UPDATED = "אפריל 2026";
const LAST_UPDATED_EN = "April 2026";
const LAST_UPDATED_FR = "Avril 2026";

export default function Privacy() {
  const langCtx = useOptionalLanguage();
  const partnerCtx = useOptionalPartner();
  const language = langCtx?.language ?? "he";
  const partnerName = partnerCtx?.partner?.name ?? "אשל פיננסים";
  const partnerEmail = partnerCtx?.partner?.email ?? "shlomo.elmaleh@gmail.com";

  const isRTL = language === "he";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 py-12 px-4"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12 space-y-8">

        {/* Back link */}
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2"
        >
          {language === "he" ? "← חזרה לכלי" : language === "fr" ? "← Retour" : "← Back"}
        </a>

        {language === "he" && (
          <>
            <h1 className="text-3xl font-black text-slate-900">מדיניות פרטיות</h1>
            <p className="text-sm text-slate-400">עודכן לאחרונה: {LAST_UPDATED}</p>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">1. מי אנחנו</h2>
              <p className="text-slate-600 leading-relaxed">
                {partnerName} מפעיל כלי סימולציה לתכנון תקציב רכישת נדל"ן. כלי זה מסייע למשתמשים לחשב את תקציב הרכישה המשוער שלהם ולקבל דו"ח פיננסי מפורט.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">2. המידע שאנו אוספים</h2>
              <ul className="list-disc list-inside text-slate-600 leading-relaxed space-y-1">
                <li>שם מלא, כתובת דוא"ל ומספר טלפון</li>
                <li>נתונים פיננסיים שהוזנו בסימולטור (הכנסה, הון עצמי, גיל)</li>
                <li>תוצאות חישוב התקציב שנוצרו על ידי הכלי</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                המידע נאסף אך ורק כאשר המשתמש בוחר לשלוח את הדו"ח ומאשר זאת באופן מפורש.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">3. כיצד אנו משתמשים במידע</h2>
              <ul className="list-disc list-inside text-slate-600 leading-relaxed space-y-1">
                <li>שליחת הדו"ח הפיננסי לכתובת הדוא"ל שסופקה</li>
                <li>העברת הפרטים ליועץ מקצועי מטעם {partnerName} לצורך בדיקת התיק ויצירת קשר</li>
                <li>שמירת נתוני הסימולציה לצרכים תפעוליים ושיפור השירות</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">4. שיתוף המידע עם צדדים שלישיים</h2>
              <p className="text-slate-600 leading-relaxed">
                המידע שלך לא יימכר לצדדים שלישיים. הוא יועבר אך ורק ליועצים מקצועיים הפועלים מטעם {partnerName} לצורך מתן שירות ישיר ללקוח, ולספקי טכנולוגיה הדרושים להפעלת השירות (כגון שירותי שליחת דוא"ל).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">5. אחסון ואבטחת מידע</h2>
              <p className="text-slate-600 leading-relaxed">
                המידע מאוחסן בענן מאובטח המנוהל על ידי פלטפורמת Lovable. אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע האישי בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), תשע"ז-2017.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">6. זכויות המשתמש</h2>
              <p className="text-slate-600 leading-relaxed">
                בהתאם לחוק הגנת הפרטיות, תשמ"א-1981, יש לך זכות לעיין במידע שנאסף עליך, לתקנו, ולבקש את מחיקתו. לפנייה בנושא יש לפנות אל:{" "}
                <a href={`mailto:${partnerEmail}`} className="text-primary underline">{partnerEmail}</a>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">7. קשר</h2>
              <p className="text-slate-600 leading-relaxed">
                לכל שאלה הנוגעת למדיניות הפרטיות ניתן לפנות אל {partnerName} בכתובת:{" "}
                <a href={`mailto:${partnerEmail}`} className="text-primary underline">{partnerEmail}</a>
              </p>
            </section>
          </>
        )}

        {language === "en" && (
          <>
            <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
            <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED_EN}</p>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">1. Who We Are</h2>
              <p className="text-slate-600 leading-relaxed">
                {partnerName} operates a real estate budget simulation tool that helps users estimate their purchasing budget and receive a detailed financial report.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">2. Information We Collect</h2>
              <ul className="list-disc list-inside text-slate-600 leading-relaxed space-y-1">
                <li>Full name, email address, and phone number</li>
                <li>Financial data entered into the simulator (income, equity, age)</li>
                <li>Budget calculation results generated by the tool</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                Data is collected only when the user explicitly chooses to submit the report and provides their consent.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-slate-600 leading-relaxed space-y-1">
                <li>Sending the financial report to the provided email address</li>
                <li>Forwarding details to a professional advisor at {partnerName} for file review and follow-up</li>
                <li>Storing simulation data for operational purposes and service improvement</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">4. Sharing with Third Parties</h2>
              <p className="text-slate-600 leading-relaxed">
                Your data will never be sold to third parties. It will only be shared with professional advisors acting on behalf of {partnerName} for direct client service, and with technology providers required to operate the service (such as email delivery services).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">5. Data Storage and Security</h2>
              <p className="text-slate-600 leading-relaxed">
                Data is stored on a secure cloud managed by the Lovable platform. We apply reasonable security measures to protect personal information in accordance with applicable Israeli privacy regulations.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">6. Your Rights</h2>
              <p className="text-slate-600 leading-relaxed">
                You have the right to access, correct, or request deletion of the personal data we hold about you. To exercise these rights, please contact:{" "}
                <a href={`mailto:${partnerEmail}`} className="text-primary underline">{partnerEmail}</a>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">7. Contact</h2>
              <p className="text-slate-600 leading-relaxed">
                For any questions regarding this privacy policy, contact {partnerName} at:{" "}
                <a href={`mailto:${partnerEmail}`} className="text-primary underline">{partnerEmail}</a>
              </p>
            </section>
          </>
        )}

        {language === "fr" && (
          <>
            <h1 className="text-3xl font-black text-slate-900">Politique de confidentialité</h1>
            <p className="text-sm text-slate-400">Dernière mise à jour : {LAST_UPDATED_FR}</p>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">1. Qui sommes-nous</h2>
              <p className="text-slate-600 leading-relaxed">
                {partnerName} exploite un outil de simulation budgétaire pour l'achat immobilier, qui aide les utilisateurs à estimer leur budget d'acquisition et à recevoir un rapport financier détaillé.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">2. Informations collectées</h2>
              <ul className="list-disc list-inside text-slate-600 leading-relaxed space-y-1">
                <li>Nom complet, adresse e-mail et numéro de téléphone</li>
                <li>Données financières saisies dans le simulateur (revenus, apport personnel, âge)</li>
                <li>Résultats de calcul budgétaire générés par l'outil</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                Les données ne sont collectées que lorsque l'utilisateur choisit explicitement d'envoyer le rapport et donne son consentement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">3. Utilisation des données</h2>
              <ul className="list-disc list-inside text-slate-600 leading-relaxed space-y-1">
                <li>Envoi du rapport financier à l'adresse e-mail fournie</li>
                <li>Transmission des coordonnées à un conseiller professionnel de {partnerName} pour l'examen du dossier</li>
                <li>Conservation des données de simulation à des fins opérationnelles</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">4. Partage avec des tiers</h2>
              <p className="text-slate-600 leading-relaxed">
                Vos données ne seront jamais vendues à des tiers. Elles seront uniquement partagées avec des conseillers professionnels agissant pour le compte de {partnerName} et avec les prestataires technologiques nécessaires au fonctionnement du service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">5. Stockage et sécurité</h2>
              <p className="text-slate-600 leading-relaxed">
                Les données sont stockées sur un cloud sécurisé géré par la plateforme Lovable. Nous appliquons des mesures de sécurité raisonnables conformément aux réglementations israéliennes applicables en matière de protection des données.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">6. Vos droits</h2>
              <p className="text-slate-600 leading-relaxed">
                Vous avez le droit d'accéder à vos données personnelles, de les corriger ou d'en demander la suppression. Pour exercer ces droits, contactez :{" "}
                <a href={`mailto:${partnerEmail}`} className="text-primary underline">{partnerEmail}</a>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">7. Contact</h2>
              <p className="text-slate-600 leading-relaxed">
                Pour toute question concernant cette politique de confidentialité, contactez {partnerName} à :{" "}
                <a href={`mailto:${partnerEmail}`} className="text-primary underline">{partnerEmail}</a>
              </p>
            </section>
          </>
        )}

      </div>
    </div>
  );
}
