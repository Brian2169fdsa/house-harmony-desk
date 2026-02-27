export interface PolicyTemplateParams {
  orgName: string;
  municipality: string;
  narrLevel: string;
  address: string;
  bedCount: number;
  matFriendly: boolean;
}

export interface PolicyTemplate {
  key: string;
  title: string;
  generate: (params: PolicyTemplateParams) => string;
}

const municipalityNotes: Record<string, string> = {
  phoenix:
    "Phoenix Zoning Ordinance Section 608 applies. Homes with 7+ residents require a Conditional Use Permit (CUP). Business license required ($50/yr from City of Phoenix).",
  scottsdale:
    "Scottsdale City Code applies. Group Home permit required for 7+ unrelated adults. Residential spacing requirements must be verified with Scottsdale Planning Department.",
  mesa:
    "Mesa City Code applies. Homes of 6 or fewer are typically treated as single-family use. Contact Mesa Development Services for a pre-application meeting.",
  prescott:
    "City of Prescott regulations apply for incorporated areas; Yavapai County for unincorporated areas. Prescott is generally favorable to recovery housing.",
  tucson:
    "City of Tucson Unified Development Code applies. Tucson and Pima County have active recovery housing communities. Generally supportive of sober living operations.",
};

export const policyTemplates: PolicyTemplate[] = [
  {
    key: "resident_handbook",
    title: "Resident Handbook & House Rules",
    generate: ({ orgName, municipality, narrLevel, address, bedCount, matFriendly }) => `
${orgName.toUpperCase()}
RESIDENT HANDBOOK & HOUSE RULES
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
NARR Level ${narrLevel} | ${municipality.charAt(0).toUpperCase() + municipality.slice(1)}, Arizona

ADDRESS: ${address || "[Property Address]"}
CAPACITY: ${bedCount} residents

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WELCOME

Welcome to ${orgName}. This house exists to support your recovery. The rules in this handbook are designed to create a safe, structured, substance-free environment where every resident can focus on building a better life.

By living here, you agree to abide by all rules in this handbook. Violations may result in warnings, restrictions, or discharge from the program.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOUSE RULES

1. SOBRIETY
   • Absolutely no alcohol, illegal drugs, or non-prescribed medications on property.
   • Any resident who uses substances must notify staff immediately.
   • Residents returning to the house impaired will be required to leave.

2. DRUG TESTING
   • All residents are subject to random drug and alcohol testing at any time.
   • New residents are tested within 24 hours of move-in.
   • Positive tests result in immediate review and may result in discharge.
${matFriendly ? "   • MAT medications (Suboxone, Vivitrol, methadone) are permitted with documentation." : "   • This is a MAT-abstinent house. No MAT medications are permitted without prior written approval."}

3. CURFEW
   • Sunday–Thursday: 10:00 PM
   • Friday–Saturday: 11:00 PM
   • Guests must leave by 9:00 PM. No overnight guests.
   • Exceptions require advance written approval from house manager.

4. MEETINGS & PROGRAMMING
${narrLevel === "I" ? "   • Residents are encouraged (not required) to attend support groups." : ""}${narrLevel === "II" ? "   • Minimum 3 recovery meetings per week (AA, NA, SMART Recovery, or equivalent).\n   • Mandatory weekly house meeting (Sunday, 7:00 PM)." : ""}${narrLevel === "III" || narrLevel === "IV" ? "   • Minimum 5 recovery meetings per week.\n   • Mandatory weekly house meeting and case management appointment.\n   • Life skills programming as scheduled." : ""}

5. CHORES
   • All residents participate in chores on a rotating schedule.
   • Chore assignments are posted weekly. Failure to complete assigned chores may result in restriction.
   • Kitchen must be cleaned immediately after cooking.

6. RESPECT & CONDUCT
   • Treat all residents and staff with respect at all times.
   • No violence, threats, or intimidation of any kind.
   • No theft or destruction of property.
   • No sexual relationships between residents.

7. FINANCES
   • Rent is due every [Monday/1st of month]. Late fees apply after [3] days.
   • Residents must maintain employment or show active job search progress.
   • Financial hardships must be discussed with the house manager before the due date.

8. VISITATION
   • Visitors are allowed only in common areas — never in bedrooms.
   • Visitors must be introduced to the house manager or on-duty staff.
   • All visitors are subject to the house's drug-free policy.

9. PHONE & TECHNOLOGY
   • Personal cell phones are permitted.
   • No filming of other residents without explicit consent.

10. PERSONAL PROPERTY
    • Each resident is responsible for their own belongings.
    • ${orgName} is not responsible for lost, stolen, or damaged property.
    • Do not borrow other residents' property without permission.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISCHARGE POLICY

Immediate discharge grounds include: use of substances, violence or threats, bringing unauthorized persons into the house, theft, destruction of property, tampering with drug tests.

Non-immediate discharge (3-day notice): Persistent curfew violations, non-payment, failure to maintain meetings or employment, disrespectful conduct.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESIDENT ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understand, and agree to abide by all rules in this handbook.

Resident Name: ________________________________
Signature: ____________________________________
Date: ________________________________________
House Manager: ________________________________
`.trim(),
  },

  {
    key: "admission_intake",
    title: "Admission & Intake Agreement",
    generate: ({ orgName, municipality, address, bedCount, matFriendly }) => `
${orgName.toUpperCase()}
ADMISSION & INTAKE AGREEMENT
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

FACILITY: ${address || "[Property Address]"}, ${municipality.charAt(0).toUpperCase() + municipality.slice(1)}, Arizona
CAPACITY: ${bedCount} residents

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ADMISSION CRITERIA

To be eligible for residence at ${orgName}, applicants must:
1. Be 18 years of age or older
2. Have a desire to remain sober and support others in doing the same
3. Be free from acute psychiatric crisis (may be referred to crisis services if needed)
4. Agree to all house rules and sign this agreement
5. Provide valid identification (state ID, driver's license, or passport)
6. Pass intake drug screen (on day of move-in)
${matFriendly ? "7. If on MAT medications, provide current prescription documentation" : "7. Not currently prescribed or using MAT medications (Suboxone, methadone, etc.)"}

ITEMS TO BRING AT MOVE-IN
• Valid photo ID
• Social Security card (for employment paperwork)
• Any prescribed medications in original pharmacy bottles
• Personal clothing (7+ days recommended)
• Toiletries
• Bedding (or confirm house provides)
• Emergency contact information

ITEMS PROHIBITED
• Alcohol or non-prescribed drugs of any kind
• Drug paraphernalia
• Weapons of any kind
• Pornographic material
• Items belonging to others without written permission

FEES & FINANCIAL OBLIGATIONS
• Program fee / rent: $________ per [week/month]
• Security deposit: $________ (due at move-in)
• Drug testing fee: $________ per test (if applicable)

ACKNOWLEDGMENTS
I understand that my tenancy is a license to occupy — not a traditional landlord-tenant relationship — and that I may be asked to leave with appropriate notice for rule violations.

I understand that drug testing may occur at any time without advance notice.

I understand that signing this agreement does not guarantee continued residence.

I consent to ${orgName} staff contacting my listed emergency contacts in the event of a medical emergency.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESIDENT SIGNATURE
Name: ________________________________________
Signature: ____________________________________
Date: ________________________________________

STAFF SIGNATURE
Name: ________________________________________
Signature: ____________________________________
Date: ________________________________________
`.trim(),
  },

  {
    key: "occupancy_agreement",
    title: "Occupancy Agreement (License to Occupy)",
    generate: ({ orgName, address, municipality }) => `
${orgName.toUpperCase()}
OCCUPANCY AGREEMENT (LICENSE TO OCCUPY)
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

IMPORTANT: This is a License to Occupy, NOT a Lease. Arizona law distinguishes between a traditional tenancy and a license to occupy in the context of recovery housing. This agreement is intended to preserve the operator's ability to discharge residents for program violations without engaging the full residential eviction process under A.R.S. § 33-1301 et seq.

PARTIES:
Operator: ${orgName} ("Operator")
Property Address: ${address || "[Property Address]"}, ${municipality.charAt(0).toUpperCase() + municipality.slice(1)}, Arizona

Resident Name: ________________________________ ("Resident")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRANT OF LICENSE

Operator grants Resident a revocable, non-exclusive license to occupy a bed/room at the above property, subject to full compliance with the terms of this Agreement and the ${orgName} Resident Handbook.

PROGRAM FEES
Monthly/Weekly Program Fee: $________
Due: [1st of each month / every Monday]
Late Fee: $________ after ________ days

DURATION
This license begins on: ________________________
This license is month-to-month and may be terminated by either party.

TERMINATION
Operator may terminate this license and require Resident to vacate:
• Immediately for: substance use, violence, theft, or safety violations
• With 3-day written notice for: non-payment, repeated rule violations, or failure to meet program requirements
• With 7-day written notice for: voluntary departure request or program completion

This is a recovery housing program license — not a traditional tenancy. Resident acknowledges that continued residence is contingent on active participation in program requirements and compliance with all house rules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACKNOWLEDGMENT

Resident acknowledges reading and understanding this Agreement and that it is NOT a lease.

Resident: _____________________________ Date: ____________
Operator/Manager: _____________________ Date: ____________

NOTE: This document was generated as a template and should be reviewed by a licensed Arizona attorney before use.
`.trim(),
  },

  {
    key: "drug_testing_policy",
    title: "Drug & Alcohol Testing Policy",
    generate: ({ orgName, matFriendly }) => `
${orgName.toUpperCase()}
DRUG & ALCOHOL TESTING POLICY
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE
${orgName} maintains a substance-free environment to support the recovery of all residents. Drug and alcohol testing is a core component of our accountability structure.

TESTING FREQUENCY
• Intake screen: Within 24 hours of move-in
• Random testing: Minimum twice per week (schedule varies without advance notice)
• Cause-based testing: Any time staff has reasonable suspicion
• Return from leave testing: Upon returning from any overnight pass

TEST PANELS
Standard 12-panel test screens for: Alcohol (ETG), Amphetamines, Barbiturates, Benzodiazepines, Buprenorphine, Cocaine, MDMA, Methadone, Methamphetamine, Opiates, Oxycodone, THC (marijuana)
${matFriendly ? "\nMAT MEDICATIONS: Residents on prescribed Suboxone, Vivitrol, or methadone must provide current prescription documentation. Positive test for prescribed MAT medication will not constitute a violation if documentation is current." : "\nMEDICATION NOTE: No MAT medications are permitted without prior written approval from program director."}

COLLECTION PROCEDURE
• Resident provides urine specimen under direct or indirect observation
• Specimen temperature is verified (valid: 90°F–100°F)
• Specimen is sealed and chain of custody form completed
• Results are available within [timeframe]

POSITIVE RESULT PROCEDURE
1. Resident is notified immediately
2. Resident may request confirmation test within 24 hours (at resident's expense)
3. Review meeting with house manager and/or program director
4. Outcome: warning (first offense, minor substance), restriction, or immediate discharge

TAMPERING
Tampering with a drug test (adulterating specimen, substituting specimen, or refusing to test) is treated as a positive result and may result in immediate discharge.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resident Acknowledgment:
Name: ________________________________
Signature: ____________________________
Date: ________________________________
`.trim(),
  },

  {
    key: "code_of_conduct",
    title: "Code of Conduct & Behavioral Expectations",
    generate: ({ orgName }) => `
${orgName.toUpperCase()}
CODE OF CONDUCT & BEHAVIORAL EXPECTATIONS
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ZERO-TOLERANCE VIOLATIONS (Immediate Discharge)
The following result in immediate removal from the program:
• Physical violence or assault on any person
• Threatening behavior or harassment
• Sexual misconduct or unwanted sexual contact
• Bringing controlled substances onto property
• Theft from residents, staff, or the house
• Destruction of property (valued at $25+)
• Tampering with drug tests
• Carrying or possessing a weapon of any kind
• Providing false information to staff

SERIOUS VIOLATIONS (Review and possible discharge)
• Repeated curfew violations
• Hosting unauthorized guests
• Non-payment of fees
• Failure to attend required meetings for 2+ consecutive weeks
• Verbal abuse or intimidation of other residents or staff
• Non-compliance with medication policies

MINOR VIOLATIONS (Warning)
• Single curfew violation (under 30 minutes)
• Minor chore negligence
• Noise violations after quiet hours
• Cluttered personal space

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GENERAL CONDUCT EXPECTATIONS
• Speak respectfully to all residents and staff
• Support other residents in their recovery — do not enable or trigger
• Maintain personal hygiene and participate in household cleanliness
• Manage conflict through conversation, not confrontation
• Do not share another resident's personal information outside the house
• No gambling on premises

PHONE & SOCIAL MEDIA
• Do not photograph or record other residents without their consent
• Do not post images of the house, other residents, or staff to social media

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resident Signature: ____________________________
Date: ________________________________________
`.trim(),
  },

  {
    key: "emergency_crisis",
    title: "Emergency & Crisis Response Protocol",
    generate: ({ orgName, address, municipality }) => `
${orgName.toUpperCase()}
EMERGENCY & CRISIS RESPONSE PROTOCOL
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
Property Address: ${address || "[Property Address]"}, ${municipality.charAt(0).toUpperCase() + municipality.slice(1)}, AZ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IN ALL EMERGENCIES: CALL 911 FIRST

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERDOSE RESPONSE
1. Call 911 immediately — state the address above
2. If person is unresponsive/not breathing: administer naloxone (Narcan)
   • Narcan location: [POST LOCATION IN HOUSE]
   • Intranasal: one spray in each nostril; may repeat in 2-3 minutes if no response
3. Place person in recovery position if breathing
4. Stay with the person until EMS arrives
5. Do NOT leave the person alone
6. Notify house manager immediately
7. Document incident in SoberOps system within 24 hours

Arizona Good Samaritan Law: A.R.S. § 36-2226.01 protects individuals who call 911 for a drug overdose from prosecution for drug possession.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUICIDE / SELF-HARM THREAT
1. Do not leave the person alone
2. Remove access to means (medications, sharp objects) if safe to do so
3. Call 911 or crisis line: Arizona Crisis Line: 1-800-631-1314
4. National Suicide Prevention Lifeline: 988
5. Stay calm and listen — do not argue or minimize their feelings
6. Notify house manager immediately

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIRE
1. Call 911
2. Activate fire alarm if available
3. Evacuate all residents via nearest exit — do not use elevators
4. Evacuation meeting point: [DESIGNATE LOCATION]
5. Account for all residents — inform fire department of any missing persons
6. Do not re-enter until cleared by fire department

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEDICAL EMERGENCY (Non-overdose)
1. Call 911
2. Do not move the person if spinal/neck injury is possible
3. Apply first aid (First Aid kit location: [POST LOCATION])
4. Stay with person until EMS arrives
5. Notify house manager

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DOMESTIC VIOLENCE / ASSAULT
1. Ensure safety of all residents — separate parties if safe
2. Call 911 immediately
3. Preserve the scene — do not disturb potential evidence
4. Cooperate fully with law enforcement
5. The aggressor will be immediately discharged from the program

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMERGENCY CONTACTS
House Manager: _________________________ Phone: _____________
Program Director: _______________________ Phone: _____________
On-call Staff: __________________________ Phone: _____________
Local Police (non-emergency): ____________ Phone: _____________
Local Hospital: _________________________ Phone: _____________
Arizona Crisis Line: 1-800-631-1314
National 988 Lifeline: 988

POST THIS DOCUMENT IN THE KITCHEN AND COMMON AREAS.
`.trim(),
  },

  {
    key: "medication_management",
    title: "Medication Management Policy",
    generate: ({ orgName, matFriendly }) => `
${orgName.toUpperCase()}
MEDICATION MANAGEMENT POLICY
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE
This policy ensures safe storage and administration of medications and protects residents from medication-related risks.

DISCLOSURE REQUIREMENT
All residents must disclose all medications (prescription, OTC, vitamins, supplements) at intake. New prescriptions must be disclosed within 24 hours.

STORAGE
• All prescription medications must be stored in a designated locked medication cabinet.
• Residents do not store medications in bedrooms (exception: rescue inhalers, EpiPens, and insulin as approved by staff).
• Controlled substances (Schedule II–V) require additional documentation.

SELF-ADMINISTRATION
Residents self-administer their own medications. Staff do not administer medications unless the facility holds an appropriate license.

OVER-THE-COUNTER MEDICATIONS
• OTC medications containing DXM (Dextromethorphan) — e.g., NyQuil, Robitussin — must be approved by staff.
• OTC medications must be stored with prescription medications if containing controlled-schedule ingredients.

${matFriendly
  ? `MAT MEDICATIONS
• Residents prescribed medication-assisted treatment (Suboxone/buprenorphine, Vivitrol/naltrexone, methadone) are welcome.
• Documentation required: current prescription from licensed provider.
• Methadone patients must provide documentation of clinic enrollment.
• MAT medications are stored in the locked medication cabinet.
• Residents attend their clinic or prescriber as required and provide verification.`
  : `MAT MEDICATIONS
• This program does not accept residents currently on MAT medications (buprenorphine, methadone) unless an exception has been approved in writing by the program director.
• Residents who are prescribed MAT after move-in must immediately notify the house manager.`}

MEDICATION DISPOSAL
• Expired or discontinued medications must be surrendered to staff for disposal.
• Medications are disposed of at a community drug take-back location.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resident Signature: ____________________________
Date: ________________________________________
`.trim(),
  },

  {
    key: "grievance_appeals",
    title: "Grievance & Appeals Procedure",
    generate: ({ orgName }) => `
${orgName.toUpperCase()}
GRIEVANCE & APPEALS PROCEDURE
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE
${orgName} is committed to addressing resident concerns fairly and promptly. This procedure ensures residents have a voice and that issues are investigated and resolved.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILING A GRIEVANCE

Step 1 — Informal Resolution
First, try to resolve the issue directly with the house manager. Most issues can be resolved at this level within 48 hours.

Step 2 — Written Grievance
If informal resolution fails:
• Complete a Grievance Form (available from house manager)
• Describe the issue, date(s), parties involved, and desired resolution
• Submit to house manager or program director

Step 3 — Investigation (within 5 business days)
• Program director or designee investigates
• All parties interviewed
• Documentation reviewed
• Written response issued within 5 business days

Step 4 — Appeal
If dissatisfied with the outcome:
• Submit written appeal to ownership/management within 3 days of receiving response
• Final determination issued within 7 business days
• Ownership decision is final

EXTERNAL REPORTING
Residents may also contact:
• AzRHA (if certified): azrha.org — for concerns about standards compliance
• ADHS (if licensed): azdhs.gov — for licensed facilities only
• HUD / Fair Housing: 1-800-669-9777 — for fair housing violations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NON-RETALIATION
No resident will face adverse action for filing a good-faith grievance. Retaliation by staff or other residents is a serious violation.
`.trim(),
  },

  {
    key: "discharge_transition",
    title: "Discharge & Transition Planning Policy",
    generate: ({ orgName }) => `
${orgName.toUpperCase()}
DISCHARGE & TRANSITION PLANNING POLICY
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPES OF DISCHARGE

VOLUNTARY DISCHARGE
• Resident provides minimum 7-day written notice
• Staff assists with transition planning (next housing, treatment referrals)
• Deposit refunded per occupancy agreement terms
• Property retrieval: resident retrieves all belongings on agreed departure date

PROGRAM COMPLETION
• Resident has met all program goals and is ready to transition to independent living
• Discharge planning begins 30 days before departure
• Staff provides referrals for independent housing, continued recovery support, and ongoing care

INVOLUNTARY DISCHARGE — Non-Immediate
• Written 3-day notice for non-payment, repeated violations, failure to meet program requirements
• Resident may appeal to program director within 24 hours
• If appeal upheld, resident remains; if denied, must vacate by stated time

INVOLUNTARY DISCHARGE — Immediate
• No advance notice required for: substance use, violence, theft, weapons possession, tampered drug test
• Resident must vacate within [2–24 hours, depending on circumstances]
• Staff will assist with emergency shelter referrals
• Property: resident retrieves belongings within [48–72 hours] with staff present

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRANSITION PLANNING SUPPORT
${orgName} staff will, where possible:
• Provide a list of alternative housing options
• Facilitate warm handoffs to treatment providers if appropriate
• Provide documentation of program participation for court/probation purposes
• Return all resident property and medications

RE-ENTRY CRITERIA
Former residents may apply for re-entry after:
• Immediate discharge: minimum 30-day waiting period, documented sobriety required
• All outstanding balances must be paid
• Review by program director required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ABANDONED PROPERTY
If a resident leaves without notice, personal property is held for 14 days. After 14 days, items may be donated or discarded per Arizona law.
`.trim(),
  },

  {
    key: "confidentiality_privacy",
    title: "Confidentiality & Privacy Policy",
    generate: ({ orgName }) => `
${orgName.toUpperCase()}
CONFIDENTIALITY & PRIVACY POLICY
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE
${orgName} respects the privacy of all residents and is committed to protecting personal information in accordance with applicable law.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT WE COLLECT
• Name, contact information, emergency contacts
• Intake information including substance use history
• Drug testing results
• Incident reports
• Payment records

HOW WE USE YOUR INFORMATION
• To provide housing and program services
• To maintain safety of all residents
• To comply with legal obligations (mandatory reporting)
• To communicate with emergency contacts in case of emergency

WHAT WE SHARE (AND WITH WHOM)
We do NOT share resident information with outside parties without written consent, EXCEPT:
• Emergency contacts — in case of medical emergency
• Law enforcement — when legally required (crime report, court order, mandatory reporting)
• Treatment providers — only with resident's written authorization
• Referral sources — aggregate occupancy data only (no names)

42 CFR PART 2 NOTE
If ${orgName} is affiliated with a federally-assisted substance use treatment program, disclosures are subject to 42 CFR Part 2 regulations, which provide stronger protections than standard HIPAA. In that case, a separate consent form is required for any disclosure.

STAFF CONFIDENTIALITY
All staff and volunteers are required to maintain resident confidentiality. Staff may not discuss residents by name outside the program context.

RESIDENT CONFIDENTIALITY
Residents are also expected to maintain the confidentiality of other residents. Sharing another resident's personal information outside the house is a violation of this policy and the Code of Conduct.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resident Signature: ____________________________
Date: ________________________________________
`.trim(),
  },

  {
    key: "fair_housing",
    title: "Fair Housing Compliance Statement",
    generate: ({ orgName }) => `
${orgName.toUpperCase()}
FAIR HOUSING COMPLIANCE STATEMENT
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FEDERAL FAIR HOUSING COMMITMENT

${orgName} is committed to full compliance with the federal Fair Housing Act (42 U.S.C. § 3601 et seq.) and the Americans with Disabilities Act (ADA), as applicable.

We do not discriminate on the basis of:
• Race, color, national origin
• Religion
• Sex (including gender identity and sexual orientation)
• Familial status
• Disability (including physical and mental health disabilities)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INDIVIDUALS IN RECOVERY AS A PROTECTED CLASS

Individuals who are in recovery from substance use disorder — and who are not currently using illegal substances — are considered to have a disability protected under the Fair Housing Act and the ADA. This protection applies regardless of prior criminal history related to substance use.

${orgName} serves this protected class and is entitled to operate as a recovery residence in residential zones under the Fair Housing Act's reasonable accommodation provisions.

We believe in the rights of people in recovery to live in residential neighborhoods and access community resources like any other resident.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REASONABLE ACCOMMODATION

If you require a reasonable accommodation due to a disability (including mental health conditions, physical disabilities, or recovery-related needs), please notify the house manager in writing. We will engage in an interactive process to identify appropriate accommodations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPLAINTS

If you believe you have experienced housing discrimination, you may contact:
• HUD Fair Housing Hotline: 1-800-669-9777
• Arizona Attorney General: 602-542-5763
• Housing Rights Center (Arizona)

This statement does not apply to properties or programs that lawfully exclude based on specific criteria (e.g., gender-specific housing under 42 U.S.C. § 3607(b)).
`.trim(),
  },

  {
    key: "staff_roles",
    title: "Staff Roles & Responsibilities",
    generate: ({ orgName, narrLevel }) => `
${orgName.toUpperCase()}
STAFF ROLES & RESPONSIBILITIES
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
NARR Level ${narrLevel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOUSE MANAGER — Job Description

ROLE SUMMARY
The House Manager is responsible for daily operations of ${orgName}, ensuring a safe, structured, substance-free environment for all residents.

MINIMUM QUALIFICATIONS
• Minimum 1 year continuous sobriety (2 years strongly preferred)
• High school diploma or equivalent
• Valid Arizona ID
• Level 1 Fingerprint Clearance Card (or willing to obtain within 30 days)
• CPR/First Aid certification (or willing to obtain within 30 days)
• Mandatory Reporter certification (or willing to complete online within 14 days)
• Fair Housing training completion (free HUD online course)
• Naloxone (Narcan) training

CORE RESPONSIBILITIES
• Maintain house rules and hold residents accountable
• Conduct or oversee drug testing per policy schedule
• Conduct weekly house meetings
• Complete intake and discharge paperwork
• Maintain resident files (physical and/or digital)
• Log incidents in SoberOps system within 24 hours
• Conduct or oversee chore inspections
• Coordinate maintenance and property issues with ownership
• Serve as emergency contact for residents

ON-CALL EXPECTATIONS
• Available by phone 24/7 for emergencies
• Respond to on-site emergencies within [30/60 minutes] if off-site

MANDATORY REPORTING
Arizona requires certain individuals to report suspected child abuse and vulnerable adult abuse. House managers are typically mandated reporters by virtue of their position. Complete training at: mandatedreporter.arizona.gov

${narrLevel === "III" || narrLevel === "IV" ? `
ADDITIONAL STAFF (Level ${narrLevel})
• Case Manager: Provides individual support, connects residents to services, monitors goals
• Peer Support Specialist: Lived experience in recovery; facilitates groups and peer check-ins
• On-call Supervisor: Licensed clinical staff available for escalated situations
` : ""}

SUPERVISION STRUCTURE
House Manager reports to: Program Director / Ownership

PERFORMANCE EXPECTATIONS
• Maintain confidentiality at all times
• Model recovery values in all interactions
• Document incidents and resident interactions accurately
• Participate in ongoing training (minimum 8 hours/year)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Staff Acknowledgment:
Name: ________________________________
Signature: ____________________________
Date: ________________________________
`.trim(),
  },
];

export function generateDocument(
  key: string,
  params: PolicyTemplateParams
): { title: string; content: string } | null {
  const template = policyTemplates.find((t) => t.key === key);
  if (!template) return null;
  return {
    title: template.title,
    content: template.generate(params),
  };
}
