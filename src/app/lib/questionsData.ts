// src/lib/questionsData.ts
import { 
  Building2, Users, Stethoscope, Syringe, Pill, 
  TestTube, Droplet, Wind, Bed, Calculator, 
  Package, Wrench, Briefcase, BarChart, MonitorSmartphone, Globe
} from 'lucide-react';

export const rolesData = [
  {
    slug: 'administration',
    title: 'Hospital Administration / Management',
    icon: Building2,
    questions: [
      "What departments currently exist?",
      "What units/sections exist inside each department?",
      "Which departments must be included in the new system?",
      "Are there departments that should NOT be included in the first version?",
      "Does the hospital have wards? List them.",
      "Does the hospital have clinics/outpatient units? List them.",
      "Does the hospital have emergency services?",
      "Does the hospital have an operating theatre?",
      "Does the hospital have ICU/critical-care areas?",
      "Are there other important areas that the system must support?",
      "What types of employees will use the system?",
      "Approximately how many users are expected?",
      "Which departments will use it?",
      "What should each type of employee be able to do?",
      "What information should each type of employee be able to see?",
      "Which actions should require authorization/approval?",
      "Who creates employee accounts?",
      "Who disables an employee account when they leave?",
      "How is the hospital currently managing its information?",
      "Which processes are on paper?",
      "Which processes use Excel?",
      "Which processes use existing software?",
      "What are the biggest problems with the current system?",
      "What information is difficult to find?",
      "What work is currently repeated manually?",
      "What mistakes happen frequently?",
      "What would you most like the new system to improve?",
      "What information should management see on the dashboard?",
      "What statistics do you need?",
      "What reports do you need?",
      "How often are reports needed?",
      "Who should be allowed to see management reports?",
      "Which information is confidential?",
      "Which actions should be recorded in an audit history?",
      "Are there departments/features you expect to add later?",
      "Could the system eventually be used by another hospital?",
      "Could the number of users/patients grow significantly?",
      "Are there existing systems that this system may eventually need to connect to?"
    ]
  },
  {
    slug: 'reception',
    title: 'Reception / Registration',
    icon: Users,
    questions: [
      "Explain the complete process when a new patient arrives.",
      "What information do you collect?",
      "What information is required?",
      "What information is optional?",
      "How do you identify an existing patient?",
      "Does every patient have a unique patient number?",
      "How is the patient number created?",
      "What happens when an existing patient returns?",
      "How do you search for a patient?",
      "What happens if information was entered incorrectly?",
      "Who can correct patient information?",
      "What happens if two records accidentally exist for the same patient?",
      "How do you create a visit?",
      "How do you select the department?",
      "How do you select the doctor?",
      "How does the patient enter the queue?",
      "How do you know which patients are waiting?",
      "How does the patient move from reception to the next department?",
      "What happens when the patient finishes their visit?",
      "How is the next appointment/follow-up handled?"
    ]
  },
  {
    slug: 'doctors',
    title: 'Doctors',
    icon: Stethoscope,
    questions: [
      "What information do you need to see before examining a patient?",
      "What previous patient information is important during a consultation?",
      "What information do you record during a consultation?",
      "How do you record the patient's reason for visiting?",
      "How do you record examination findings?",
      "How do you record clinical assessment?",
      "How do you record diagnoses?",
      "Do you use diagnosis codes or another classification?",
      "How do you record treatment plans?",
      "How do you record follow-up instructions?",
      "What other clinical information do you normally record?",
      "What types of tests can you request?",
      "How do you request laboratory tests?",
      "How do you request radiology/imaging?",
      "Are there other investigations you request?",
      "How do you receive the results?",
      "How do you review previous results?",
      "How do you prescribe medication?",
      "What information must be included in a prescription?",
      "How do you specify dosage/instructions?",
      "How do you handle changes to a prescription?",
      "How do you handle discontinued medication?",
      "Do you make referrals?",
      "Do you create follow-up appointments?",
      "Do you create medical certificates/reports?",
      "Are there other forms doctors complete?"
    ]
  },
  {
    slug: 'nursing',
    title: 'Nursing',
    icon: Syringe,
    questions: [
      "Explain the complete nursing process from receiving the patient.",
      "What information do nurses collect?",
      "What observations do you record?",
      "What measurements do you record?",
      "What nursing assessment information is recorded?",
      "What nursing notes are recorded?",
      "What treatments/actions do nurses record?",
      "What medication-related information do nurses record?",
      "How do nurses record repeated observations?",
      "How do nurses record changes in a patient's condition?",
      "What information must nurses see from the doctor?",
      "What information must nurses send to the doctor?",
      "What information is recorded during admission?",
      "What information is recorded during discharge?",
      "What other nursing forms are used?"
    ]
  },
  {
    slug: 'pharmacy',
    title: 'Pharmacy',
    icon: Pill,
    questions: [
      "Explain the complete pharmacy process.",
      "How do you receive prescriptions?",
      "What information is included in a prescription?",
      "How do you verify a prescription?",
      "How do you dispense medicine?",
      "What information do you record when medicine is dispensed?",
      "How is medicine stock recorded?",
      "How is new stock received?",
      "How are suppliers recorded?",
      "How are stock quantities changed?",
      "How are medicines transferred between locations?",
      "How are damaged medicines handled?",
      "How are expired medicines handled?",
      "How are returned medicines handled?",
      "How do you monitor low stock?",
      "What medicine information do you store?",
      "What reports do you currently produce?",
      "What information do you need to see about pharmacy activity?"
    ]
  },
  {
    slug: 'laboratory',
    title: 'Laboratory',
    icon: TestTube,
    questions: [
      "Explain the complete laboratory process.",
      "How does the laboratory receive a request?",
      "What information comes with the request?",
      "How is the patient/sample identified?",
      "What types of samples are handled?",
      "What laboratory tests are available?",
      "How are tests registered?",
      "Who performs the test?",
      "Who enters the result?",
      "Does another person verify results?",
      "How are results changed/corrected?",
      "How does the doctor receive the result?",
      "How are abnormal/urgent results handled?",
      "What laboratory information is stored?",
      "What laboratory reports are required?"
    ]
  },
  {
    slug: 'blood-bank',
    title: 'Blood Bank',
    icon: Droplet,
    questions: [
      "Explain the complete blood-bank process.",
      "How are blood donations recorded?",
      "What information is recorded about each blood unit?",
      "How is each blood unit identified?",
      "How is blood stored?",
      "How is available stock monitored?",
      "How are blood requests received?",
      "Who approves blood release?",
      "How is blood issued?",
      "How is the recipient/transfusion recorded?",
      "How are unsuitable or expired units handled?",
      "What blood-bank reports are required?",
      "Are there other blood-bank processes the system must support?"
    ]
  },
  {
    slug: 'oxygen',
    title: 'Oxygen / Medical Gas',
    icon: Wind,
    questions: [
      "What oxygen-related resources does the hospital manage?",
      "Explain how oxygen is received.",
      "How is oxygen stored?",
      "How is oxygen assigned/issued?",
      "How is usage recorded?",
      "How is remaining availability checked?",
      "How is refilling handled?",
      "How are cylinders/equipment identified?",
      "How are damaged units handled?",
      "How are maintenance activities recorded?",
      "What alerts are needed?",
      "What reports are required?"
    ]
  },
  {
    slug: 'admission',
    title: 'Admission / Wards',
    icon: Bed,
    questions: [
      "Explain how a patient is admitted.",
      "Who creates/approves an admission?",
      "What information is recorded?",
      "What wards are available?",
      "What rooms exist?",
      "What beds exist?",
      "How do you know which beds are available?",
      "How is a patient assigned a bed?",
      "How are transfers handled?",
      "How are ward changes recorded?",
      "How is discharge handled?",
      "What information is recorded at discharge?",
      "What reports are needed?"
    ]
  },
  {
    slug: 'accounts',
    title: 'Accounts / Finance',
    icon: Calculator,
    questions: [
      "Explain the complete payment process.",
      "What services generate charges?",
      "How are charges calculated?",
      "How are invoices created?",
      "How are payments recorded?",
      "What payment methods are accepted?",
      "How are unpaid balances handled?",
      "How are refunds handled?",
      "How are discounts handled?",
      "Who can approve financial changes?",
      "How are expenses recorded?",
      "How are financial transactions reported?",
      "What financial reports are required?",
      "What information must management see?",
      "Are there existing accounting rules/software that must be followed?"
    ]
  },
  {
    slug: 'inventory',
    title: 'Inventory / Store',
    icon: Package,
    questions: [
      "What items does the hospital keep in stock?",
      "Explain how new stock arrives.",
      "How is stock received?",
      "How is stock recorded?",
      "How is stock stored?",
      "How do departments request items?",
      "How is stock issued?",
      "How are stock transfers handled?",
      "How are damaged items handled?",
      "How are expired items handled?",
      "How is low stock identified?",
      "How are stock counts performed?",
      "How are suppliers managed?",
      "What inventory reports are required?"
    ]
  },
  {
    slug: 'equipment',
    title: 'Equipment / Assets',
    icon: Wrench,
    questions: [
      "What hospital equipment must be tracked?",
      "How is each equipment item identified?",
      "What information is stored about equipment?",
      "Where is equipment located?",
      "Which department owns/uses it?",
      "How is equipment assigned?",
      "How is maintenance recorded?",
      "How are repairs recorded?",
      "How are equipment inspections recorded?",
      "How are damaged/lost items handled?",
      "What equipment reports are required?"
    ]
  },
  {
    slug: 'hr',
    title: 'HR / Staff',
    icon: Briefcase,
    questions: [
      "What employee information is currently recorded?",
      "How are employees registered?",
      "How are departments assigned?",
      "How are job positions recorded?",
      "How are staff schedules managed?",
      "How is attendance managed?",
      "How are leave requests managed?",
      "How are staff changes recorded?",
      "What staff reports are needed?",
      "What HR information needs to connect with the hospital system?"
    ]
  },
  {
    slug: 'management-reports',
    title: 'Management Reports',
    icon: BarChart,
    questions: [
      "What reports do you currently use?",
      "Which reports are produced daily?",
      "Which are weekly?",
      "Which are monthly?",
      "Which reports are required by management?",
      "Which reports are required by government/regulators?",
      "Which reports are required by departments?",
      "Which statistics should appear on the dashboard?",
      "Which reports need filtering by date?",
      "Which reports need filtering by department?",
      "Which reports need exporting/printing?",
      "Who is allowed to access each report?"
    ]
  },
  {
    slug: 'it-technical',
    title: 'IT / Technical Staff',
    icon: MonitorSmartphone,
    questions: [
      "What computers/devices are currently used?",
      "What operating systems are used?",
      "Is hospital internet available throughout the building?",
      "Which areas have weak/no internet?",
      "Is there an existing local network?",
      "Is there an existing server?",
      "Is there existing hospital software?",
      "Is there existing patient data?",
      "Is there existing database infrastructure?",
      "Are printers used?",
      "Are barcode scanners used?",
      "Are other medical devices connected to software?",
      "Are there existing integrations/API systems?",
      "Are there existing backup systems?",
      "Are there hospital IT/security policies we must follow?"
    ]
  }
];

// Dynamically generate the "All Questions" role to include absolutely everything
const allQuestions = rolesData.flatMap(role => 
  role.questions.map(q => `[${role.title}] ${q}`)
);

export const allRoles = [
  ...rolesData,
  {
    slug: 'all',
    title: 'Complete System Overview (All)',
    icon: Globe,
    questions: allQuestions
  }
];