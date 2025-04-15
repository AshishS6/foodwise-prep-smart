
import POSContainer from "@/components/POS/POSContainer";
import { Helmet } from "react-helmet";
import { useEffect } from "react";

const POS = () => {
  useEffect(() => {
    // Log when POS component is mounted
    console.log("POS page loaded");
    
    // This helps in diagnosing any rendering issues
    return () => {
      console.log("POS page unmounted");
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Point of Sale - Payasakkada</title>
      </Helmet>
      <div className="bg-background min-h-screen">
        <POSContainer />
      </div>
    </>
  );
};

export default POS;
