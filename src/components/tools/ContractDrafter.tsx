import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, FileCheck, Copy, Building2, User } from "lucide-react";
import { usePrefill, useWriteBack } from "@/apps/lib/context";
import { ContextBanner } from "@/apps/shell/ContextBanner";

const contractTypes = [
  { value: "service", label: "Service Agreement" },
  { value: "freelance", label: "Freelance Contract" },
  { value: "nda", label: "Non-Disclosure Agreement (NDA)" },
  { value: "employment", label: "Employment Contract" },
  { value: "vendor", label: "Vendor Agreement" },
  { value: "rental", label: "Rental/Lease Agreement" },
];

export const ContractDrafter = () => {
  const [contractType, setContractType] = useState("");
  const [partyAName, setPartyAName] = useState("");
  const [partyAAddress, setPartyAAddress] = useState("");
  const [partyBName, setPartyBName] = useState("");
  const [partyBAddress, setPartyBAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [additionalTerms, setAdditionalTerms] = useState("");
  const [generatedContract, setGeneratedContract] = useState("");

  // Workspace: you are Party A, the current client is Party B; the engagement fee and service
  // carry over (or the last invoice total).
  usePrefill((ctx, p) => {
    setPartyAName((v) => v || p.businessName || "");
    setPartyAAddress((v) => v || [p.address, p.city].filter(Boolean).join(", "));
    setPartyBName((v) => v || ctx.client?.name || "");
    setPartyBAddress((v) => v || ctx.client?.address || "");
    setScopeOfWork((v) => v || ctx.engagement?.service || "");
    const fee = ctx.engagement?.fee || (ctx.lastInvoice?.total ? String(Math.round(ctx.lastInvoice.total)) : "");
    setPaymentAmount((v) => v || fee);
    if (ctx.engagement?.start) setStartDate((v) => v || ctx.engagement!.start!);
    if (ctx.engagement?.end) setEndDate((v) => v || ctx.engagement!.end!);
  });
  useWriteBack({ partyBName, partyBAddress, scopeOfWork, paymentAmount }, (v) => ({
    ...(v.partyBName ? { client: { name: v.partyBName, address: v.partyBAddress } } : {}),
    ...(v.scopeOfWork || v.paymentAmount ? { engagement: { service: v.scopeOfWork, fee: v.paymentAmount } } : {}),
  }));

  const generateContract = () => {
    if (!contractType || !partyAName || !partyBName) {
      toast.error("Please fill in the required fields");
      return;
    }

    const contractDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    
    let contractContent = "";
    
    switch (contractType) {
      case "service":
        contractContent = generateServiceAgreement();
        break;
      case "freelance":
        contractContent = generateFreelanceContract();
        break;
      case "nda":
        contractContent = generateNDA();
        break;
      case "employment":
        contractContent = generateEmploymentContract();
        break;
      case "vendor":
        contractContent = generateVendorAgreement();
        break;
      case "rental":
        contractContent = generateRentalAgreement();
        break;
      default:
        contractContent = generateServiceAgreement();
    }

    setGeneratedContract(contractContent);
    toast.success("Contract generated successfully!");
  };

  const generateServiceAgreement = () => {
    return `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of ${startDate || "[Date]"}

BETWEEN:

${partyAName} ("Service Provider")
${partyAAddress ? `Address: ${partyAAddress}` : ""}

AND

${partyBName} ("Client")
${partyBAddress ? `Address: ${partyBAddress}` : ""}

1. SCOPE OF SERVICES
${scopeOfWork || "The Service Provider agrees to provide the following services to the Client: [Describe services in detail]"}

2. TERM
This Agreement shall commence on ${startDate || "[Start Date]"} and shall continue until ${endDate || "[End Date]"} unless terminated earlier in accordance with this Agreement.

3. PAYMENT TERMS
${paymentAmount ? `The Client agrees to pay the Service Provider ₹${paymentAmount} for the services rendered.` : ""}
${paymentTerms || "Payment shall be made within 30 days of invoice receipt."}

4. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of any proprietary information shared during the course of this Agreement.

5. INTELLECTUAL PROPERTY
All work product created under this Agreement shall be the property of the Client upon full payment.

6. TERMINATION
Either party may terminate this Agreement with 30 days written notice.

7. LIMITATION OF LIABILITY
The Service Provider's liability shall be limited to the total amount paid under this Agreement.

8. GOVERNING LAW
This Agreement shall be governed by the laws of India.

${additionalTerms ? `9. ADDITIONAL TERMS\n${additionalTerms}` : ""}

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.


_______________________                    _______________________
${partyAName}                              ${partyBName}
(Service Provider)                         (Client)

Date: ________________                     Date: ________________`;
  };

  const generateFreelanceContract = () => {
    return `FREELANCE SERVICE CONTRACT

Date: ${startDate || "[Date]"}

BETWEEN:

Freelancer: ${partyAName}
${partyAAddress ? `Address: ${partyAAddress}` : ""}

AND

Client: ${partyBName}
${partyBAddress ? `Address: ${partyBAddress}` : ""}

1. PROJECT DESCRIPTION
${scopeOfWork || "[Describe the project/work to be completed]"}

2. DELIVERABLES
The Freelancer agrees to deliver the following:
- [List deliverables]

3. TIMELINE
- Start Date: ${startDate || "[Start Date]"}
- End Date: ${endDate || "[End Date]"}

4. COMPENSATION
${paymentAmount ? `Total Project Fee: ₹${paymentAmount}` : "Total Project Fee: [Amount]"}
${paymentTerms || "Payment Terms: 50% advance, 50% on completion"}

5. REVISIONS
This contract includes [X] rounds of revisions. Additional revisions will be billed separately.

6. OWNERSHIP
Upon full payment, all intellectual property rights transfer to the Client.

7. CONFIDENTIALITY
Both parties agree to keep all project details confidential.

8. INDEPENDENT CONTRACTOR
The Freelancer is an independent contractor and not an employee of the Client.

${additionalTerms ? `9. ADDITIONAL TERMS\n${additionalTerms}` : ""}

AGREED AND ACCEPTED:

_______________________                    _______________________
${partyAName}                              ${partyBName}
Freelancer                                 Client`;
  };

  const generateNDA = () => {
    return `NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement is entered into as of ${startDate || "[Date]"}

BETWEEN:

Disclosing Party: ${partyAName}
${partyAAddress ? `Address: ${partyAAddress}` : ""}

AND

Receiving Party: ${partyBName}
${partyBAddress ? `Address: ${partyBAddress}` : ""}

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any and all information disclosed by the Disclosing Party, including but not limited to:
- Business plans and strategies
- Technical data and specifications
- Customer lists and information
- Financial information
- Trade secrets

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to:
- Hold all Confidential Information in strict confidence
- Not disclose Confidential Information to any third party
- Use Confidential Information only for the agreed purpose
- Return or destroy all Confidential Information upon request

3. EXCEPTIONS
This Agreement does not apply to information that:
- Is or becomes publicly known through no fault of the Receiving Party
- Was known to the Receiving Party prior to disclosure
- Is independently developed by the Receiving Party

4. TERM
This Agreement shall remain in effect for a period of ${endDate ? `until ${endDate}` : "[X] years"} from the date of signing.

5. GOVERNING LAW
This Agreement shall be governed by the laws of India.

6. REMEDIES
The Receiving Party acknowledges that breach of this Agreement may cause irreparable harm and agrees that the Disclosing Party may seek injunctive relief.

${additionalTerms ? `7. ADDITIONAL TERMS\n${additionalTerms}` : ""}

AGREED AND ACCEPTED:

_______________________                    _______________________
${partyAName}                              ${partyBName}
Disclosing Party                          Receiving Party

Date: ________________                     Date: ________________`;
  };

  const generateEmploymentContract = () => {
    return `EMPLOYMENT CONTRACT

Date: ${startDate || "[Date]"}

BETWEEN:

Employer: ${partyAName}
${partyAAddress ? `Address: ${partyAAddress}` : ""}

AND

Employee: ${partyBName}
${partyBAddress ? `Address: ${partyBAddress}` : ""}

1. POSITION
The Employee is hired for the position of: [Job Title]

2. DUTIES
${scopeOfWork || "The Employee shall perform the following duties: [Describe responsibilities]"}

3. COMMENCEMENT DATE
Employment shall commence on ${startDate || "[Start Date]"}

4. COMPENSATION
${paymentAmount ? `Monthly Salary: ₹${paymentAmount}` : "Monthly Salary: [Amount]"}
${paymentTerms || "Salary shall be paid on the last working day of each month."}

5. WORKING HOURS
Standard working hours are [X] hours per week, [Days] to [Days].

6. LEAVE ENTITLEMENT
- Annual Leave: [X] days
- Sick Leave: [X] days
- Casual Leave: [X] days

7. PROBATION PERIOD
The first [X] months of employment shall be a probation period.

8. TERMINATION
Either party may terminate this contract with [X] days written notice.

9. CONFIDENTIALITY
The Employee agrees to maintain confidentiality of all company information.

10. NON-COMPETE
The Employee agrees not to engage in competing business for [X] months after termination.

${additionalTerms ? `11. ADDITIONAL TERMS\n${additionalTerms}` : ""}

AGREED AND ACCEPTED:

_______________________                    _______________________
${partyAName}                              ${partyBName}
Employer                                   Employee

Date: ________________                     Date: ________________`;
  };

  const generateVendorAgreement = () => {
    return `VENDOR AGREEMENT

This Vendor Agreement is entered into as of ${startDate || "[Date]"}

BETWEEN:

Company: ${partyAName}
${partyAAddress ? `Address: ${partyAAddress}` : ""}

AND

Vendor: ${partyBName}
${partyBAddress ? `Address: ${partyBAddress}` : ""}

1. PRODUCTS/SERVICES
${scopeOfWork || "The Vendor agrees to supply the following products/services: [Describe products/services]"}

2. TERM
This Agreement shall be effective from ${startDate || "[Start Date]"} to ${endDate || "[End Date]"}.

3. PRICING AND PAYMENT
${paymentAmount ? `Total Value: ₹${paymentAmount}` : ""}
${paymentTerms || "Payment Terms: Net 30 days from invoice date."}

4. DELIVERY
Delivery shall be made to [Location] within [X] days of order placement.

5. QUALITY STANDARDS
All products/services must meet the quality standards specified by the Company.

6. WARRANTY
The Vendor warrants that all products/services shall be free from defects for a period of [X] months.

7. INDEMNIFICATION
The Vendor shall indemnify the Company against any claims arising from the products/services supplied.

8. TERMINATION
Either party may terminate with [X] days written notice.

${additionalTerms ? `9. ADDITIONAL TERMS\n${additionalTerms}` : ""}

AGREED AND ACCEPTED:

_______________________                    _______________________
${partyAName}                              ${partyBName}
Company                                    Vendor`;
  };

  const generateRentalAgreement = () => {
    return `RENTAL/LEASE AGREEMENT

This Agreement is made on ${startDate || "[Date]"}

BETWEEN:

Landlord/Lessor: ${partyAName}
${partyAAddress ? `Address: ${partyAAddress}` : ""}

AND

Tenant/Lessee: ${partyBName}
${partyBAddress ? `Address: ${partyBAddress}` : ""}

1. PROPERTY DESCRIPTION
${scopeOfWork || "The Landlord agrees to rent the following property: [Property Address and Description]"}

2. TERM OF LEASE
- Start Date: ${startDate || "[Start Date]"}
- End Date: ${endDate || "[End Date]"}

3. RENT
${paymentAmount ? `Monthly Rent: ₹${paymentAmount}` : "Monthly Rent: [Amount]"}
${paymentTerms || "Rent is due on the 1st of each month."}

4. SECURITY DEPOSIT
A security deposit of ₹[Amount] is payable upon signing.

5. UTILITIES
[Specify which utilities are included/excluded]

6. MAINTENANCE
The Tenant shall maintain the property in good condition.

7. ALTERATIONS
No alterations shall be made without prior written consent of the Landlord.

8. TERMINATION
Either party may terminate with [X] months written notice.

9. GOVERNING LAW
This Agreement is governed by the laws of India and [State] Rent Control Act.

${additionalTerms ? `10. ADDITIONAL TERMS\n${additionalTerms}` : ""}

AGREED AND ACCEPTED:

_______________________                    _______________________
${partyAName}                              ${partyBName}
Landlord                                   Tenant

Date: ________________                     Date: ________________`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContract);
    toast.success("Contract copied to clipboard!");
  };

  const downloadContract = () => {
    const blob = new Blob([generatedContract], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contractType}-contract-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contract downloaded!");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <ContextBanner show={["client", "invoice"]} />
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-primary" />
            Contract Drafter
          </CardTitle>
          <CardDescription>Generate professional legal contracts and agreements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contract Type */}
          <div className="space-y-2">
            <Label>Contract Type *</Label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger>
                <SelectValue placeholder="Select contract type" />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Party A */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> First Party Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name/Company *</Label>
                <Input
                  value={partyAName}
                  onChange={(e) => setPartyAName(e.target.value)}
                  placeholder="Company or Individual Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={partyAAddress}
                  onChange={(e) => setPartyAAddress(e.target.value)}
                  placeholder="Full Address"
                />
              </div>
            </div>
          </div>

          {/* Party B */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" /> Second Party Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name/Company *</Label>
                <Input
                  value={partyBName}
                  onChange={(e) => setPartyBName(e.target.value)}
                  placeholder="Company or Individual Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={partyBAddress}
                  onChange={(e) => setPartyBAddress(e.target.value)}
                  placeholder="Full Address"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <Label>Scope of Work / Services</Label>
            <Textarea
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              placeholder="Describe the work, services, or subject matter of this contract..."
              rows={3}
            />
          </div>

          {/* Payment */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Amount (₹)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Total contract value"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g., 50% advance, 50% on completion"
              />
            </div>
          </div>

          {/* Additional Terms */}
          <div className="space-y-2">
            <Label>Additional Terms & Conditions</Label>
            <Textarea
              value={additionalTerms}
              onChange={(e) => setAdditionalTerms(e.target.value)}
              placeholder="Any additional clauses or conditions..."
              rows={3}
            />
          </div>

          <Button onClick={generateContract} className="w-full" size="lg">
            <FileCheck className="h-5 w-5 mr-2" /> Generate Contract
          </Button>
        </CardContent>
      </Card>

      {/* Generated Contract Preview */}
      {generatedContract && (
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Generated Contract</CardTitle>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
              <Button onClick={downloadContract} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-lg max-h-[500px] overflow-auto font-mono">
              {generatedContract}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
