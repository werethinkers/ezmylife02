import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Rocket, Bell } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const ToolPreview = () => {
  const { toolId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { name, description, sector, department, isLive } = location.state || {
    name: "Tool",
    description: "This tool is coming soon.",
    sector: "",
    department: "",
    isLive: false
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 md:py-20">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>

        <div className="max-w-2xl mx-auto text-center">
          <Card className="border-border/50 overflow-hidden">
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent py-12">
              <div className="flex justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 text-amber-600">
                  <Clock className="h-10 w-10" />
                </div>
              </div>
              
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 mb-4">
                <Rocket className="h-3 w-3 mr-1" />
                Coming Soon
              </Badge>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {name}
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                {description}
              </p>
              
              {sector && (
                <p className="text-sm text-muted-foreground mt-4">
                  Optimized for <span className="font-medium text-foreground">{sector}</span>
                </p>
              )}
            </div>
            
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-xl p-6 text-center">
                  <h2 className="text-xl font-semibold mb-2">
                    This tool is launching shortly
                  </h2>
                  <p className="text-muted-foreground">
                    We're building this tool for you. It will be available soon with all the features you need.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/tools")}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Explore Other Tools
                  </Button>
                  <Button className="gap-2">
                    <Bell className="h-4 w-4" />
                    Notify Me When Ready
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ToolPreview;
