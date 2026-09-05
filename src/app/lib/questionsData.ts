// src/lib/questionsData.ts

import {
  Building2,
  Users,
  Stethoscope,
  Syringe,
  Pill,
  TestTube,
  Droplet,
  Wind,
  Bed,
  Calculator,
  Package,
  Wrench,
  Briefcase,
  BarChart,
  MonitorSmartphone,
  Globe,
} from "lucide-react";

export const rolesData = [
  {
    slug: "administration",
    title: "Hospital Administration / Management",
    icon: Building2,
    questions: [
      "What departments, units, wards, clinics, and other important areas currently exist?",
      "Which departments and processes must be included in the new system?",
      "How is the hospital currently managing its information (paper, Excel, existing software, or other methods)?",
      "What are the biggest problems with the current processes?",
      "What information is difficult to find or work with?",
      "What work is currently repeated manually or causes frequent mistakes?",
      "What would you most like the new system to improve?",
      "What information, statistics, and reports does management need to see?",
      "How often are the important reports needed, and who needs access to them?",
      "Are there important departments or processes that should be added to the system in the future?",
      "Are there existing systems or data that the new system must work with?"
    ],
  },

  {
    slug: "reception",
    title: "Reception / Registration",
    icon: Users,
    questions: [
      "Explain the complete process from when a new patient arrives until they are sent to the next step.",
      "What information do you collect when registering a patient, and which information is required?",
      "How do you identify and find an existing patient when they return?",
      "What happens when patient information is incorrect or duplicate patient records exist?",
      "How do you create a patient visit and select the department or doctor?",
      "How is the patient placed into the waiting/queue process?",
      "How does the patient move from reception to the doctor or another department?",
      "What happens when the patient's visit is finished or a follow-up is needed?"
    ],
  },

  {
    slug: "doctors",
    title: "Doctors",
    icon: Stethoscope,
    questions: [
      "Explain the complete process from when a doctor receives a patient until the patient leaves the doctor's care.",
      "What information does the doctor need to see about the patient before and during the consultation?",
      "What information does the doctor record during the consultation and treatment?",
      "How are examinations, assessments, diagnoses, treatment plans, and follow-up instructions recorded?",
      "What tests or investigations can the doctor request, and how are the requests and results handled?",
      "How are prescriptions created, changed, discontinued, and sent to pharmacy?",
      "How are referrals, follow-up visits, medical certificates, or other doctor documents handled?",
      "When doctors change shifts, how is information about patients handed over to the incoming doctor?",
      "Please provide/show all consultation forms, patient records, handover forms, prescription forms, referral forms, reports, or other documents doctors currently use."
    ],
  },

  {
    slug: "nursing",
    title: "Nursing",
    icon: Syringe,
    questions: [
      "Explain the complete nursing process from receiving the patient until the patient leaves or is transferred.",
      "What information do nurses collect and record about the patient during care?",
      "What observations, measurements, assessments, notes, treatments, and medication-related records are maintained?",
      "How are repeated observations and changes in the patient's condition recorded and communicated?",
      "What information do nurses need to receive from doctors, and what information do nurses send to doctors?",
      "What information is recorded during admission, transfer, and discharge?",
      "Please provide/show all nursing assessment, observation, medication, admission, discharge, handover, or other nursing forms currently used."
    ],
  },

  {
    slug: "pharmacy",
    title: "Pharmacy",
    icon: Pill,
    questions: [
      "Explain the complete pharmacy process from receiving a prescription until the medicine is dispensed.",
      "How are prescriptions received, checked, and approved before dispensing?",
      "What information is recorded when medicine is dispensed to a patient or department?",
      "Explain how medicine stock is received, stored, transferred, issued, counted, and updated.",
      "How are damaged, expired, returned, or unavailable medicines handled?",
      "How are suppliers and medicine purchases managed?",
      "How is low stock identified and what action is taken?",
      "What pharmacy reports are currently used or needed?",
      "Please provide/show prescription forms, medicine lists, stock records, purchase records, supplier records, and pharmacy reports currently used."
    ],
  },

  {
    slug: "laboratory",
    title: "Laboratory",
    icon: TestTube,
    questions: [
      "Explain the complete laboratory process from receiving a test request until the result reaches the doctor/patient.",
      "What information comes with a laboratory request and how is the patient/sample identified?",
      "What types of samples and tests are handled?",
      "How are laboratory tests registered, performed, and results entered?",
      "How are results verified, corrected, and communicated, including urgent or abnormal results?",
      "What laboratory records and reports are currently maintained?",
      "Please provide/show laboratory request forms, sample records, result forms, test lists, reports, Excel files, or other laboratory documents currently used."
    ],
  },

  {
    slug: "blood-bank",
    title: "Blood Bank",
    icon: Droplet,
    questions: [
      "Explain what the blood bank currently does from receiving/donating blood until blood is issued or used.",
      "What information is currently recorded about blood donations and blood units?",
      "How are blood units identified, stored, monitored, and checked for availability?",
      "How are requests for blood received, approved, and fulfilled?",
      "How are issued, unsuitable, expired, or otherwise unusable blood units handled?",
      "What blood-bank records or reports currently exist?",
      "If the blood-bank process is not fully developed yet, describe what currently exists and what is expected in the future.",
      "Please provide/show any blood-bank forms, registers, reports, or other documents currently used."
    ],
  },

  {
    slug: "oxygen",
    title: "Oxygen / Medical Gas",
    icon: Wind,
    questions: [
      "Explain how the hospital currently manages oxygen and other medical gases.",
      "How are oxygen/gas resources received, stored, assigned, issued, and refilled?",
      "How is availability or usage currently monitored?",
      "How are cylinders or related equipment identified and handled when damaged or requiring maintenance?",
      "What records, alerts, or reports are currently used or needed?",
      "If the oxygen/medical-gas process is not fully developed yet, describe what currently exists and what is expected in the future.",
      "Please provide/show any oxygen or medical-gas records, forms, stock sheets, maintenance records, or reports currently used."
    ],
  },

  {
    slug: "admission",
    title: "Admission / Wards",
    icon: Bed,
    questions: [
      "Explain the complete process from deciding that a patient needs admission until the patient is discharged or transferred.",
      "How is an admission created and approved, and what information is recorded?",
      "How are wards, rooms, and beds managed and how is availability known?",
      "How is a patient assigned to a bed and how are bed/ward transfers handled?",
      "How is discharge handled and what information is recorded?",
      "What admission, ward, bed, transfer, discharge, or ward reports are currently used?",
      "Please provide/show the forms, registers, reports, or other documents currently used for admissions and wards."
    ],
  },

  {
    slug: "accounts",
    title: "Accounts / Finance",
    icon: Calculator,
    questions: [
      "Explain the complete financial process from a patient/service creating a charge until payment is completed.",
      "What services or activities create charges, and how are those charges calculated?",
      "How are invoices, receipts, and payments created and recorded?",
      "What payment methods are currently accepted?",
      "How are unpaid balances, refunds, discounts, and financial corrections handled?",
      "Who approves important financial actions or changes?",
      "How are hospital expenses recorded?",
      "What financial reports and information does management need?",
      "Please provide/show current invoices, receipts, payment records, expense forms, financial reports, accounting templates, or other financial documents."
    ],
  },

  {
    slug: "inventory",
    title: "Inventory / Store",
    icon: Package,
    questions: [
      "Explain the complete process from receiving stock until items are issued to a department or used.",
      "What types of items are managed in the store/inventory?",
      "How are stock items received, recorded, stored, issued, transferred, and counted?",
      "How do departments request items and how are those requests approved and fulfilled?",
      "How are damaged, expired, missing, or low-stock items handled?",
      "How are suppliers managed?",
      "What inventory reports are currently used or needed?",
      "Please provide/show receiving forms, requisitions, issue forms, supplier records, stock sheets, inventory reports, or other documents currently used."
    ],
  },

  {
    slug: "equipment",
    title: "Equipment / Assets",
    icon: Wrench,
    questions: [
      "What hospital equipment and assets need to be tracked?",
      "Explain how equipment is registered, identified, assigned to departments/locations, and tracked.",
      "What information is currently recorded about equipment?",
      "How are maintenance, inspections, repairs, damaged equipment, and lost equipment handled?",
      "What equipment/asset reports are currently used or needed?",
      "Please provide/show equipment registers, maintenance records, repair records, asset reports, or other documents currently used."
    ],
  },

  {
    slug: "hr",
    title: "HR / Staff",
    icon: Briefcase,
    questions: [
      "Explain the complete process for registering and managing hospital employees.",
      "What employee information is currently recorded?",
      "How are departments, positions, schedules, attendance, and leave managed?",
      "How are staff changes such as transfers, new employees, or employees leaving recorded?",
      "What HR reports are currently used or needed?",
      "Please provide/show employee forms, attendance records, leave forms, staff lists, reports, Excel files, or other HR documents currently used."
    ],
  },

  {
    slug: "management-reports",
    title: "Management Reports",
    icon: BarChart,
    questions: [
      "What important reports are currently produced by the hospital or its departments?",
      "Which reports are produced daily, weekly, monthly, or when specifically requested?",
      "Which reports are required by management or government/regulatory authorities?",
      "What statistics or information should management see on the system dashboard?",
      "Which reports need filtering, printing, or exporting?",
      "Who should have access to each important report?",
      "Please provide/show the actual reports currently used, including paper reports, Excel files, PDFs, or other formats."
    ],
  },

  {
    slug: "it-technical",
    title: "IT / Technical Staff",
    icon: MonitorSmartphone,
    questions: [
      "What devices, software, systems, and technical infrastructure are currently used by the hospital?",
      "Is there an existing hospital information system, patient database, or other software? If yes, explain what it does.",
      "What existing patient or hospital data may need to be preserved or transferred?",
      "What network, internet, server, printer, scanner, or other infrastructure must the new system work with?",
      "Are any medical devices or external systems currently connected to hospital software?",
      "How are backups and data recovery currently handled?",
      "What IT, security, privacy, or technical policies must the new system follow?",
      "Please provide/show relevant system documentation, screenshots, database information, network information, existing software details, or other technical documentation."
    ],
  },
];

/*
 * ALL QUESTIONS
 *
 * The participant's selected role remains unchanged.
 * This view simply exposes questions from every department.
 */

const allQuestions = rolesData.flatMap((role) =>
  role.questions.map((question) => ({
    question,
    departmentSlug: role.slug,
    departmentTitle: role.title,
  }))
);

export const allRoles = [
  ...rolesData,
  {
    slug: "all",
    title: "Complete System Overview (All)",
    icon: Globe,
    questions: allQuestions.map(
      (item) => `[${item.departmentTitle}] ${item.question}`
    ),
  },
];