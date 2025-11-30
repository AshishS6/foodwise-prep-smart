import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { Header } from "@/components/layout/Header";
import Recipes from "./Recipes";
import PrepPlans from "./PrepPlans";

const PrepSection = () => {
  const { isMobile } = useDeviceDetection();
  const [activeTab, setActiveTab] = useState("recipes");

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <MobileHeader title="Prep" />
      ) : (
        <Header />
      )}

      <MobileContainer className="md:container md:mx-auto md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
            <TabsTrigger value="prep-plans">Prep Plans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recipes" className="mt-0 -mx-4 md:-mx-6">
            <Recipes />
          </TabsContent>
          
          <TabsContent value="prep-plans" className="mt-0 -mx-4 md:-mx-6">
            <PrepPlans />
          </TabsContent>
        </Tabs>
      </MobileContainer>
    </div>
  );
};

export default PrepSection;

