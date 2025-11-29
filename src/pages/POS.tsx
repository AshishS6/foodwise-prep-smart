
import POSContainer from "@/components/POS/POSContainer";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { Helmet } from "react-helmet";
import { useEffect } from "react";

const POS = () => {
  const { isMobile } = useDeviceDetection();

  useEffect(() => {
    // Log when POS component is mounted
    console.log("POS page loaded");
    
    return () => {
      console.log("POS page unmounted");
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Point of Sale - Payasakkada</title>
      </Helmet>
      {isMobile && <MobileHeader title="Point of Sale" />}
      <div className="bg-background min-h-screen">
        <POSContainer />
      </div>
    </>
  );
};

export default POS;
