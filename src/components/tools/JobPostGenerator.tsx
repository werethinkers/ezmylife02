import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Briefcase, Copy, Download, Plus, Trash2 } from "lucide-react";

const employmentTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance"
];

const experienceLevels = [
  "Entry Level (0-1 years)",
  "Junior (1-3 years)",
  "Mid-Level (3-5 years)",
  "Senior (5-8 years)",
  "Lead/Manager (8+ years)",
  "Executive"
];

const workModes = [
  "On-site",
  "Remote",
  "Hybrid"
];

export const JobPostGenerator = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [benefits, setBenefits] = useState<string[]>([""]);
  const [skills, setSkills] = useState("");
  const [applicationEmail, setApplicationEmail] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, items: string[]) => {
    setter([...items, ""]);
  };

  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, items: string[], index: number) => {
    if (items.length > 1) {
      setter(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, items: string[], index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setter(newItems);
  };

  const generateJobPost = () => {
    if (!jobTitle || !companyName) {
      toast.error("Please fill in job title and company name");
      return;
    }

    const filteredResponsibilities = responsibilities.filter(r => r.trim());
    const filteredRequirements = requirements.filter(r => r.trim());
    const filteredBenefits = benefits.filter(b => b.trim());

    const salaryRange = salaryMin && salaryMax 
      ? `₹${parseInt(salaryMin).toLocaleString('en-IN')} - ₹${parseInt(salaryMax).toLocaleString('en-IN')} per annum`
      : salaryMin 
        ? `₹${parseInt(salaryMin).toLocaleString('en-IN')}+ per annum`
        : "Competitive salary based on experience";

    const post = `
🚀 WE ARE HIRING!

📌 Position: ${jobTitle}
🏢 Company: ${companyName}
${location ? `📍 Location: ${location}` : ''}
${employmentType ? `⏰ Type: ${employmentType}` : ''}
${workMode ? `🏠 Work Mode: ${workMode}` : ''}
${experienceLevel ? `📊 Experience: ${experienceLevel}` : ''}
💰 Salary: ${salaryRange}

━━━━━━━━━━━━━━━━━━━━━━━━

📝 ABOUT THE ROLE:
${jobDescription || `We are looking for a talented ${jobTitle} to join our growing team at ${companyName}. This is an exciting opportunity to work on challenging projects and grow your career.`}

${filteredResponsibilities.length > 0 ? `
🎯 KEY RESPONSIBILITIES:
${filteredResponsibilities.map(r => `• ${r}`).join('\n')}
` : ''}

${filteredRequirements.length > 0 ? `
✅ REQUIREMENTS:
${filteredRequirements.map(r => `• ${r}`).join('\n')}
` : ''}

${skills ? `
🛠️ SKILLS REQUIRED:
${skills.split(',').map(s => s.trim()).filter(s => s).map(s => `• ${s}`).join('\n')}
` : ''}

${filteredBenefits.length > 0 ? `
🎁 WHAT WE OFFER:
${filteredBenefits.map(b => `• ${b}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━

📩 HOW TO APPLY:
${applicationEmail 
  ? `Send your resume to: ${applicationEmail}`
  : 'Interested candidates can apply by sending their resume with the subject line "Application for ' + jobTitle + '"'}

We look forward to hearing from you! 🙌

#Hiring #JobOpening #${jobTitle.replace(/\s+/g, '')} #Careers ${companyName.replace(/\s+/g, '')}
`.trim();

    setGeneratedPost(post);
    toast.success("Job post generated!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    toast.success("Copied to clipboard!");
  };

  const downloadPost = () => {
    const blob = new Blob([generatedPost], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${jobTitle.replace(/\s+/g, '-')}-job-post.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Job Post Generator
          </CardTitle>
          <CardDescription>Create professional job postings for social media and job boards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Title *</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Mumbai, India"
              />
            </div>
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Work Mode</Label>
              <Select value={workMode} onValueChange={setWorkMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {workModes.map(mode => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Salary Min (₹/year)</Label>
              <Input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="e.g., 500000"
              />
            </div>
            <div className="space-y-2">
              <Label>Salary Max (₹/year)</Label>
              <Input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="e.g., 800000"
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label>Job Description</Label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Brief description of the role and what the candidate will be doing..."
              rows={3}
            />
          </div>

          {/* Responsibilities */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Key Responsibilities</Label>
              <Button variant="ghost" size="sm" onClick={() => addItem(setResponsibilities, responsibilities)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {responsibilities.map((resp, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={resp}
                  onChange={(e) => updateItem(setResponsibilities, responsibilities, index, e.target.value)}
                  placeholder={`Responsibility ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(setResponsibilities, responsibilities, index)}
                  disabled={responsibilities.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Requirements</Label>
              <Button variant="ghost" size="sm" onClick={() => addItem(setRequirements, requirements)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {requirements.map((req, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={req}
                  onChange={(e) => updateItem(setRequirements, requirements, index, e.target.value)}
                  placeholder={`Requirement ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(setRequirements, requirements, index)}
                  disabled={requirements.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Required Skills (comma-separated)</Label>
            <Input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g., React, Node.js, MongoDB, TypeScript"
            />
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Benefits & Perks</Label>
              <Button variant="ghost" size="sm" onClick={() => addItem(setBenefits, benefits)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={benefit}
                  onChange={(e) => updateItem(setBenefits, benefits, index, e.target.value)}
                  placeholder={`Benefit ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(setBenefits, benefits, index)}
                  disabled={benefits.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {/* Application Email */}
          <div className="space-y-2">
            <Label>Application Email</Label>
            <Input
              type="email"
              value={applicationEmail}
              onChange={(e) => setApplicationEmail(e.target.value)}
              placeholder="hr@company.com"
            />
          </div>

          <Button onClick={generateJobPost} className="w-full" size="lg">
            <Briefcase className="h-5 w-5 mr-2" /> Generate Job Post
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {generatedPost && (
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Generated Job Post</CardTitle>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
              <Button onClick={downloadPost} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-lg max-h-[500px] overflow-auto">
              {generatedPost}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
