import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

interface ReportData {
  user_id: string;
  property_id: string;
  recipient_email: string;
  recipient_name: string;
  language: string;
}

interface EmailTranslations {
  [key: string]: {
    subject: string;
    subjectWithName: string;
    greeting: string;
    reportTitle: string;
    propertyInfo: string;
    totalBudget: string;
    totalSpent: string;
    remainingBudget: string;
    expenses: string;
    date: string;
    category: string;
    description: string;
    amount: string;
    noExpenses: string;
    footer: string;
    bestRegards: string;
    companyName: string;
    advisorSubject: string;
    advisorGreeting: string;
    newReportNotification: string;
    propertyLabel: string;
    viewReport: string;
    viewReportButton: string;
  };
}

const translations: EmailTranslations = {
  en: {
    subject: "Budget Report",
    subjectWithName: "Budget Report for",
    greeting: "Hello",
    reportTitle: "Monthly Budget Report",
    propertyInfo: "Property Information",
    totalBudget: "Total Budget",
    totalSpent: "Total Spent",
    remainingBudget: "Remaining Budget",
    expenses: "Expenses",
    date: "Date",
    category: "Category",
    description: "Description",
    amount: "Amount",
    noExpenses: "No expenses recorded for this period.",
    footer: "This is an automated report from your Real Estate Budget Buddy application.",
    bestRegards: "Best regards",
    companyName: "Real Estate Budget Buddy",
    advisorSubject: "New Budget Report Available",
    advisorGreeting: "Hello Advisor",
    newReportNotification: "A new budget report has been generated",
    propertyLabel: "Property",
    viewReport: "View Report",
    viewReportButton: "View the Report",
  },
  he: {
    subject: "דוח תקציב",
    subjectWithName: "דוח תקציב עבור",
    greeting: "שלום",
    reportTitle: "דוח תקציב חודשי",
    propertyInfo: "פרטי הנכס",
    totalBudget: "סה״כ תקציב",
    totalSpent: "סה״כ הוצא",
    remainingBudget: "יתרת תקציב",
    expenses: "הוצאות",
    date: "תאריך",
    category: "קטגוריה",
    description: "תיאור",
    amount: "סכום",
    noExpenses: "לא הוצאות רשומות לתקופה זו.",
    footer: "זהו דוח אוטומטי מיישומון Real Estate Budget Buddy שלך.",
    bestRegards: "בברכה",
    companyName: "Real Estate Budget Buddy",
    advisorSubject: "דוח תקציב חדש זמין",
    advisorGreeting: "שלום יועץ",
    newReportNotification: "דוח תקציב חדש נוצר",
    propertyLabel: "נכס",
    viewReport: "צפה בדוח",
    viewReportButton: "צפה בדוח",
  },
  es: {
    subject: "Informe de Presupuesto",
    subjectWithName: "Informe de Presupuesto para",
    greeting: "Hola",
    reportTitle: "Informe de Presupuesto Mensual",
    propertyInfo: "Información de la Propiedad",
    totalBudget: "Presupuesto Total",
    totalSpent: "Total Gastado",
    remainingBudget: "Presupuesto Restante",
    expenses: "Gastos",
    date: "Fecha",
    category: "Categoría",
    description: "Descripción",
    amount: "Monto",
    noExpenses: "Sin gastos registrados para este período.",
    footer: "Este es un informe automatizado de tu aplicación Real Estate Budget Buddy.",
    bestRegards: "Saludos cordiales",
    companyName: "Real Estate Budget Buddy",
    advisorSubject: "Nuevo Informe de Presupuesto Disponible",
    advisorGreeting: "Hola Asesor",
    newReportNotification: "Se ha generado un nuevo informe de presupuesto",
    propertyLabel: "Propiedad",
    viewReport: "Ver Informe",
    viewReportButton: "Ver el Informe",
  },
  fr: {
    subject: "Rapport de Budget",
    subjectWithName: "Rapport de Budget pour",
    greeting: "Bonjour",
    reportTitle: "Rapport de Budget Mensuel",
    propertyInfo: "Informations sur la Propriété",
    totalBudget: "Budget Total",
    totalSpent: "Total Dépensé",
    remainingBudget: "Budget Restant",
    expenses: "Dépenses",
    date: "Date",
    category: "Catégorie",
    description: "Description",
    amount: "Montant",
    noExpenses: "Aucune dépense enregistrée pour cette période.",
    footer: "Ceci est un rapport automatisé de votre application Real Estate Budget Buddy.",
    bestRegards: "Cordialement",
    companyName: "Real Estate Budget Buddy",
    advisorSubject: "Nouveau Rapport de Budget Disponible",
    advisorGreeting: "Bonjour Conseiller",
    newReportNotification: "Un nouveau rapport de budget a été généré",
    propertyLabel: "Propriété",
    viewReport: "Voir le Rapport",
    viewReportButton: "Voir le Rapport",
  },
  de: {
    subject: "Budgetbericht",
    subjectWithName: "Budgetbericht für",
    greeting: "Hallo",
    reportTitle: "Monatlicher Budgetbericht",
    propertyInfo: "Immobilieninformationen",
    totalBudget: "Gesamtbudget",
    totalSpent: "Gesamtausgaben",
    remainingBudget: "Verbleibendes Budget",
    expenses: "Ausgaben",
    date: "Datum",
    category: "Kategorie",
    description: "Beschreibung",
    amount: "Betrag",
    noExpenses: "Für diesen Zeitraum sind keine Ausgaben erfasst.",
    footer: "Dies ist ein automatisierter Bericht aus Ihrer Real Estate Budget Buddy-Anwendung.",
    bestRegards: "Beste Grüße",
    companyName: "Real Estate Budget Buddy",
    advisorSubject: "Neuer Budgetbericht Verfügbar",
    advisorGreeting: "Hallo Berater",
    newReportNotification: "Ein neuer Budgetbericht wurde erstellt",
    propertyLabel: "Immobilie",
    viewReport: "Bericht Anzeigen",
    viewReportButton: "Bericht Anzeigen",
  },
  pt: {
    subject: "Relatório de Orçamento",
    subjectWithName: "Relatório de Orçamento para",
    greeting: "Olá",
    reportTitle: "Relatório de Orçamento Mensal",
    propertyInfo: "Informações da Propriedade",
    totalBudget: "Orçamento Total",
    totalSpent: "Total Gasto",
    remainingBudget: "Orçamento Restante",
    expenses: "Despesas",
    date: "Data",
    category: "Categoria",
    description: "Descrição",
    amount: "Valor",
    noExpenses: "Nenhuma despesa registrada para este período.",
    footer: "Este é um relatório automatizado do seu aplicativo Real Estate Budget Buddy.",
    bestRegards: "Atenciosamente",
    companyName: "Real Estate Budget Buddy",
    advisorSubject: "Novo Relatório de Orçamento Disponível",
    advisorGreeting: "Olá Consultor",
    newReportNotification: "Um novo relatório de orçamento foi gerado",
    propertyLabel: "Propriedade",
    viewReport: "Ver Relatório",
    viewReportButton: "Ver o Relatório",
  },
  it: {
    subject: "Rapporto di Budget",
    subjectWithName: "Rapporto di Budget per",
    greeting: "Ciao",
    reportTitle: "Rapporto di Budget Mensile",
    propertyInfo: "Informazioni sulla Proprietà",
    totalBudget: "Budget Totale",
    totalSpent: "Totale Speso",
    remainingBudget: "Budget Rimanente",
    expenses: "Spese",
    date: "Data",
    category: "Categoria",
    description: "Descrizione",
    amount: "Importo",
    noExpenses: "Nessuna spesa registrata per questo periodo.",
    footer: "Questo è un rapporto automatico della tua applicazione Real Estate Budget Buddy.",
    bestRegards: "Cordiali saluti",
    companyName: "Real Estate Budget Buddy",
    advisorSubject: "Nuovo Rapporto di Budget Disponibile",
    advisorGreeting: "Ciao Consulente",
    newReportNotification: "È stato generato un nuovo rapporto di budget",
    propertyLabel: "Proprietà",
    viewReport: "Visualizza Rapporto",
    viewReportButton: "Visualizza il Rapporto",
  },
};

function getLanguageTranslations(language: string): EmailTranslations[string] {
  return translations[language.toLowerCase()] || translations.en;
}

interface PropertyData {
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
}

interface Expense {
  date: string;
  category: string;
  description: string;
  amount: number;
}

interface BudgetData {
  monthly_budget: number;
  expenses: Expense[];
}

async function getPropertyData(propertyId: string) {
  const { data, error } = await supabase
    .from("properties")
    .select("address, bedrooms, bathrooms, square_feet")
    .eq("id", propertyId)
    .single();

  if (error) throw error;
  return data as PropertyData;
}

async function getBudgetData(propertyId: string) {
  const { data, error } = await supabase
    .from("budgets")
    .select("monthly_budget")
    .eq("property_id", propertyId)
    .single();

  if (error) throw error;

  const { data: expensesData, error: expensesError } = await supabase
    .from("expenses")
    .select("date, category, description, amount")
    .eq("property_id", propertyId)
    .order("date", { ascending: false });

  if (expensesError) throw expensesError;

  return {
    monthly_budget: data.monthly_budget,
    expenses: expensesData || [],
  } as BudgetData;
}

async function getUserInfo(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

async function getPropertySharedAdvisors(propertyId: string) {
  const { data, error } = await supabase
    .from("property_access")
    .select("user_id")
    .eq("property_id", propertyId)
    .eq("access_type", "advisor");

  if (error) throw error;
  return data || [];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function generateEmailHtml(
  recipientName: string,
  propertyAddress: string,
  monthlyBudget: number,
  totalSpent: number,
  expenses: Expense[],
  t: EmailTranslations[string]
): string {
  const remainingBudget = monthlyBudget - totalSpent;
  const isOver = remainingBudget < 0;

  return `
    <!DOCTYPE html>
    <html dir="${t.greeting === "שלום" ? "rtl" : "ltr"}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          border-bottom: 3px solid #2563eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        h1 {
          color: #2563eb;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        h2 {
          color: #1e40af;
          font-size: 18px;
          margin-top: 20px;
          margin-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }
        .info-box {
          background-color: #f0f4f8;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
          border-left: 4px solid #2563eb;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #1e40af;
        }
        .info-value {
          color: #333;
        }
        .budget-summary {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .budget-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .budget-card.spent {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .budget-card.remaining {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .budget-card.remaining.over {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }
        .budget-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 8px;
        }
        .budget-amount {
          font-size: 24px;
          font-weight: bold;
        }
        .expenses-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .expenses-table th {
          background-color: #f3f4f6;
          padding: 12px;
          text-align: ${t.greeting === "שלום" ? "right" : "left"};
          font-weight: 600;
          color: #1e40af;
          border-bottom: 2px solid #2563eb;
        }
        .expenses-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          text-align: ${t.greeting === "שלום" ? "right" : "left"};
        }
        .expenses-table tr:hover {
          background-color: #f9fafb;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 15px;
        }
        .no-expenses {
          text-align: center;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 6px;
          color: #6b7280;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t.reportTitle}</h1>
          <p class="greeting">${t.greeting} ${recipientName},</p>
        </div>

        <p>${t.newReportNotification} ${t.propertyLabel.toLowerCase()}: <strong>${propertyAddress}</strong></p>

        <div class="info-box">
          <div class="info-row">
            <span class="info-label">${t.propertyLabel}</span>
            <span class="info-value">${propertyAddress}</span>
          </div>
        </div>

        <div class="budget-summary">
          <div class="budget-card">
            <div class="budget-label">${t.totalBudget}</div>
            <div class="budget-amount">${formatCurrency(monthlyBudget)}</div>
          </div>
          <div class="budget-card spent">
            <div class="budget-label">${t.totalSpent}</div>
            <div class="budget-amount">${formatCurrency(totalSpent)}</div>
          </div>
          <div class="budget-card remaining ${isOver ? "over" : ""}">
            <div class="budget-label">${t.remainingBudget}</div>
            <div class="budget-amount">${formatCurrency(remainingBudget)}</div>
          </div>
        </div>

        ${
          expenses.length > 0
            ? `
          <h2>${t.expenses}</h2>
          <table class="expenses-table">
            <thead>
              <tr>
                <th>${t.date}</th>
                <th>${t.category}</th>
                <th>${t.description}</th>
                <th>${t.amount}</th>
              </tr>
            </thead>
            <tbody>
              ${expenses
                .map(
                  (expense) => `
                <tr>
                  <td>${new Date(expense.date).toLocaleDateString()}</td>
                  <td>${expense.category}</td>
                  <td>${expense.description}</td>
                  <td>${formatCurrency(expense.amount)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `
            : `<div class="no-expenses">${t.noExpenses}</div>`
        }

        <div class="footer">
          <p>${t.footer}</p>
          <p>${t.bestRegards},<br>${t.companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const {
      user_id,
      property_id,
      recipient_email,
      recipient_name,
      language,
    } = body as ReportData;

    // Validate input
    if (!user_id || !property_id || !recipient_email || !recipient_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get translations
    const t = getLanguageTranslations(language);

    // Fetch property data
    const propertyData = await getPropertyData(property_id);

    // Fetch budget data
    const budgetData = await getBudgetData(property_id);

    // Calculate total spent
    const totalSpent = budgetData.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Sort expenses by date (newest first)
    const sortedExpenses = budgetData.expenses.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Generate email HTML
    const emailHtml = generateEmailHtml(
      recipient_name,
      propertyData.address,
      budgetData.monthly_budget,
      totalSpent,
      sortedExpenses,
      t
    );

    // Send email to recipient
    const recipientSubject = recipient_name
      ? `${t.subjectWithName} ${recipient_name}`
      : `${t.subjectWithName}`;

    const recipientEmailResponse = await resend.emails.send({
      from: "Real Estate Budget Buddy <onboarding@resend.dev>",
      to: recipient_email,
      subject: recipientSubject,
      html: emailHtml,
    });

    if (recipientEmailResponse.error) {
      console.error("Error sending recipient email:", recipientEmailResponse.error);
      return new Response(
        JSON.stringify({
          error: "Failed to send recipient email",
          details: recipientEmailResponse.error,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user info for advisor emails
    const userInfo = await getUserInfo(user_id);

    // Get advisors with access to this property
    const advisors = await getPropertySharedAdvisors(property_id);

    // Send emails to advisors
    for (const advisor of advisors) {
      const advisorUser = await getUserInfo(advisor.user_id);

      const advisorEmailHtml = generateEmailHtml(
        advisorUser.id,
        propertyData.address,
        budgetData.monthly_budget,
        totalSpent,
        sortedExpenses,
        t
      );

      const advisorSubject = `${t.advisorSubject}`;

      const advisorEmailResponse = await resend.emails.send({
        from: "Real Estate Budget Buddy <onboarding@resend.dev>",
        to: advisorUser.email,
        subject: advisorSubject,
        html: advisorEmailHtml,
      });

      if (advisorEmailResponse.error) {
        console.error("Error sending advisor email:", advisorEmailResponse.error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Report email sent successfully",
        recipientEmail: recipientEmailResponse.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
